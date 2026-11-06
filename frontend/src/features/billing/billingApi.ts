import { baseApi, type ApiEnvelope } from "../../api/baseApi"

export interface CreateBillingOperationInput {
  billingPeriod: string
  idempotencyKey: string
}

export interface CreatedBillingOperation {
  id: string
  idempotencyKey: string
  status: string
  createdAt: string
  durable: boolean
  queueDispatch: boolean
  warning: string | null
}

export interface BillingOperationSummary {
  id: string
  billingPeriod: string
  status: string
  totalJobs: number
  processingJobs: number
  completedJobs: number
  failedJobs: number
  createdAt: string
  _count: { invoiceJobs: number }
}

export interface BillingJob {
  id: string
  billingOperationId: string
  customerId: string
  invoiceId: string | null
  status: string
  lastError: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
  customer: { id: string; name: string; email: string }
  billingOperation?: {
    id: string
    billingPeriod: string
    status: string
  }
  invoice?: InvoiceRecord | null
  invoiceJobDlq?: {
    id: string
    failureReason: string
    attemptsMade: number
    failedAt: string
    status: string
  } | null
}

export interface InvoiceRecord {
  id: string
  customerId: string
  amount: number | string
  billingPeriod: string
  dueDate: string
  status: string
  createdAt: string
}

export interface BillingInvoice extends InvoiceRecord {
  customer: { id: string; name: string; email: string }
  invoiceJobs?: { id: string; billingOperationId: string }[]
}

export interface BillingOperationDetail extends BillingOperationSummary {
  invoiceJobs: BillingJob[]
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBillingOperations: build.query<BillingOperationSummary[], void>({
      query: () => "billings",
      transformResponse: (response: ApiEnvelope<BillingOperationSummary[]>) =>
        response.data,
      providesTags: ["BillingOperation"],
    }),
    getBillingOperation: build.query<BillingOperationDetail, string>({
      query: (id) => `billings/${id}`,
      transformResponse: (response: ApiEnvelope<BillingOperationDetail>) =>
        response.data,
      providesTags: (_result, _error, id) => [
        { type: "BillingOperation", id },
      ],
    }),
    getBillingInvoices: build.query<BillingInvoice[], void>({
      query: () => "billings/invoices",
      transformResponse: (response: ApiEnvelope<BillingInvoice[]>) =>
        response.data,
      providesTags: ["Invoice"],
    }),
    getBillingJobs: build.query<BillingJob[], void>({
      query: () => "billings/jobs",
      transformResponse: (response: ApiEnvelope<BillingJob[]>) =>
        response.data,
      providesTags: ["InvoiceJob"],
    }),
    createBillingOperation: build.mutation<
      CreatedBillingOperation,
      CreateBillingOperationInput
    >({
      query: ({ billingPeriod, idempotencyKey }) => ({
        url: "billings",
        method: "POST",
        body: { billingPeriod },
        headers: { "X-Idempotency-Key": idempotencyKey },
      }),
      transformResponse: (
        response: ApiEnvelope<CreatedBillingOperation>,
      ) => response.data,
      invalidatesTags: ["BillingOperation", "InvoiceJob"],
    }),
    replayInvoiceJob: build.mutation<
      { success: boolean; newQueueJobId: string },
      string
    >({
      query: (dlqRecordId) => ({
        url: `billings/dlq/${dlqRecordId}/replay`,
        method: "POST",
      }),
      transformResponse: (
        response: ApiEnvelope<{ success: boolean; newQueueJobId: string }>,
      ) => response.data,
      invalidatesTags: ["BillingOperation", "InvoiceJob"],
    }),
  }),
})

export const {
  useGetBillingOperationsQuery,
  useGetBillingOperationQuery,
  useGetBillingInvoicesQuery,
  useGetBillingJobsQuery,
  useCreateBillingOperationMutation,
  useReplayInvoiceJobMutation,
} = billingApi
