import { createUIMessageStream, createUIMessageStreamResponse, gateway, streamText, type InferUIMessageChunk } from "ai";

import { getCurrentUser } from "@/lib/auth/session";
import { getDataRepository } from "@/server/providers";
import { buildMockAssistantReply, textFromMessage, titleFromInput } from "@/server/agent/chat";
import type { SonaeChatMessage } from "@/lib/agent/chat-types";
import { env, hasAIGateway } from "@/lib/env";

export const maxDuration = 60;

type ChatRequest = {
  id?: string;
  messages?: SonaeChatMessage[];
};

function words(text: string) {
  return text.match(/\S+\s*/g) ?? [];
}

function latestUserMessage(messages: SonaeChatMessage[]) {
  return messages.findLast((message) => message.role === "user");
}

function chatChunk(chunk: InferUIMessageChunk<SonaeChatMessage>) {
  return chunk;
}

function gatewayPrompt(input: string, reply: Awaited<ReturnType<typeof buildMockAssistantReply>>) {
  return [
    `User message: ${input}`,
    "",
    "Computed Sonae response facts:",
    reply.text,
    "",
    "Ledger items:",
    reply.ledger.length
      ? reply.ledger.map((item) => `- ${item.label}: ${item.title} (${item.detail})`).join("\n")
      : "- None",
    "",
    reply.proposal
      ? [
          "Draft proposal:",
          `- Title: ${reply.proposal.title}`,
          `- Summary: ${reply.proposal.summary}`,
          `- Counts: ${reply.proposal.tasksCount} tasks, ${reply.proposal.remindersCount} reminders, ${reply.proposal.waitingCount} waiting items`,
        ].join("\n")
      : "Draft proposal: none",
  ].join("\n");
}

async function* assistantTextStream(input: string, reply: Awaited<ReturnType<typeof buildMockAssistantReply>>) {
  if (!hasAIGateway()) {
    yield* words(reply.text);
    return;
  }

  try {
    const result = streamText({
      model: gateway(env.AI_GATEWAY_MODEL),
      system: [
        "You are Sonae, a concise life-admin assistant inside the user's planning app.",
        "Answer only from the computed facts provided by the server.",
        "Do not claim that tasks, reminders, or waiting items were saved unless a draft proposal is explicitly listed.",
        "When a draft proposal exists, tell the user it needs review before changes are applied.",
        "Keep the answer under 120 words and do not restate the ledger item-by-item.",
      ].join(" "),
      prompt: gatewayPrompt(input, reply),
      maxOutputTokens: 220,
    });

    let emitted = false;
    for await (const delta of result.textStream) {
      emitted = emitted || delta.length > 0;
      yield delta;
    }

    if (!emitted) yield* words(reply.text);
  } catch {
    yield* words(reply.text);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in before chatting with Sonae.", { status: 401 });

  const body = (await request.json()) as ChatRequest;
  const messages = body.messages ?? [];
  const userMessage = latestUserMessage(messages);
  const input = textFromMessage(userMessage);
  if (!userMessage || input.length < 2) {
    return new Response("Add a message before asking Sonae.", { status: 400 });
  }

  const repository = getDataRepository();
  const conversation = body.id
    ? await repository.getAgentConversation(user.id, body.id)
    : await repository.createAgentConversation(user.id, titleFromInput(input));
  if (!conversation) return new Response("Conversation not found.", { status: 404 });

  await repository.appendAgentMessage(user.id, {
    conversationId: conversation.id,
    role: "user",
    partsJson: userMessage.parts as Array<Record<string, unknown>>,
    metadataJson: { ...(userMessage.metadata ?? {}), createdAt: new Date().toISOString() },
  });

  const stream = createUIMessageStream<SonaeChatMessage>({
    originalMessages: messages,
    async execute({ writer }) {
      const reply = await buildMockAssistantReply({ userId: user.id, input, repository });
      const createdAt = new Date().toISOString();
      const metadata = {
        createdAt,
        provider: hasAIGateway() ? ("gateway" as const) : ("mock" as const),
        model: hasAIGateway() ? env.AI_GATEWAY_MODEL : reply.model,
      };

      writer.write(chatChunk({ type: "start", messageMetadata: metadata }));
      writer.write(chatChunk({ type: "text-start", id: "answer" }));
      for await (const delta of assistantTextStream(input, reply)) {
        writer.write(chatChunk({ type: "text-delta", id: "answer", delta }));
      }
      writer.write(chatChunk({ type: "text-end", id: "answer" }));

      if (reply.ledger.length) {
        writer.write(chatChunk({
          type: "data-ledger",
          id: "ledger",
          data: { items: reply.ledger },
        }));
      }

      if (reply.proposal) {
        writer.write(chatChunk({
          type: "data-proposal",
          id: `proposal-${reply.proposal.proposalId}`,
          data: reply.proposal,
        }));
      }

      writer.write(chatChunk({ type: "finish", finishReason: "stop", messageMetadata: metadata }));
      writer.setOutcome({ status: "completed" });
    },
    async onEnd({ responseMessage, isAborted }) {
      if (isAborted) return;
      await repository.appendAgentMessage(user.id, {
        conversationId: conversation.id,
        role: "assistant",
        partsJson: responseMessage.parts as Array<Record<string, unknown>>,
        metadataJson: { ...(responseMessage.metadata ?? {}), createdAt: new Date().toISOString() },
      });
    },
    onError() {
      return "Sonae could not answer that message. Try again with a shorter request.";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
