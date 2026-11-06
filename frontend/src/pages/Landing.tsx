import { useEffect, useState } from "react"
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Code2,
  Database,
  Eye,
  FileText,
  Fingerprint,
  GitBranch,
  Layers,
  Menu,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Brand } from "../components/AppLayout"
import { StatusBadge } from "../components/ui"
import "./landing.css"

const questions = [
  {
    question: "What does QueueBox actually do?",
    answer:
      "QueueBox turns billing operations into independently processed invoice jobs. Submit a billing period and let the queue handle invoice generation in the background.",
  },
  {
    question: "Does QueueBox collect payments?",
    answer:
      "No. QueueBox generates and manages invoice records. It is not a payment processor, accounting suite, or financial management platform.",
  },
  {
    question: "What happens when an invoice job fails?",
    answer:
      "Jobs are processed independently and retried when appropriate. Failed jobs can be inspected and eligible dead-letter jobs can be replayed from the workspace.",
  },
  {
    question: "Is the product preview showing live account data?",
    answer:
      "No. The product preview below is an illustration of the QueueBox interface. Sign in to view the real customers, operations, invoices, and jobs in your account.",
  },
]

const previewOperations = [
  { id: "op_8f2a9c1e", period: "June 2025", total: 248, completed: 186, status: "PROCESSING" },
  { id: "op_7b3e4d2f", period: "June 2025", total: 180, completed: 180, status: "COMPLETED" },
  { id: "op_6c9f1a3b", period: "May 2025", total: 320, completed: 316, status: "PARTIALLY_COMPLETED" },
]

const previewJobs = [
  { id: "job_16f8a4", customer: "Acme Inc.", operation: "op_8f2a9c1e", attempts: "1 / 3", status: "COMPLETED", invoice: "inv_2025_1042" },
  { id: "job_16f8b1", customer: "Layers", operation: "op_8f2a9c1e", attempts: "1 / 3", status: "PROCESSING", invoice: "—" },
  { id: "job_16f8c9", customer: "Sisyphus", operation: "op_8f2a9c1e", attempts: "3 / 3", status: "FAILED", invoice: "—" },
]

