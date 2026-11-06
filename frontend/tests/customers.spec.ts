import { expect, test } from "@playwright/test"

const user = {
  id: "user-1",
  name: "Sam Rivera",
  email: "sam@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
}

test.beforeEach(async ({ page }) => {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      json: { statusCode: 200, success: true, data: user },
    }),
  )
})

test("loads customer records from the API and adds a customer", async ({
  page,
}) => {
  const customers = [
    {
      id: "customer-1",
      name: "Northstar Studio",
      email: "billing@northstar.studio",
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ]

  await page.route("**/customers", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON()
      expect(body).toEqual({
        name: "New Customer",
        email: "billing@example.com",
      })
      customers.unshift({
        id: "customer-2",
        name: body.name,
        email: body.email,
        createdAt: "2026-03-01T00:00:00.000Z",
      })
      await route.fulfill({
        json: { statusCode: 201, success: true, data: customers[0] },
      })
      return
    }

    await route.fulfill({
      json: { statusCode: 200, success: true, data: customers },
    })
  })

  await page.goto("/customers")
  await expect(page.getByText("Northstar Studio")).toBeVisible()
  await page.getByRole("button", { name: "Add customer", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Customer name", { exact: false }).fill("New Customer")
  await dialog
    .getByLabel("Email address", { exact: false })
    .fill("billing@example.com")
  await dialog.getByRole("button", { name: "Add customer" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole("status")).toContainText(
    "New Customer added to your customers.",
  )
  await expect(page.getByText("New Customer")).toBeVisible()
})

test("protects the workspace when no authenticated session exists", async ({
  page,
}) => {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 401,
      json: { statusCode: 401, success: false, message: "Unauthorized" },
    }),
  )
  await page.goto("/customers")
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible()
})
