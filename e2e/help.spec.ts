import { test, expect } from "@playwright/test";

// On the deployed site the AI answer is required; locally the model may be unreachable and the fallback is accepted.
const expectAi = process.env.E2E_EXPECT_AI === "1";

test("home page offers search and every article", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How can we help?");
  await expect(page.getByRole("region", { name: "Browse articles" }).getByRole("link")).toHaveCount(14);
});

test("an answer cites its sources and links to the exact section", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your question").fill("How much does the Pro plan cost per month?");
  await page.getByRole("button", { name: "Ask" }).click();
  const answer = page.getByRole("region", { name: "Answer" });
  if (expectAi) {
    await expect(answer.getByRole("heading", { name: "Sources" })).toBeVisible({ timeout: 20_000 });
    await expect(answer).toContainText("12");
    await answer.getByRole("link", { name: /Plans and pricing/ }).first().click();
    await expect(page).toHaveURL(/\/articles\/plans-and-pricing#/);
  } else {
    await expect(answer.getByText(/Plans and pricing|Sources/).first()).toBeVisible({ timeout: 20_000 });
  }
});

test("questions the help center doesn't cover get an honest answer, not a guess", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your question").fill("What's the weather in Paris tomorrow?");
  await page.getByRole("button", { name: "Ask" }).click();
  await expect(page.getByRole("region", { name: "Answer" })).toContainText("couldn't find that");
});

test("articles have linkable sections", async ({ page }) => {
  await page.goto("/articles/refunds-and-credit-notes#credit-notes");
  await expect(page.getByRole("heading", { name: "Credit notes", exact: true })).toBeInViewport();
});
