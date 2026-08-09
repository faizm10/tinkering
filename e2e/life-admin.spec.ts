import { expect, test } from "@playwright/test";

test("user creates and approves a moving plan", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /good morning/i })).toBeVisible();

  await page.getByPlaceholder(/moving to a new house/i).fill("I am moving to a new house on September 1.");
  await page.getByRole("button", { name: /create plan/i }).click();

  await expect(page.getByRole("heading", { name: /agent approvals/i })).toBeVisible();
  await page.getByRole("textbox").first().fill("Move to New House");
  await page.getByRole("button", { name: /approve everything/i }).click();

  await expect(page.getByRole("heading", { name: /move to new house/i })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText(/move to new house/i).first()).toBeVisible();
  await page.getByRole("button", { name: /complete task/i }).first().click();
  await expect(page.getByText(/recently completed/i)).toBeVisible();
});
