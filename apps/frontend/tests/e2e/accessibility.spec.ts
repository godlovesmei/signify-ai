import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter((item) =>
    item.impact === "serious" || item.impact === "critical",
  );
  expect(violations).toEqual([]);
}

test("TC-025 @a11y landing and login dialog have no serious axe violations", async ({
  page,
}) => {
  await page.goto("/");
  await expectNoSeriousViolations(page);

  await page.getByRole("button", { name: "Sign in" }).first().click();
  await expect(page.getByRole("dialog", { name: "Sign in to continue." })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test("TC-025 @a11y login dialog supports keyboard focus and Escape", async ({
  page,
}) => {
  await page.goto("/?login=1&next=%2Fhistory");
  const closeButton = page.getByRole("button", { name: "Close sign in" });
  await expect(closeButton).toBeFocused();
  await expect(page).toHaveURL("/");
  await page.keyboard.press("Escape");
  await expect(closeButton).toBeHidden();
});