const previewInvoices = [
  { id: "inv_2025_1042", customer: "Acme Inc.", period: "June 2025", amount: "$1,250.00", currency: "USD" },
  { id: "inv_2025_1043", customer: "Layers", period: "June 2025", amount: "$249.00", currency: "USD" },
  { id: "inv_2025_1044", customer: "Sisyphus", period: "May 2025", amount: "$780.00", currency: "USD" },
]

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [])

  return (
    <div className="landing-page">
      <a href="#landing-main" className="skip-link">
        Skip to content
      </a>
      <header className="landing-header">
        <div className="landing-container landing-nav">
          <Brand />
          <nav className="landing-desktop-links" aria-label="Product navigation">
            <a href="#product">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#built-for-reliability">Under the hood</a>
            <a href="#faq">FAQs</a>
          </nav>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-signin">
              Sign in
              <ArrowUpRight size={13} />
            </Link>
            <Link to="/register" className="button primary">
              Create account
              <ArrowRight size={14} />
            </Link>
            <button
              className="icon-button landing-menu-toggle"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-nav"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="landing-mobile-nav"
            className="landing-mobile-nav"
            aria-label="Mobile product navigation"
          >
            {[
              ["Product", "#product"],
              ["How it works", "#how-it-works"],
              ["Under the hood", "#built-for-reliability"],
              ["FAQs", "#faq"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
                <ArrowUpRight size={15} />
              </a>
            ))}
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Sign in
              <ArrowRight size={15} />
            </Link>
          </nav>
        )}
      </header>

      <main id="landing-main" tabIndex={-1}>
        <section
          className="landing-hero landing-container"
          aria-labelledby="hero-title"
        >
          <div className="landing-hero-grid" aria-hidden="true" />
          <a className="landing-announcement" href="#how-it-works">
            <span className="landing-announcement-dot" />
            Less busywork. More background work.
            <ChevronRight size={13} />
          </a>
          <h1 id="hero-title">
            Billing operations.
            <br />
            <span>Handled in the background.</span>
          </h1>
          <p className="landing-hero-description">
            Submit the operation. Let the queue take over.
            <br className="landing-desktop-break" /> Generate invoices
            asynchronously and track every job from start to finish.
          </p>
          <div className="landing-hero-actions">
            <Link className="button primary landing-button" to="/register">
              Get started
              <ArrowRight size={16} />
            </Link>
            <a
              className="button landing-button landing-secondary"
              href="#how-it-works"
            >
              See how it works
              <ChevronDown size={15} />
            </a>
          </div>
          <div className="landing-hero-notes">
            <span>
              <Check size={12} />
              Secure account sessions
            </span>
            <span className="landing-note-divider" />
            <span>Built for reliable background work</span>
          </div>
          <ProductPreview />
        </section>

        <section
          className="landing-stack landing-container"
          aria-label="Technical foundation"
        >
          <p>A simple workspace. A serious foundation.</p>
          <div>
            <span><Code2 size={18} />NestJS</span>
            <span><Database size={17} />PostgreSQL</span>
            <span><GitBranch size={17} />Prisma</span>
            <span><Layers size={17} />Redis</span>
            <span><Activity size={18} />BullMQ</span>
          </div>
        </section>

        <section id="product" className="landing-section landing-container">
          <div className="landing-section-heading">
            <span className="landing-kicker">LESS NOISE. MORE VISIBILITY.</span>
            <h2>
              Background work.
              <br />
              <span>Never a black box.</span>
            </h2>
            <p>
              One place to submit work, follow progress, and understand exactly
              what happened—without chasing logs.
            </p>
          </div>
          <div className="landing-feature-grid">
            <article className="landing-feature">
              <div className="landing-feature-art operation-art" aria-hidden="true">
                <span className="art-label">
                  <Layers size={12} />
                  BILLING OPERATION
                </span>
                <span className="art-period">
                  June billing<span className="art-period-chip">Jun 2025</span>
                </span>
                <div className="art-customers">
                  <span>A</span>
                  <span>L</span>
                  <span>S</span>
                  <i />
                  <span><ArrowRight size={14} /></span>
                  <span className="art-purple"><FileText size={15} /></span>
                </div>
              </div>
              <span className="landing-feature-number">01 / ORCHESTRATE</span>
              <h3>One operation. Many invoices.</h3>
              <p>
                Submit a billing period once. QueueBox creates an independent
                job for each customer and takes it from there.
              </p>
              <Link to="/register">Create an operation <ArrowRight size={13} /></Link>
            </article>

            <article className="landing-feature">
              <div className="landing-feature-art jobs-art" aria-hidden="true">
                <div>
                  <span><i className="tiny-dot" />job_16f8a4</span>
                  <span className="art-job-state"><CheckCheck size={11} />Completed</span>
                </div>
                <div>
                  <span><i className="tiny-dot" />job_16f8b1</span>
                  <span className="art-job-state processing-text"><Activity size={11} />Processing</span>
                </div>
                <div>
                  <span><i className="tiny-dot" />job_16f8c9</span>
                  <span className="art-job-state retry-text"><RotateCcw size={11} />Retrying</span>
                </div>
              </div>
              <span className="landing-feature-number">02 / PROCESS</span>
              <h3>Independent by design.</h3>
              <p>
                Each job runs on its own. A delay or failure in one customer’s
                invoice does not hold up the rest.
              </p>
              <Link to="/jobs">Explore the job queue <ArrowRight size={13} /></Link>
            </article>

            <article className="landing-feature">
              <div className="landing-feature-art invoice-art" aria-hidden="true">
                <div className="art-invoice-page">
                  <span><FileText size={13} />INVOICE<CheckCircleMark /></span>
                  <i />
                  <i />
                  <div><span>Customer</span><b>Northstar Studio</b></div>
                  <div><span>Billing period</span><b>June 2025</b></div>
                  <div className="art-invoice-bottom">
                    <span>Generated</span><b>Ready to inspect</b>
                  </div>
                </div>
              </div>
              <span className="landing-feature-number">03 / UNDERSTAND</span>
              <h3>Every outcome, accounted for.</h3>
              <p>
                Follow processing, inspect generated invoices, and bring failed
                jobs into focus when they need attention.
              </p>
              <Link to="/invoices">See invoice records <ArrowRight size={13} /></Link>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="landing-workflow-section">
          <div className="landing-container">
            <div className="landing-section-heading">
              <span className="landing-kicker">A CALMER WAY TO BILL</span>
              <h2>
                A little background work.
                <br />
                <span>A lot more peace of mind.</span>
              </h2>
            </div>
            <div className="landing-workflow">
              {[
                {
                  icon: Layers,
                  title: "Submit one operation",
                  text: "Choose the billing period. QueueBox records your request and creates the work.",
                },
                {
                  icon: Activity,
                  title: "Let the queue take over",
                  text: "Independent workers process invoices in the background, with retries for recoverable failures.",
                },
                {
                  icon: Eye,
                  title: "Follow every outcome",
                  text: "Track progress, inspect invoice records, and find the jobs that need your attention.",
                },
              ].map((step, index) => (
                <article key={step.title}>
                  <div className="landing-step-line">
                    <span className="landing-step-icon">
                      <step.icon size={21} strokeWidth={1.5} />
                    </span>
                    <span className="landing-step-connector" />
                    <span className="landing-step-number">0{index + 1}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
            <Link className="text-link landing-workflow-link" to="/register">
              Create your QueueBox account
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section
          id="built-for-reliability"
          className="landing-section landing-container landing-reliability"
        >
          <div className="landing-reliability-copy">
            <span className="landing-kicker">BUILT FOR THE BACKGROUND</span>
            <h2>
              Simple on the surface.
              <br />
              <span>Considered underneath.</span>
            </h2>
            <p>
              Billing operations deserve more than fire-and-forget. QueueBox is
              designed around durable records, independent workers, and
              observable outcomes.
            </p>
            <div className="landing-reliability-note">
              <ShieldCheck size={17} />
              <span>
                Invoice generation, not payment processing.
                <br />
                <small>Focused on doing one job well.</small>
              </span>
            </div>
          </div>
          <div className="landing-reliability-list">
            {[
              {
                icon: Database,
                title: "One source of truth",
                text: "PostgreSQL keeps the authoritative records. The queue transports work, not your business state.",
              },
              {
                icon: Fingerprint,
                title: "Submit with confidence",
                text: "Idempotent operations and a transactional outbox help protect against duplicate submissions and lost work.",
              },
              {
                icon: RotateCcw,
                title: "Failures, brought into focus",
                text: "Retries handle the recoverable. Failed job records make the rest visible and ready to investigate.",
              },
            ].map((feature) => (
              <article key={feature.title}>
                <span><feature.icon size={19} strokeWidth={1.5} /></span>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="landing-section landing-container landing-faq">
          <div>
            <span className="landing-kicker">A FEW THINGS TO KNOW</span>
            <h2>Clear by design.</h2>
            <p>A little context before you jump in.</p>
          </div>
          <div className="landing-faq-list">
            {questions.map((item) => (
              <details key={item.question}>
                <summary>
                  {item.question}
                  <ChevronDown size={16} />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing-container">
          <div className="landing-final-cta">
            <span className="landing-cta-icon">
              <Layers size={25} strokeWidth={1.5} />
            </span>
            <span className="landing-kicker">
              GIVE YOUR BILLING SOME BREATHING ROOM
            </span>
            <h2>
              Less to manage.
              <br />
              <span>More handled.</span>
            </h2>
            <p>See what a little background work can do.</p>
            <Link className="button primary landing-button" to="/register">
              Get started
              <ArrowRight size={16} />
            </Link>
            <small>Illustrative product preview · Secure account access</small>
          </div>
        </section>
      </main>

      <footer className="landing-footer landing-container">
        <div>
          <Brand />
          <p>Work happens in the background.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#product">Product</a>
          <a href="#faq">FAQs</a>
          <Link to="/register">Create account <ArrowUpRight size={12} /></Link>
          <Link to="/login">Sign in</Link>
        </nav>
        <span>© {new Date().getFullYear()} QueueBox</span>
      </footer>
    </div>
  )
}

function ProductPreview() {
  const [tab, setTab] = useState("Operations")
  const tabs = ["Operations", "Job queue", "Invoices"]

  return (
    <div className="landing-preview-wrap" id="workspace-preview">
      <div className="landing-preview-caption">
        <span />
        <span>AN ILLUSTRATIVE LOOK INSIDE QUEUEBOX</span>
        <span />
      </div>
      <div className="landing-product-preview">
        <div className="landing-preview-bar">
          <div>
            <span className="landing-window-dot" />
            <span className="landing-window-dot" />
            <span className="landing-window-dot" />
          </div>
          <span>
            <ShieldCheck size={12} />
            queuebox / billing-workspace
          </span>
          <span className="landing-preview-demo">
            <span className="tiny-dot" />
            Product preview
          </span>
        </div>
        <div className="landing-preview-content">
          <div className="landing-preview-heading">
            <div>
              <span className="landing-preview-eyebrow">
                YOUR BILLING, IN FOCUS
              </span>
              <h2>Good things happen in the background.</h2>
            </div>
            <Link to="/register">
              Open workspace
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="landing-preview-metrics">
            {[
              { label: "Billing operations", value: "05", icon: Layers },
              { label: "Invoice jobs", value: "1,284", icon: Activity },
              { label: "Completed", value: "1,214", icon: CircleCheck },
              { label: "Need attention", value: "08", icon: ShieldAlert },
            ].map((metric) => (
              <div key={metric.label}>
                <span>
                  {metric.label}
                  <metric.icon size={14} />
                </span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <div
            className="landing-preview-tabs"
            role="tablist"
            aria-label="Illustrative workspace preview"
          >
            {tabs.map((name, index) => (
              <button
                id={`preview-tab-${index}`}
                role="tab"
                aria-selected={tab === name}
                aria-controls="preview-panel"
                tabIndex={tab === name ? 0 : -1}
                key={name}
                onClick={() => setTab(name)}
                onKeyDown={(event) => {
                  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
                  event.preventDefault()
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? 2
                        : (index + (event.key === "ArrowRight" ? 1 : -1) + 3) % 3
                  setTab(tabs[next])
                  document.getElementById(`preview-tab-${next}`)?.focus()
                }}
              >
                <span>
                  {name === "Operations" ? (
                    <Layers size={13} />
                  ) : name === "Job queue" ? (
                    <Activity size={13} />
                  ) : (
                    <FileText size={13} />
                  )}
                </span>
                {name}
              </button>
            ))}
            <span className="landing-sample-data">Illustrative data</span>
          </div>
          <div
            id="preview-panel"
            role="tabpanel"
            aria-labelledby={`preview-tab-${tabs.indexOf(tab)}`}
            tabIndex={0}
            className="landing-preview-table"
          >
            {tab === "Operations" ? (
              <table>
                <thead>
                  <tr><th>Operation</th><th>Billing period</th><th>Jobs</th><th>Progress</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {previewOperations.map((operation) => (
                    <tr key={operation.id}>
                      <td><Link to="/login"><Layers size={13} /><code>{operation.id}</code></Link></td>
                      <td>{operation.period}</td>
                      <td>{operation.total}</td>
                      <td>
                        <div className="landing-mini-progress">
                          <span style={{ width: `${(operation.completed / operation.total) * 100}%` }} />
                        </div>
                        <small>{operation.completed}/{operation.total}</small>
                      </td>
                      <td><StatusBadge status={operation.status} /></td>
                      <td><ArrowUpRight size={12} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : tab === "Job queue" ? (
              <table>
                <thead>
                  <tr><th>Job</th><th>Customer</th><th>Operation</th><th>Attempts</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {previewJobs.map((job) => (
                    <tr key={job.id}>
                      <td><Link to="/login"><Activity size={13} /><code>{job.id}</code></Link></td>
                      <td>{job.customer}</td>
                      <td><code>{job.operation}</code></td>
                      <td>{job.attempts}</td>
                      <td><StatusBadge status={job.status} /></td>
                      <td><ArrowUpRight size={12} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr><th>Invoice</th><th>Customer</th><th>Billing period</th><th>Amount</th><th>Currency</th><th /></tr>
                </thead>
                <tbody>
                  {previewInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><Link to="/login"><FileText size={13} /><code>{invoice.id}</code></Link></td>
                      <td>{invoice.customer}</td>
                      <td>{invoice.period}</td>
                      <td>{invoice.amount}</td>
                      <td>{invoice.currency}</td>
                      <td><ArrowUpRight size={12} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="landing-preview-footnote">
            <span>
              <Terminal size={12} />
              Example interface · Not live account data
            </span>
            <Link to="/login">
              Sign in to your workspace
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
      <div className="landing-preview-shadow" aria-hidden="true" />
    </div>
  )
}

function CheckCircleMark() {
  return <CheckCheck size={12} />
}
