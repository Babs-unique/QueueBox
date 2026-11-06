import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react"

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
  credentials: "include",
})

const baseQueryWithRefresh: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)
  const requestUrl = typeof args === "string" ? args : args.url

  if (result.error?.status === 401 && requestUrl !== "auth/refresh") {
    const refreshResult = await rawBaseQuery(
      { url: "auth/refresh", method: "POST" },
      api,
      extraOptions,
    )

    if (refreshResult.error) return result
    result = await rawBaseQuery(args, api, extraOptions)
  }

  return result
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithRefresh,
  tagTypes: ["Auth", "Customer", "BillingOperation", "Invoice", "InvoiceJob"],
  endpoints: () => ({}),
})

export interface ApiEnvelope<T> {
  statusCode: number
  success: boolean
  data: T
}

export function getApiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data
    if (typeof data === "object" && data !== null && "message" in data) {
      const { message } = data
      if (typeof message === "string") return message
      if (
        Array.isArray(message) &&
        message.every((item) => typeof item === "string")
      ) {
        return message.join(" ")
      }
    }
  }

  if (typeof error === "object" && error !== null && "error" in error) {
    const { error: message } = error
    if (typeof message === "string") return message
  }

  return "The request could not be completed. Please try again."
}
