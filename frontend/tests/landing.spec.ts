import { expect, test } from "@playwright/test"

test("landing page restores the product preview and account links", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Handled in the background.",
  )
  await expect(page.getByText("Good things happen in the background.")).toBeVisible()
  await expect(page.locator(".landing-feature-art")).toHaveCount(3)
  await page.getByRole("tab", { name: "Job queue", exact: true }).click()
  await expect(page.getByRole("tabpanel")).toContainText("job_16f8a4")
  await page.getByRole("tab", { name: "Invoices", exact: true }).click()
  await expect(page.getByRole("tabpanel")).toContainText("inv_2025_1042")
  await expect(page.getByRole("tabpanel")).toContainText("USD")
  await page.getByRole("tab", { name: "Invoices", exact: true }).press("Home")
  await expect(page.getByRole("tab", { name: "Operations", exact: true })).toBeFocused()

  await page.goto("/")
  await page.getByRole("link", { name: "Create account", exact: true }).first().click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByLabel("Full name")).toBeVisible()
  await page.getByRole("link", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel("Email address")).toBeVisible()
})

test("landing page explains which backend records are available", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByText("Is the product preview showing live account data?").click()
  await expect(page.locator("details[open]")).toContainText(
    "The product preview below is an illustration",
  )
})

test("landing page remains usable on mobile", async ({ page }) => {
  for (const width of [1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `horizontal overflow at ${width}px`,
    ).toBe(true)
  }
})
