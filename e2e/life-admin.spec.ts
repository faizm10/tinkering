import { expect, test } from "@playwright/test";

test("user drafts, reviews and approves a moving plan", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /good (morning|afternoon|evening)/i })).toBeVisible();

  await page.getByPlaceholder(/tell life admin what/i).fill("I am moving to a new house on September 1.");
  await page.getByRole("button", { name: /draft a plan/i }).click();

  // The composer reports the run inline, then hands off to the approval screen.
  await expect(page.getByRole("link", { name: /review plan/i })).toBeVisible();
  await page.getByRole("link", { name: /review plan/i }).click();

  await expect(page.getByRole("heading", { name: /life event/i })).toBeVisible();
  await page.getByLabel("Title", { exact: true }).fill("Move to New House");
  await page.getByRole("button", { name: /add to life admin/i }).click();

  await expect(page.getByRole("heading", { name: /move to new house/i })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText(/move to new house/i).first()).toBeVisible();

  await page.getByRole("checkbox", { name: /^complete /i }).first().click();
  await expect(page.getByText(/recently completed/i)).toBeVisible();
});
