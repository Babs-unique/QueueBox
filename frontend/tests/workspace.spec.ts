import { expect, test } from "@playwright/test"

const user = {
  id: "user-1",
  name: "Sam Rivera",
  email: "sam@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
}

test("submits a billing operation with its idempotency key", async ({
  page,
}) => {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      json: { statusCode: 200, success: true, data: user },
    }),
  )
  await page.route("**/customers", (route) =>
    route.fulfill({
      json: {
        statusCode: 200,
        success: true,
        data: [
          {
            id: "customer-1",
            name: "Northstar",
            email: "billing@northstar.studio",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    }),
  )

  let submittedHeader = ""
  await page.route("**/billings", async (route) => {
    submittedHeader = route.request().headers()["x-idempotency-key"]
    expect(route.request().postDataJSON()).toEqual({
      billingPeriod: "2026-06",
    })
    await route.fulfill({
      status: 202,
      json: {
        statusCode: 202,
        success: true,
        data: {
          id: "operation-1",
          idempotencyKey: submittedHeader,
          status: "QUEUED",
          createdAt: "2026-06-01T00:00:00.000Z",
          durable: true,
          queueDispatch: true,
          warning: null,
        },
      },
    })
  })

  await page.goto("/overview")
  await page.getByRole("button", { name: "Create billing operation" }).click()
  await page.getByLabel("Billing period").fill("2026-06")
  await page.getByRole("button", { name: "Review operation" }).click()
  await page.getByRole("button", { name: "Submit operation" }).click()
  await expect(
    page.getByRole("heading", { name: "Billing operation submitted" }),
  ).toBeVisible()
  await expect(page.getByRole("dialog")).toContainText("operation-1")
  expect(submittedHeader).toMatch(/^[0-9a-f-]{36}$/i)
})

test("loads customer counts and does not fabricate unavailable records", async ({
  page,
}) => {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      json: { statusCode: 200, success: true, data: user },
    }),
  )
  await page.route("**/customers", (route) =>
    route.fulfill({
      json: { statusCode: 200, success: true, data: [] },
    }),
  )
  await page.goto("/overview")
  await expect(page.getByRole("heading", { name: "Welcome, Sam Rivera" })).toBeVisible()
  await expect(page.getByRole("link", { name: /Customers/ })).toContainText("0")
  await expect(
    page.getByText("Operation and job activity will appear when supported."),
  ).toBeVisible()
})
