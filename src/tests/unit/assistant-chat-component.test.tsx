// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AssistantChat } from "@/components/agent/assistant-chat";
import type { SonaeChatMessage } from "@/lib/agent/chat-types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const message: SonaeChatMessage = {
  id: "assistant-message",
  role: "assistant",
  metadata: { createdAt: "2026-08-28T12:00:00.000Z", provider: "mock", model: "mock-sonae-chat-v1" },
  parts: [
    { type: "text", text: "Today has 2 open tasks." },
    {
      type: "data-ledger",
      data: {
        items: [
          {
            id: "today-task",
            tone: "today",
            label: "Today",
            title: "Return Amazon package",
            detail: "Due 2026-08-28",
            href: "/tasks",
          },
        ],
      },
    },
  ],
};

describe("AssistantChat", () => {
  afterEach(() => cleanup());

  it("renders assistant messages with the planning ledger", () => {
    render(
      <AssistantChat
        conversationId="conversation-1"
        initialMessages={[message]}
        context={{ today: [], upcoming: [], waiting: [], proposals: [] }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Ask Sonae" })).toBeTruthy();
    expect(screen.getByText("Today has 2 open tasks.")).toBeTruthy();
    expect(screen.getByText("Planning ledger")).toBeTruthy();
    expect(screen.getByText("Return Amazon package")).toBeTruthy();
  });
});
