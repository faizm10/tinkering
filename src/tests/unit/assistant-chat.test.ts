import { describe, expect, it } from "vitest";

import { buildMockAssistantReply, shouldDraftProposal, textFromMessage, titleFromInput, toChatMessage } from "@/server/agent/chat";
import { MemoryDataRepository } from "@/server/providers/data/memory-repository";
import type { SonaeChatMessage } from "@/lib/agent/chat-types";

describe("assistant chat service", () => {
  it("normalizes chat text and titles", () => {
    const message: SonaeChatMessage = {
      id: "message-1",
      role: "user",
      parts: [{ type: "text", text: "  What needs attention today?  " }],
    };

    expect(textFromMessage(message)).toBe("What needs attention today?");
    expect(titleFromInput("Help me plan my move on September 1 with utilities and packing")).toContain("...");
    expect(shouldDraftProposal("Can you draft a plan for my move?")).toBe(true);
  });

  it("persists and converts memory-backed chat messages", async () => {
    const repository = new MemoryDataRepository();
    const userId = `assistant-chat-${Date.now()}`;
    const conversation = await repository.createAgentConversation(userId, "Ask Sonae");

    const record = await repository.appendAgentMessage(userId, {
      conversationId: conversation.id,
      role: "user",
      partsJson: [{ type: "text", text: "What should I do today?" }],
      metadataJson: { createdAt: "2026-08-28T12:00:00.000Z" },
    });

    const [message] = await repository.listAgentMessages(userId, conversation.id);
    expect(message.id).toBe(record.id);
    expect(toChatMessage(message).parts[0]).toEqual({ type: "text", text: "What should I do today?" });
  });

  it("answers from Sonae context without external AI credentials", async () => {
    const repository = new MemoryDataRepository();
    const reply = await buildMockAssistantReply({
      userId: "demo-user",
      input: "What needs attention today?",
      repository,
    });

    expect(reply.text).toContain("Today");
    expect(reply.ledger.length).toBeGreaterThan(0);
    expect(reply.proposal).toBeNull();
  });
});
