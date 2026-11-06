import { Suspense, useState } from "react"
import {
  Activity,
  ArrowUpRight,
  Bell,
  Box,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Users,
  X,
} from "lucide-react"
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom"
import { useWorkspace } from "../features/workspace"
import { Modal, PageSkeleton, SearchBox } from "./ui"
import {
  useGetCurrentUserQuery,
  useLogoutMutation,
} from "../features/auth/authApi"
import { getApiErrorMessage } from "../api/baseApi"

export const navigation = [
  {
    label: "Overview",
    path: "/overview",
    icon: LayoutDashboard,
    group: "WORKSPACE",
  },
  {
    label: "Billing Operations",
    path: "/operations",
    icon: Layers,
    group: "WORKSPACE",
  },
  { label: "Customers", path: "/customers", icon: Users, group: "WORKSPACE" },
  { label: "Invoices", path: "/invoices", icon: FileText, group: "WORKSPACE" },
  { label: "Job Queue", path: "/jobs", icon: Activity, group: "MONITORING" },
  {
    label: "Failed Jobs",
    path: "/failed",
    icon: ShieldAlert,
    group: "MONITORING",
  },
  { label: "Settings", path: "/settings", icon: Settings, group: "SYSTEM" },
]
interface BrandProps {
  compact?: boolean
  to?: string
}
export function Brand({ compact = false, to = "/" }: BrandProps) {
  return (
    <Link
      className="brand"
      to={to}
      aria-label={to === "/" ? "QueueBox home" : "QueueBox overview"}
    >
      <span className="brand-symbol">
        <Box size={22} strokeWidth={1.7} />
      </span>
      {!compact && (
        <span>
          QueueBox<span className="brand-period">.</span>
        </span>
      )}
    </Link>
  )
}
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [profile, setProfile] = useState(false)
  const [notification, setNotification] = useState(false)
  const [dialog, setDialog] = useState<"search" | "help" | null>(null)
  const [search, setSearch] = useState("")
  const location = useLocation()
  const navigate = useNavigate()
  const { openCreate, notify } = useWorkspace()
  const { data: user } = useGetCurrentUserQuery()
  const [logout] = useLogoutMutation()
  const current =
    navigation.find((n) => n.path === location.pathname) || navigation[1]

  const initials = user?.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  async function signOut() {
    try {
      await logout().unwrap()
      navigate("/login", { replace: true })
    } catch (requestError) {
      notify(getApiErrorMessage(requestError))
    }
  }

  return (
    <div className={`app ${collapsed ? "collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand compact={collapsed} to="/overview" />
          <button
            className="icon-button collapse-button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
          >
            <PanelLeftClose size={16} />
          </button>
          <button
            className="icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X size={19} />
          </button>
        </div>
        <button
          className="workspace-picker"
          onClick={() => navigate("/settings")}
        >
          <span className="workspace-avatar">{initials}</span>
          <span className="workspace-text">
            <strong>{user?.name}</strong>
            <span>Account workspace</span>
          </span>
          <ChevronsUpDown size={14} />
        </button>
        <nav aria-label="Main navigation">
          {["WORKSPACE", "MONITORING", "SYSTEM"].map((group) => (
            <div className="nav-group" key={group}>
              <div className="nav-label">{group}</div>
              {navigation
                .filter((n) => n.group === group)
                .map((n) => (
                  <NavLink
                    title={collapsed ? n.label : undefined}
                    end={n.path === "/overview"}
                    key={n.path}
                    to={n.path}
                    onClick={() => setMobile(false)}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <n.icon size={18} strokeWidth={1.6} />
                    <span>{n.label}</span>
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-heading">
              <span className="help-icon">
                <Layers size={15} />
              </span>
              Built for the background.
            </span>
            <p>
              Every operation. Every job.
              <br />
              Nothing left in the dark.
            </p>
            <button onClick={() => setDialog("help")}>
              Explore QueueBox
              <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="help-link" onClick={() => setDialog("help")}>
            <CircleHelp size={17} />
            <span>Help & documentation</span>
            <ArrowUpRight size={13} />
          </button>
          <div className="sidebar-account">
            <span className="avatar">{initials}</span>
            <span className="account-text">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </span>
            <button
              className="icon-button"
              aria-label="Account menu"
              onClick={() => setProfile(!profile)}
            >
              <ChevronsUpDown size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => {
                setCollapsed(false)
                setMobile(true)
              }}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-home">Workspace</span>
            <ChevronRight size={13} />
            <span>{current.label}</span>
            {location.pathname.startsWith("/operations/") && (
              <>
                <ChevronRight size={13} />
                <span className="muted">Details</span>
              </>
            )}
          </div>
          <div className="topbar-actions">
            <span className="system-status">
              <span className="tiny-dot" />
              API connected
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              aria-label="Search workspace"
              onClick={() => setDialog("search")}
            >
              <Search size={17} />
            </button>
            <div className="popover-anchor">
              <button
                className={`icon-button ${notification ? "selected" : ""}`}
                aria-label="Notifications"
                onClick={() => {
                  setNotification(!notification)
                  setProfile(false)
                }}
              >
                <Bell size={17} />
                <span className="notification-dot" />
              </button>
              {notification && (
                <div className="popover notifications">
                  <h3>
                    Notifications<span>Demo</span>
                  </h3>
                  <div className="notification-content">
                    <Bell size={24} />
                    <strong>You’re all caught up</strong>
                    <p>
                      Live notifications will appear here when your API is
                      connected.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              className="topbar-profile"
              aria-label="Open profile menu"
              onClick={() => {
                setProfile(!profile)
                setNotification(false)
              }}
            >
              <span className="avatar small-avatar">AC</span>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="page-footer">
          <span>
            <span className="tiny-dot" />
            Account data is loaded from QueueBox
          </span>
          <span>
            QueueBox<span className="footer-separator">/</span>Built for work
            that happens in the background.
          </span>
        </footer>
      </div>
      {profile && (
        <>
          <button
            className="popover-scrim"
            aria-label="Close account menu"
            onClick={() => setProfile(false)}
          />
          <div className="popover profile-menu">
            <div className="profile-info">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
            <button
              onClick={() => {
                setProfile(false)
                navigate("/settings")
              }}
            >
              <Settings size={15} />
              Account settings
            </button>
            <button
              onClick={() => {
                setProfile(false)
                void signOut()
              }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </>
      )}
      {dialog === "search" && (
        <Modal
          title="Search workspace"
          subtitle="Jump to a page in QueueBox."
          onClose={() => setDialog(null)}
        >
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search pages…"
          />
          <div className="search-results">
            {navigation
              .filter((n) =>
                n.label.toLowerCase().includes(search.toLowerCase()),
              )
              .map((n) => (
                <button
                  key={n.path}
                  onClick={() => {
                    navigate(n.path)
                    setDialog(null)
                    setSearch("")
                  }}
                >
                  <n.icon size={18} />
                  {n.label}
                  <ArrowUpRight size={15} />
                </button>
              ))}
          </div>
        </Modal>
      )}
      {dialog === "help" && (
        <Modal
          title="Work happens in the background."
          subtitle="A quick guide to QueueBox"
          onClose={() => setDialog(null)}
        >
          <div className="guide-steps">
            <div>
              <span>01</span>
              <section>
                <h3>Create a billing operation</h3>
                <p>
                  Choose a billing period and submit one operation for your
                  customers.
                </p>
              </section>
            </div>
            <div>
              <span>02</span>
              <section>
                <h3>Let the queue take over</h3>
                <p>
                  Independent background workers generate each invoice, with
                  retries when needed.
                </p>
              </section>
            </div>
            <div>
              <span>03</span>
              <section>
                <h3>Keep every job in view</h3>
                <p>
                  Track progress, inspect invoices, and investigate jobs that
                  need attention.
                </p>
              </section>
            </div>
          </div>
          <div className="info-note">
            Customers and billing-operation submissions are connected. This
            backend does not yet expose operation history, invoice, or job
            queries.
          </div>
          <button
            className="button primary full-width"
            onClick={() => {
              setDialog(null)
              openCreate()
            }}
          >
            <Plus size={16} />
            Create a billing operation
          </button>
        </Modal>
      )}
    </div>
  )
}
