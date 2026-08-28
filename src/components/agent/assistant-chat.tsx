"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowRight, Circle, ClipboardList, Loader2, Send, SquarePen, StopCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import type { AssistantLedgerItem, AssistantProposalPart, SonaeChatMessage } from "@/lib/agent/chat-types";
import type { DashboardData } from "@/server/services/types";
import { cn } from "@/lib/utils";

const starters = [
  "What needs attention today?",
  "What am I waiting on?",
  "Help me plan my move on September 1.",
  "Create a plan for returning a purchase.",
];

export function AssistantChat({
  conversationId,
  initialMessages,
  context,
}: {
  conversationId: string;
  initialMessages: SonaeChatMessage[];
  context: Pick<DashboardData, "today" | "upcoming" | "waiting" | "proposals">;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const transport = useMemo(
    () => new DefaultChatTransport<SonaeChatMessage>({ api: "/api/agent/chat" }),
    [],
  );
  const { messages, sendMessage, status, stop, error } = useChat<SonaeChatMessage>({
    id: conversationId,
    messages: initialMessages,
    transport,
    onFinish() {
      router.refresh();
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const canSend = input.trim().length >= 2 && !busy;

  async function submit(text?: string) {
    const draft = text ?? inputRef.current?.value ?? input;
    const trimmed = draft.trim();
    if (trimmed.length < 2 || busy) return;
    setInput("");
    await sendMessage({ text: trimmed });
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <section className="flex min-h-[38rem] flex-col border border-hairline bg-surface">
        <div className="border-b border-hairline bg-canvas-soft px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="type-section">Ask Sonae</h1>
              <p className="type-meta mt-0.5">Turn loose details into next actions and draft plans.</p>
            </div>
            {busy ? (
              <Button variant="ghost" size="icon" onClick={stop} aria-label="Stop response">
                <StopCircle className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
          {messages.length ? (
            messages.map((message) => <ChatMessage key={message.id} message={message} />)
          ) : (
            <EmptyAssistantState onPick={(prompt) => void submit(prompt)} />
          )}
          {busy ? (
            <div className="flex items-center gap-2 text-[0.8125rem] text-muted">
              <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
              Sonae is reading the ledger.
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="text-[0.875rem] text-error">
              Sonae could not answer that message. Try again with a shorter request.
            </p>
          ) : null}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="border-t border-hairline bg-canvas-soft p-3 sm:p-4"
        >
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              disabled={busy}
              onChange={(event) => setInput(event.target.value)}
              onInput={(event) => setInput(event.currentTarget.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void submit();
                }
              }}
              placeholder="Ask what needs attention, or describe a situation to plan..."
              aria-label="Message Sonae"
              className="min-h-12 flex-1 resize-none bg-surface"
            />
            <Button type="submit" size="touch" disabled={!canSend} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </div>
          <p className="type-meta mt-2">Nothing is saved until you approve a draft plan.</p>
        </form>
      </section>

      <ContextRail context={context} />
    </div>
  );
}

function EmptyAssistantState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid min-h-[22rem] place-items-center">
      <div className="max-w-xl space-y-4 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-[var(--radius-control)] border border-hairline bg-canvas-soft text-primary">
          <SquarePen className="size-5" />
        </div>
        <div>
          <p className="type-card-title">Start with the messy version.</p>
          <p className="type-meta mt-1">Ask about today, follow-ups, or a situation Sonae should turn into a draft.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {starters.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => onPick(starter)}
              className="rounded-[var(--radius-pill)] border border-hairline bg-canvas-soft px-3 py-1.5 text-[0.8125rem] text-body transition-colors duration-[var(--dur-hover)] hover:border-hairline-strong hover:text-ink"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: SonaeChatMessage }) {
  const isUser = message.role === "user";

  return (
    <article className={cn("grid gap-2", isUser ? "justify-items-end" : "justify-items-start")}>
      <div className={cn("max-w-[48rem] space-y-3", isUser ? "w-fit" : "w-full")}>
        <div
          className={cn(
            "border px-3.5 py-3 text-[0.9375rem] leading-relaxed",
            isUser
              ? "rounded-[var(--radius-control)] border-ink/10 bg-ink text-canvas"
              : "border-hairline bg-canvas-soft text-ink",
          )}
        >
          {message.parts.map((part, index) => {
            if (part.type !== "text") return null;
            return (
              <p key={`${message.id}-text-${index}`} className="whitespace-pre-wrap">
                {part.text}
              </p>
            );
          })}
        </div>

        {!isUser
          ? message.parts.map((part, index) => {
              if (part.type === "data-ledger") {
                return <Ledger key={`${message.id}-ledger-${index}`} items={part.data.items} />;
              }
              if (part.type === "data-proposal") {
                return <ProposalCard key={`${message.id}-proposal-${index}`} proposal={part.data} />;
              }
              return null;
            })
          : null}
      </div>
    </article>
  );
}

function Ledger({ items }: { items: AssistantLedgerItem[] }) {
  if (!items.length) return null;

  return (
    <div className="w-full max-w-[48rem] border border-hairline bg-surface">
      <div className="border-b border-hairline px-3 py-2">
        <p className="type-label">Planning ledger</p>
      </div>
      <ul className="divide-y divide-hairline-soft">
        {items.map((item) => (
          <li key={item.id}>
            <LinkOrDiv
              href={item.href}
              className="grid gap-2 px-3 py-2.5 transition-colors duration-[var(--dur-hover)] hover:bg-canvas-soft sm:grid-cols-[7.5rem_minmax(0,1fr)]"
            >
              <span className="flex items-center gap-2 text-[0.8125rem] text-muted">
                <Circle className={cn("size-2 fill-current", toneClass(item.tone))} />
                {item.label}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] text-ink">{item.title}</span>
                {item.detail ? <span className="type-meta block truncate">{item.detail}</span> : null}
              </span>
            </LinkOrDiv>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: AssistantProposalPart }) {
  return (
    <div className="w-full max-w-[48rem] border border-hairline-strong bg-surface p-3">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-primary/10 text-primary">
          <ClipboardList className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-card-title">{proposal.title}</p>
          <p className="type-meta mt-1 line-clamp-2">{proposal.summary}</p>
          <p className="type-meta mt-2">
            {proposal.tasksCount} tasks · {proposal.remindersCount} reminders · {proposal.waitingCount} waiting items
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="mt-3">
        <Link href={`/approvals?proposal=${proposal.proposalId}`}>
          Review plan
          <ArrowRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function ContextRail({
  context,
}: {
  context: Pick<DashboardData, "today" | "upcoming" | "waiting" | "proposals">;
}) {
  return (
    <aside className="space-y-5 xl:sticky xl:top-9 xl:h-fit">
      <RailSection title="Today" count={context.today.length}>
        {context.today.slice(0, 4).map((task) => (
          <RailRow key={task.id} title={task.title} detail={task.dueDate ?? "No date set"} href="/tasks" />
        ))}
      </RailSection>
      <RailSection title="Upcoming" count={context.upcoming.length}>
        {context.upcoming.slice(0, 4).map((task) => (
          <RailRow key={task.id} title={task.title} detail={task.dueDate ?? "No date set"} href="/tasks" />
        ))}
      </RailSection>
      <RailSection title="Waiting" count={context.waiting.length}>
        {context.waiting.slice(0, 3).map((item) => (
          <RailRow key={item.id} title={item.title} detail={item.waitingOn} href="/waiting" />
        ))}
      </RailSection>
      <RailSection title="Drafts" count={context.proposals.length}>
        {context.proposals.slice(0, 3).map((proposal) => (
          <RailRow
            key={proposal.id}
            title={proposal.proposedPlanJson.lifeEvent.title}
            detail="Waiting for review"
            href={`/approvals?proposal=${proposal.id}`}
          />
        ))}
      </RailSection>
    </aside>
  );
}

function RailSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-hairline pt-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="type-label">{title}</h2>
        <span className="type-mono text-muted">{count}</span>
      </div>
      <div className="space-y-1.5">
        {count ? children : <p className="type-meta">Nothing here right now.</p>}
      </div>
    </section>
  );
}

function RailRow({ title, detail, href }: { title: string; detail: string; href: string }) {
  return (
    <Link
      href={href}
      className="block border border-transparent px-2 py-1.5 transition-colors duration-[var(--dur-hover)] hover:border-hairline hover:bg-surface"
    >
      <span className="block truncate text-[0.875rem] text-ink">{title}</span>
      <span className="type-meta block truncate">{detail}</span>
    </Link>
  );
}

function LinkOrDiv({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

function toneClass(tone: AssistantLedgerItem["tone"]) {
  if (tone === "today") return "text-agent-done";
  if (tone === "upcoming") return "text-agent-reading";
  if (tone === "waiting") return "text-agent-checking";
  if (tone === "proposal") return "text-primary";
  return "text-muted";
}
