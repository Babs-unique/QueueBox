import { baseApi, type ApiEnvelope } from "../../api/baseApi"

export interface Customer {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface CreateCustomerInput {
  name: string
  email: string
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCustomers: build.query<Customer[], void>({
      query: () => "customers",
      transformResponse: (response: ApiEnvelope<Customer[]>) => response.data,
      providesTags: (customers = []) => [
        ...customers.map(({ id }) => ({ type: "Customer" as const, id })),
        { type: "Customer", id: "LIST" },
      ],
    }),
    getCustomer: build.query<Customer, string>({
      query: (id) => `customers/${id}`,
      transformResponse: (response: ApiEnvelope<Customer>) => response.data,
      providesTags: (_customer, _error, id) => [{ type: "Customer", id }],
    }),
    createCustomer: build.mutation<Customer, CreateCustomerInput>({
      query: (body) => ({
        url: "customers",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<Customer>) => response.data,
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),
    updateCustomer: build.mutation<
      Customer,
      { id: string; input: CreateCustomerInput }
    >({
      query: ({ id, input }) => ({
        url: `customers/${id}`,
        method: "PATCH",
        body: input,
      }),
      transformResponse: (response: ApiEnvelope<Customer>) => response.data,
      invalidatesTags: (_customer, _error, { id }) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
      ],
    }),
    deleteCustomer: build.mutation<Customer, string>({
      query: (id) => ({ url: `customers/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiEnvelope<Customer>) => response.data,
      invalidatesTags: (_customer, _error, id) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi
