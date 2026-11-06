import { useEffect, useRef, type ReactNode } from "react"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
  X,
} from "lucide-react"

export function PageSkeleton() {
  return (
    <div className="page page-skeleton" role="status" aria-label="Loading page">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="metric-grid">
        {[1, 2, 3, 4].map((n) => (
          <div className="skeleton skeleton-card" key={n} />
        ))}
      </div>
      <div className="skeleton skeleton-table" />
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const label = status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
  return (
    <span className={`status-badge ${label.toLowerCase().replace(/ /g, "-")}`}>
      <span />
      {label}
    </span>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="search-box">
      <Search size={15} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="icon-button"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={23} />
      </span>
      <h3>{title}</h3>
      <p>{description || "Try adjusting your search or filters."}</p>
      {action}
    </div>
  )
}
export function Pagination({
  count,
  page,
  setPage,
  size = 8,
}: {
  count: number
  page: number
  setPage: (n: number) => void
  size?: number
}) {
  const pages = Math.max(1, Math.ceil(count / size))
  return (
    <div className="pagination">
      <span>
        {count === 0
          ? "0"
          : `${(page - 1) * size + 1}–${Math.min(page * size, count)}`}{" "}
        of {count} results
      </span>
      <div>
        <button
          className="button small"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <span className="page-count">
          {page} / {pages}
        </span>
        <button
          className="button small"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement
    ref.current?.focus()
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,select,a[href],[tabindex="0"]',
        )
        if (!nodes?.length) return
        const first = nodes[0],
          last = nodes[nodes.length - 1]
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", key)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener("keydown", key)
      previous?.focus()
    }
  }, [onClose])
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-heading">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
export function DetailFields({ fields }: { fields: [string, ReactNode][] }) {
  return (
    <dl className="detail-fields">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="text-link">
      {children}
      <ArrowRight size={14} />
    </button>
  )
}
