import { Activity, FileText, Layers, Plus, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState, PageHeader, StatusBadge } from "../components/ui"
import { useGetCurrentUserQuery } from "../features/auth/authApi"
import { useGetCustomersQuery } from "../features/customers/customersApi"
import {
  useGetBillingInvoicesQuery,
  useGetBillingJobsQuery,
  useGetBillingOperationsQuery,
} from "../features/billing/billingApi"
import { useWorkspace } from "../features/workspace"

export function Overview() {
  const { data: user } = useGetCurrentUserQuery()
  const customers = useGetCustomersQuery()
  const operations = useGetBillingOperationsQuery()
  const invoices = useGetBillingInvoicesQuery()
  const jobs = useGetBillingJobsQuery()
  const { openCreate } = useWorkspace()

  const metrics = [
    {
      label: "Customers",
      value: metricValue(customers),
      description: "In your account",
      icon: Users,
      to: "/customers",
    },
    {
      label: "Billing operations",
      value: metricValue(operations),
      description: `${operations.data?.reduce((total, operation) => total + operation.totalJobs, 0) ?? 0} invoice jobs`,
      icon: Layers,
      to: "/operations",
    },
    {
      label: "Invoices",
      value: metricValue(invoices),
      description: "Generated invoices",
      icon: FileText,
      to: "/invoices",
    },
    {
      label: "Invoice jobs",
      value: metricValue(jobs),
      description: `${jobs.data?.filter((job) => job.status === "FAILED").length ?? 0} failed`,
      icon: Activity,
      to: "/jobs",
    },
  ]

  return (
    <div className="page overview-page">
      <PageHeader
        eyebrow="YOUR WORKSPACE"
        title={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        description="A clear view of your QueueBox account and billing workflows."
        action={
          <button className="button primary" onClick={openCreate}>
            <Plus size={16} />
            Create billing operation
          </button>
        }
      />
      <div className="metric-grid">
        {metrics.map((metric) => (
          <Link className="metric-card" key={metric.label} to={metric.to}>
            <div className="metric-top">
              <span>{metric.label}</span>
              <metric.icon size={17} />
            </div>
            <div className="metric-body">
              <strong>{metric.value}</strong>
            </div>
            <p>{metric.description}</p>
          </Link>
        ))}
      </div>
      <section className="panel recent-operations">
        <div className="panel-heading">
          <div>
            <h2>Recent billing operations</h2>
            <p>Your most recently submitted billing periods.</p>
          </div>
          <Link className="text-link" to="/operations">View all operations</Link>
        </div>
        {operations.isError ? (
          <EmptyState title="Operation history could not be loaded." />
        ) : operations.data?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Operation</th><th>Billing period</th><th>Jobs</th><th>Completed</th><th>Status</th></tr>
              </thead>
              <tbody>
                {operations.data.slice(0, 5).map((operation) => (
                  <tr key={operation.id}>
                    <td><Link className="table-id" to={`/operations/${operation.id}`}>{operation.id}</Link></td>
                    <td>{periodLabel(operation.billingPeriod)}</td>
                    <td>{operation.totalJobs}</td>
                    <td>{operation.completedJobs}</td>
                    <td><StatusBadge status={operation.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={operations.isLoading ? "Loading operations…" : "No billing operations yet."}
            description="Create a billing operation to start generating invoices."
            action={<button className="button primary" onClick={openCreate}><Plus size={15} />Create operation</button>}
          />
        )}
      </section>
    </div>
  )
}

function metricValue(query: {
  data?: unknown[]
  isLoading: boolean
  isError: boolean
}) {
  if (query.isLoading) return "…"
  return query.isError ? "—" : (query.data?.length ?? 0).toLocaleString()
}

function periodLabel(period: string) {
  const date = new Date(`${period}-02`)
  return Number.isNaN(date.getTime())
    ? period
    : date.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}
