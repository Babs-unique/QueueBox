import { useEffect, useState, type FormEvent } from "react"
import {
  ChevronRight,
  FileText,
  Info,
  LoaderCircle,
  Shield,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import {
  DetailFields,
  EmptyState,
  Modal,
  PageHeader,
  Pagination,
  SearchBox,
  StatusBadge,
} from "../components/ui"
import { getApiErrorMessage } from "../api/baseApi"
import {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
  type Customer,
} from "../features/customers/customersApi"
import {
  useGetCurrentUserQuery,
  useUpdateUserMutation,
} from "../features/auth/authApi"
import { useWorkspace } from "../features/workspace"
import { CreateCustomer } from "../features/CreateCustomer"
import {
  useGetBillingInvoicesQuery,
  useGetBillingJobsQuery,
  useReplayInvoiceJobMutation,
  type BillingInvoice,
  type BillingJob,
} from "../features/billing/billingApi"

const avatarColors = ["purple", "blue", "orange", "green", "pink"]

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

export function Customers() {
  const { notify } = useWorkspace()
  const { data: customers = [], isLoading, isError, error, refetch } =
    useGetCustomersQuery()
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation()
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Customer | null>(null)
  const filtered = customers.filter((customer) =>
    `${customer.name} ${customer.email} ${customer.id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  async function removeSelectedCustomer() {
    if (!selected || !window.confirm(`Delete ${selected.name}?`)) return
    try {
      await deleteCustomer(selected.id).unwrap()
      notify(`${selected.name} deleted.`)
      setSelected(null)
    } catch (requestError) {
      notify(getApiErrorMessage(requestError))
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="CUSTOMER DIRECTORY"
        title="Customers"
        description="Manage the customers associated with your billing operations."
        action={
          <button className="button primary" onClick={() => setCreating(true)}>
            <UserPlus size={15} />
            Add customer
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
            placeholder="Search customers…"
          />
          <span className="muted table-toolbar-note">
            {customers.length} {customers.length === 1 ? "customer" : "customers"}
          </span>
        </div>
        {isLoading ? (
          <div className="loading-state" role="status">
            <LoaderCircle className="spin" size={18} />
            Loading customers…
          </div>
        ) : isError ? (
          <EmptyState
            title="Customers could not be loaded."
            description={getApiErrorMessage(error)}
            action={
              <button className="button" onClick={() => refetch()}>
                Try again
              </button>
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Customer ID</th>
                    <th>Created</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice((page - 1) * 8, page * 8).map((customer) => (
                    <tr key={customer.id} onClick={() => setSelected(customer)}>
                      <td>
                        <button
                          className="table-link-button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelected(customer)
                          }}
                        >
                          <CustomerName customer={customer} />
                        </button>
                      </td>
                      <td>
                        <code>{customer.id}</code>
                      </td>
                      <td className="date-cell">{formatDate(customer.createdAt)}</td>
                      <td>
                        <ChevronRight size={14} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <EmptyState
                  title={customers.length ? "No customers found." : "No customers yet."}
                  description={
                    customers.length
                      ? "Try a different search."
                      : "Add a customer before submitting a billing operation."
                  }
                />
              )}
            </div>
            <Pagination count={filtered.length} page={page} setPage={setPage} />
          </>
        )}
      </section>
      {selected && (
        <CustomerDetails
          customer={selected}
          isDeleting={isDeleting}
          onClose={() => setSelected(null)}
          onDelete={removeSelectedCustomer}
        />
      )}
      {creating && (
        <CreateCustomer
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            setSearch("")
            setPage(1)
          }}
        />
      )}
    </div>
  )
}

function CustomerDetails({
  customer,
  isDeleting,
  onClose,
  onDelete,
}: {
  customer: Customer
  isDeleting: boolean
  onClose: () => void
  onDelete: () => void
}) {
  const { notify } = useWorkspace()
  const { data: latestCustomer } = useGetCustomerQuery(customer.id)
  const displayedCustomer = latestCustomer ?? customer
  const [updateCustomer, { isLoading }] = useUpdateCustomerMutation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(customer.name)
  const [email, setEmail] = useState(customer.email)
  const [error, setError] = useState("")

  useEffect(() => {
    setName(displayedCustomer.name)
    setEmail(displayedCustomer.email)
  }, [displayedCustomer])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    try {
      await updateCustomer({
        id: customer.id,
        input: { name: name.trim(), email: email.trim() },
      }).unwrap()
      notify(`${name.trim()} updated.`)
      onClose()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    }
  }

  return (
    <Modal
      title={editing ? "Edit customer" : displayedCustomer.name}
      subtitle={editing ? "Update customer details." : "Customer details"}
      onClose={onClose}
    >
      {editing ? (
        <form className="customer-create-form" onSubmit={save}>
          <label htmlFor="edit-customer-name">Customer name</label>
          <input
            id="edit-customer-name"
            value={name}
            required
            minLength={2}
            onChange={(event) => setName(event.target.value)}
          />
          <label htmlFor="edit-customer-email">Email address</label>
          <input
            id="edit-customer-email"
            type="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
          {error && (
            <div className="error-note" role="alert">
              <Info size={17} />
              <p>{error}</p>
            </div>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button"
              disabled={isLoading}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <DetailFields
            fields={[
              ["Customer ID", <code>{displayedCustomer.id}</code>],
              ["Email", displayedCustomer.email],
              ["Created", formatDate(displayedCustomer.createdAt)],
            ]}
          />
          <div className="modal-actions">
            <Link
              className="button"
              to={`/invoices?customer=${displayedCustomer.id}`}
              onClick={onClose}
            >
              View invoices
            </Link>
            <button className="button danger-button" disabled={isDeleting} onClick={onDelete}>
              {isDeleting ? "Deleting…" : "Delete customer"}
            </button>
            <button className="button primary" onClick={() => setEditing(true)}>
              Edit customer
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

export function Invoices() {
  const { data: invoices = [], isLoading, isError, error, refetch } =
    useGetBillingInvoicesQuery()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const selectedCustomer = params.get("customer") || ""
  const filtered = invoices.filter(
    (invoice) =>
      `${invoice.id} ${invoice.customer.name} ${invoice.customer.email}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!selectedCustomer || invoice.customerId === selectedCustomer),
  )

  return (
    <div className="page">
      <PageHeader
        eyebrow="GENERATED INVOICES"
        title="Invoices"
        description="Browse invoice records generated by your billing operations."
        action={
          <span className="subtle-pill">
            <FileText size={14} />
            {invoices.length} invoices
          </span>
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
            placeholder="Search invoices or customers…"
          />
          {selectedCustomer && (
            <button
              className="button small"
              onClick={() => setParams({})}
            >
              Clear customer filter
            </button>
          )}
        </div>
        {isLoading ? (
          <p className="loading-state">Loading invoices…</p>
        ) : isError ? (
          <EmptyState
            title="Invoices could not be loaded."
            description={getApiErrorMessage(error)}
            action={<button className="button" onClick={() => refetch()}>Try again</button>}
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Invoice ID</th><th>Customer</th><th>Billing period</th><th>Amount</th><th>Status</th><th>Due date</th></tr>
                </thead>
                <tbody>
                  {filtered.slice((page - 1) * 8, page * 8).map((invoice) => (
                    <tr key={invoice.id}>
                      <td><code>{invoice.id}</code></td>
                      <td>
                        <span className="customer-cell">
                          <span className={`customer-avatar ${avatarColors[invoice.customer.name.length % avatarColors.length]}`}>
                            {initials(invoice.customer.name)}
                          </span>
                          <span><strong>{invoice.customer.name}</strong><small>{invoice.customer.email}</small></span>
                        </span>
                      </td>
                      <td>{periodLabel(invoice.billingPeriod)}</td>
                      <td className="amount-cell">{formatAmount(invoice.amount)}</td>
                      <td><StatusBadge status={invoice.status} /></td>
                      <td className="date-cell">{formatDate(invoice.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <EmptyState
                  title={invoices.length ? "No invoices found." : "No invoices yet."}
                  description={invoices.length ? "Try a different search or customer filter." : "Invoices will appear here after jobs are processed."}
                />
              )}
            </div>
            <Pagination count={filtered.length} page={page} setPage={setPage} />
          </>
        )}
      </section>
    </div>
  )
}

export function Jobs({ failed = false }: { failed?: boolean }) {
  const { data: jobs = [], isLoading, isError, error, refetch } =
    useGetBillingJobsQuery()
  const { notify } = useWorkspace()
  const [replay, { isLoading: isReplaying }] = useReplayInvoiceJobMutation()
  const [params] = useSearchParams()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(params.get("status") || "All statuses")
  const [page, setPage] = useState(1)
  const filtered = jobs.filter(
    (job) =>
      (!failed || job.status === "FAILED") &&
      (failed || status === "All statuses" || job.status === status.toUpperCase()) &&
      `${job.id} ${job.billingOperationId} ${job.customer.name} ${job.customer.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )

  async function replayJob(job: BillingJob) {
    const dlqRecordId = job.invoiceJobDlq?.id
    if (!dlqRecordId) return
    try {
      await replay(dlqRecordId).unwrap()
      notify("Invoice job queued for replay.")
    } catch (requestError) {
      notify(getApiErrorMessage(requestError))
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={failed ? "NEEDS ATTENTION" : "BACKGROUND WORK"}
        title={failed ? "Failed jobs" : "Job queue"}
        description={
          failed
            ? "Inspect failed invoice jobs and replay eligible dead-letter jobs."
            : "Monitor invoice jobs processed by the background queue."
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
            placeholder="Search jobs, customers or operations…"
          />
          {!failed && (
            <select
              aria-label="Job status filter"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
            >
              {["All statuses", "Queued", "Processing", "Completed", "Failed"].map(
                (value) => <option key={value}>{value}</option>,
              )}
            </select>
          )}
        </div>
        {isLoading ? (
          <p className="loading-state">Loading invoice jobs…</p>
        ) : isError ? (
          <EmptyState
            title="Invoice jobs could not be loaded."
            description={getApiErrorMessage(error)}
            action={<button className="button" onClick={() => refetch()}>Try again</button>}
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Customer</th>
                    <th>Billing operation</th>
                    {!failed && <th>Status</th>}
                    <th>Invoice</th>
                    {failed && <th>Failure reason</th>}
                    {failed && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice((page - 1) * 8, page * 8).map((job) => (
                    <tr key={job.id}>
                      <td><code>{job.id}</code></td>
                      <td>
                        <span className="customer-cell">
                          <span className={`customer-avatar ${avatarColors[job.customer.name.length % avatarColors.length]}`}>
                            {initials(job.customer.name)}
                          </span>
                          <span><strong>{job.customer.name}</strong><small>{job.customer.email}</small></span>
                        </span>
                      </td>
                      <td>
                        <Link className="operation-link" to={`/operations/${job.billingOperationId}`}>
                          {job.billingOperationId}
                        </Link>
                      </td>
                      {!failed && <td><StatusBadge status={job.status} /></td>}
                      <td>{job.invoiceId ? <code>{job.invoiceId}</code> : "—"}</td>
                      {failed && <td>{job.invoiceJobDlq?.failureReason || job.lastError || "—"}</td>}
                      {failed && (
                        <td>
                          {job.invoiceJobDlq?.status === "FAILED_PERMANENTLY" ? (
                            <button
                              className="button small"
                              disabled={isReplaying}
                              onClick={() => void replayJob(job)}
                            >
                              {isReplaying ? "Replaying…" : "Replay"}
                            </button>
                          ) : "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <EmptyState
                  title={jobs.length ? "No matching jobs." : "No invoice jobs yet."}
                  description={jobs.length ? "Try a different search or status." : "Jobs will appear when a billing operation is submitted."}
                />
              )}
            </div>
            <Pagination count={filtered.length} page={page} setPage={setPage} />
          </>
        )}
      </section>
    </div>
  )
}

function periodLabel(period: string) {
  const date = new Date(`${period}-02`)
  return Number.isNaN(date.getTime())
    ? period
    : date.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

function formatAmount(amount: BillingInvoice["amount"]) {
  const value = Number(amount)
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(amount)
}

export function Settings() {
  const { data: user } = useGetCurrentUserQuery()
  const { notify } = useWorkspace()
  const [updateUser, { isLoading }] = useUpdateUserMutation()
  const [tab, setTab] = useState("Profile")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setEmail(user.email)
  }, [user])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    setError("")
    try {
      await updateUser({ id: user.id, name: name.trim(), email: email.trim() }).unwrap()
      notify("Profile updated.")
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    }
  }

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="ACCOUNT"
        title="Settings"
        description="Manage your QueueBox account."
      />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {[
            { label: "Profile", icon: User },
            { label: "Account", icon: Users },
            { label: "Security", icon: Shield },
          ].map((item) => (
            <button
              className={tab === item.label ? "active" : ""}
              key={item.label}
              onClick={() => setTab(item.label)}
            >
              <item.icon size={17} />
              {item.label}
              <ChevronRight size={14} />
            </button>
          ))}
        </nav>
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>{tab === "Profile" ? "Profile information" : tab}</h2>
              <p>
                {tab === "Profile"
                  ? "Update the name and email address associated with your account."
                  : "This account-management capability is not exposed by the backend yet."}
              </p>
            </div>
          </div>
          {tab === "Profile" ? (
            <form className="settings-content" onSubmit={saveProfile}>
              <div className="settings-avatar">
                <span className="avatar">{initials(user?.name || "")}</span>
                <div>
                  <strong>{user?.name}</strong>
                  <p>{user?.email}</p>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Full name
                  <input
                    value={name}
                    required
                    minLength={2}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    required
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              </div>
              {error && (
                <div className="error-note" role="alert">
                  <Info size={17} />
                  <p>{error}</p>
                </div>
              )}
              <div className="settings-save">
                <button className="button primary" disabled={isLoading}>
                  {isLoading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="settings-content">
              <EmptyState
                title={`${tab} settings are not available yet.`}
                description="The current API does not include these account-management endpoints."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
