// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { AgentComposer } from "@/components/agent/agent-composer";

describe("AgentComposer", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the playful drafting state while a plan is being generated", async () => {
    window.scrollTo = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    const user = userEvent.setup();
    render(<AgentComposer />);

    await user.type(screen.getByLabelText(/what.s happening/i), "I am moving on September 1.");
    await user.click(screen.getByRole("button", { name: /draft a plan/i }));

    expect(
      (screen.getByRole("button", { name: /drafting/i }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect((screen.getByLabelText(/what.s happening/i) as HTMLTextAreaElement).disabled).toBe(true);
    expect(screen.getByText("Reading your situation and drafting a plan.")).toBeTruthy();
    expect(await screen.findByText("Finding the dates")).toBeTruthy();
    expect(screen.getByText("Shaping the plan")).toBeTruthy();
    expect(screen.getByText("Sorting the next steps")).toBeTruthy();
  });
});
