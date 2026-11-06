import { lazy, Suspense, type ReactNode } from "react"
import { createBrowserRouter } from "react-router-dom"
import { PageSkeleton } from "./components/ui"
import { AppLayout } from "./components/AppLayout"
import { WorkspaceProvider } from "./features/workspace"
import Protected from "./Protected"

const Overview = lazy(() =>
  import("./pages/Overview").then((module) => ({ default: module.Overview })),
)
const Operations = lazy(() =>
  import("./pages/Operations").then((module) => ({ default: module.Operations })),
)
const OperationDetails = lazy(() =>
  import("./pages/Operations").then((module) => ({
    default: module.OperationDetails,
  })),
)
const Customers = lazy(() =>
  import("./pages/Records").then((module) => ({ default: module.Customers })),
)
const Invoices = lazy(() =>
  import("./pages/Records").then((module) => ({ default: module.Invoices })),
)
const Jobs = lazy(() =>
  import("./pages/Records").then((module) => ({ default: module.Jobs })),
)
const Settings = lazy(() =>
  import("./pages/Records").then((module) => ({ default: module.Settings })),
)
const Auth = lazy(() =>
  import("./pages/Auth").then((module) => ({ default: module.Auth })),
)
const Landing = lazy(() =>
  import("./pages/Landing").then((module) => ({ default: module.Landing })),
)

function lazyElement(element: ReactNode) {
  return <Suspense fallback={<PageSkeleton />}>{element}</Suspense>
}

function NotFound() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
    </main>
  )
}

export const router = createBrowserRouter([
  {
    element: <WorkspaceProvider />,
    children: [
      { path: "/", element: lazyElement(<Landing />) },
      { path: "/login", element: lazyElement(<Auth />) },
      { path: "/register", element: lazyElement(<Auth register />) },
      {
        element: <Protected />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/overview", element: lazyElement(<Overview />) },
              { path: "/operations", element: lazyElement(<Operations />) },
              {
                path: "/operations/:id",
                element: lazyElement(<OperationDetails />),
              },
              { path: "/customers", element: lazyElement(<Customers />) },
              { path: "/invoices", element: lazyElement(<Invoices />) },
              { path: "/jobs", element: lazyElement(<Jobs />) },
              { path: "/failed", element: lazyElement(<Jobs failed />) },
              { path: "/settings", element: lazyElement(<Settings />) },
            ],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
])
