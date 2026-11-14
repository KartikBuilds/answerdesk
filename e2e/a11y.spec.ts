import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const scan = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

for (const path of ["/", "/articles/payment-methods"]) {
  test(`no WCAG 2.1 AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await scan(page);
    expect(violations.map((v) => `${v.id}: ${v.nodes.length} element(s)`)).toEqual([]);
  });
}

test("no WCAG 2.1 AA violations with an answer on screen", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your question").fill("How do refunds work?");
  await page.getByRole("button", { name: "Ask" }).click();
  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible({ timeout: 20_000 });
  const { violations } = await scan(page);
  expect(violations.map((v) => `${v.id}: ${v.nodes.length} element(s)`)).toEqual([]);
});
