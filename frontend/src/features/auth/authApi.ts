import { baseApi, type ApiEnvelope } from "../../api/baseApi"

export interface User {
  id: string
  name: string
  email: string
  createdAt?: string
}

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput extends LoginInput {
  name: string
}

interface UpdateUserInput {
  id: string
  name: string
  email: string
}

interface AuthResponse {
  message: string
  user: User
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCurrentUser: build.query<User, void>({
      query: () => "auth/me",
      transformResponse: (response: ApiEnvelope<User>) => response.data,
      providesTags: ["Auth"],
    }),
    login: build.mutation<AuthResponse, LoginInput>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<AuthResponse>) => response.data,
      invalidatesTags: ["Auth"],
    }),
    register: build.mutation<User, RegisterInput>({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<User>) => response.data,
    }),
    refreshSession: build.mutation<void, void>({
      query: () => ({ url: "auth/refresh", method: "POST" }),
    }),
    updateUser: build.mutation<User, UpdateUserInput>({
      query: ({ id, ...body }) => ({
        url: `auth/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiEnvelope<User>) => response.data,
      invalidatesTags: ["Auth"],
    }),
    deleteUser: build.mutation<User, string>({
      query: (id) => ({ url: `auth/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiEnvelope<User>) => response.data,
      invalidatesTags: ["Auth", "Customer", "BillingOperation", "Invoice", "InvoiceJob"],
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "auth/logout", method: "POST" }),
      invalidatesTags: ["Auth"],
    }),
  }),
})

export const {
  useGetCurrentUserQuery,
  useLoginMutation,
  useRegisterMutation,
  useRefreshSessionMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useLogoutMutation,
} = authApi
