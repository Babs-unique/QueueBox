import { useState } from "react"
import { ArrowLeft, ChevronRight, Layers, Plus } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import {
  EmptyState,
  PageHeader,
  Pagination,
  SearchBox,
  StatusBadge,
} from "../components/ui"
import { getApiErrorMessage } from "../api/baseApi"
import {
  useGetBillingOperationQuery,
  useGetBillingOperationsQuery,
  type BillingOperationSummary,
} from "../features/billing/billingApi"
import { useWorkspace } from "../features/workspace"

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function periodLabel(period: string) {
  const date = new Date(`${period}-02`)
  return Number.isNaN(date.getTime())
    ? period
    : date.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

function OperationTable({
  operations,
}: {
  operations: BillingOperationSummary[]
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Operation ID</th>
            <th>Billing period</th>
            <th>Total jobs</th>
            <th>Completed</th>
            <th>Processing</th>
            <th>Failed</th>
            <th>Status</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {operations.map((operation) => (
            <tr key={operation.id}>
              <td>
                <Link className="table-id" to={`/operations/${operation.id}`}>
                  <span className="table-record-icon">
                    <Layers size={13} />
                  </span>
                  {operation.id}
                </Link>
              </td>
              <td>{periodLabel(operation.billingPeriod)}</td>
              <td className="numeric">{operation.totalJobs}</td>
              <td>{operation.completedJobs}</td>
              <td>{operation.processingJobs}</td>
              <td className={operation.failedJobs ? "danger-text" : "muted"}>
                {operation.failedJobs || "—"}
              </td>
              <td><StatusBadge status={statusLabel(operation.status)} /></td>
              <td className="date-cell">
                {new Date(operation.createdAt).toLocaleString()}
              </td>
              <td>
                <Link
                  aria-label={`View operation ${operation.id}`}
                  to={`/operations/${operation.id}`}
                >
                  <ChevronRight size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Operations() {
  const { openCreate } = useWorkspace()
  const { data: operations = [], isLoading, isError, error, refetch } =
    useGetBillingOperationsQuery()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const filtered = operations.filter((operation) =>
    `${operation.id} ${operation.billingPeriod} ${operation.status}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  const pages = filtered.slice((page - 1) * 8, page * 8)

  return (
    <div className="page">
      <PageHeader
        eyebrow="BILLING"
        title="Billing operations"
        description="Submit and monitor bulk invoice generation."
        action={
          <button className="button primary" onClick={openCreate}>
            <Plus size={16} />
            New billing operation
          </button>
        }
      />
      <section className="panel">
        <div className="table-toolbar">
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search operations…"
          />
          <span className="muted table-toolbar-note">
            {operations.length} operations
          </span>
        </div>
        {isLoading ? (
          <p className="loading-state">Loading billing operations…</p>
        ) : isError ? (
          <EmptyState
            title="Billing operations could not be loaded."
            description={getApiErrorMessage(error)}
            action={<button className="button" onClick={() => refetch()}>Try again</button>}
          />
        ) : filtered.length ? (
          <>
            <OperationTable operations={pages} />
            <Pagination count={filtered.length} page={page} setPage={setPage} />
          </>
        ) : (
          <EmptyState
            title={operations.length ? "No operations found." : "No billing operations yet."}
            description={operations.length ? "Try a different search." : "Create your first billing operation to get started."}
            action={
              !operations.length ? (
                <button className="button primary" onClick={openCreate}>
                  <Plus size={15} />
                  Create operation
                </button>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  )
}

export function OperationDetails() {
  const { id = "" } = useParams()
  const { data: operation, isLoading, isError, error, refetch } =
    useGetBillingOperationQuery(id)

  if (isLoading) {
    return <main className="page"><p className="loading-state">Loading operation…</p></main>
  }

  if (isError || !operation) {
    return (
      <div className="page">
        <Link className="back-link" to="/operations">
          <ArrowLeft size={14} />
          Billing operations
        </Link>
        <EmptyState
          title="Operation could not be loaded."
          description={isError ? getApiErrorMessage(error) : "This operation does not exist."}
          action={<button className="button" onClick={() => refetch()}>Try again</button>}
        />
      </div>
    )
  }

  const progress = operation.totalJobs
    ? Math.round((operation.completedJobs / operation.totalJobs) * 100)
    : 0

  return (
    <div className="page">
      <Link className="back-link" to="/operations">
        <ArrowLeft size={14} />
        Billing operations
      </Link>
      <PageHeader
        title={operation.id}
        description={`${periodLabel(operation.billingPeriod)} billing period · Created ${new Date(operation.createdAt).toLocaleString()}`}
        action={<StatusBadge status={statusLabel(operation.status)} />}
      />
      <div className="detail-stat-grid">
        {[
          ["Total jobs", operation.totalJobs],
          ["Processing", operation.processingJobs],
          ["Completed", operation.completedJobs],
          ["Failed", operation.failedJobs],
        ].map(([label, value]) => (
          <div className="panel detail-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="panel progress-panel">
        <div>
          <h2>Operation progress</h2>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p>{operation.completedJobs} of {operation.totalJobs} jobs completed</p>
      </section>
      <section className="panel">
        <div className="panel-heading"><h2>Invoice jobs</h2></div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Job ID</th><th>Customer</th><th>Status</th><th>Invoice</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {operation.invoiceJobs.map((job) => (
                <tr key={job.id}>
                  <td><code>{job.id}</code></td>
                  <td>{job.customer.name}</td>
                  <td><StatusBadge status={statusLabel(job.status)} /></td>
                  <td>{job.invoiceId ? <code>{job.invoiceId}</code> : "—"}</td>
                  <td className="date-cell">{new Date(job.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!operation.invoiceJobs.length && <EmptyState title="No jobs for this operation." />}
        </div>
      </section>
    </div>
  )
}
