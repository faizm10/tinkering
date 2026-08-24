import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(async () => ({
    id: "user-1",
    name: "Signed In User",
    email: "signed-in@example.com",
  })),
}));

vi.mock("next/server", () => ({
  connection: vi.fn(async () => {}),
}));

import RegisterPage from "@/app/(auth)/register/page";

describe("RegisterPage", () => {
  it("shows an error instead of the registration form when a user is signed in", async () => {
    const html = renderToStaticMarkup(await RegisterPage());

    expect(html).toContain("You are already signed in.");
    expect(html).toContain("Sign out before creating another account.");
    expect(html).toContain("signed-in@example.com");
    expect(html).not.toContain('id="auth-name"');
    expect(html).not.toContain('id="auth-password"');
  });
});
