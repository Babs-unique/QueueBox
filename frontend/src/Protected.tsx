import { Navigate, Outlet, useLocation } from "react-router-dom"
import { getApiErrorMessage } from "./api/baseApi"
import { useGetCurrentUserQuery } from "./features/auth/authApi"
import { PageSkeleton } from "./components/ui"

export default function Protected() {
  const location = useLocation()
  const {
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCurrentUserQuery()

  if (isLoading) return <PageSkeleton />

  if (isError) {
    const unauthorized =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 401

    if (unauthorized) {
      return <Navigate to="/login" replace state={{ from: location }} />
    }

    return (
      <main className="page">
        <h1>Unable to verify your session</h1>
        <p>{getApiErrorMessage(error)}</p>
        <button className="button primary" onClick={() => refetch()}>
          Try again
        </button>
      </main>
    )
  }

  return <Outlet />
}
