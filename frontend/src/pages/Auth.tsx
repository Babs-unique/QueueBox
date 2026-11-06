import { useState, type FormEvent } from "react"
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Info,
  Layers,
  LoaderCircle,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Brand } from "../components/AppLayout"
import { getApiErrorMessage } from "../api/baseApi"
import { useLoginMutation, useRegisterMutation } from "../features/auth/authApi"

export function Auth({ register = false }: { register?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState("")
  const location = useLocation()
  const [notice, setNotice] = useState(
    () => (location.state as { notice?: string } | null)?.notice || "",
  )
  const [login, { isLoading: isLoggingIn }] = useLoginMutation()
  const [createAccount, { isLoading: isRegistering }] = useRegisterMutation()
  const loading = isLoggingIn || isRegistering
  const navigate = useNavigate()
  const destination =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/overview"

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setNotice("")
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") || "")
    const password = String(formData.get("password") || "")

    try {
      if (register) {
        await createAccount({
          name: String(formData.get("name") || ""),
          email,
          password,
        }).unwrap()
        setNotice("Account created. Sign in to continue.")
        navigate("/login", { replace: true, state: { notice: "Account created. Sign in to continue." } })
      } else {
        await login({ email, password }).unwrap()
        navigate(destination, { replace: true })
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <span className="eyebrow">THE QUIET ENGINE BEHIND YOUR BILLING</span>
          <h1>
            Billing operations,
            <br />
            handled in the
            <br />
            <span>background.</span>
          </h1>
          <p>
            Generate invoices asynchronously, monitor job execution, and keep
            every billing operation observable from one workspace.
          </p>
          <div className="auth-flow">
            <span>
              <Layers size={18} />
            </span>
            <i />
            <span>
              <LoaderCircle size={18} />
            </span>
            <i />
            <span>
              <Check size={18} />
            </span>
          </div>
          <div className="auth-flow-labels">
            <span>Submit</span>
            <span>Process</span>
            <span>Done.</span>
          </div>
        </div>
        <div className="auth-story-footer">
          <span className="tiny-dot" />
          Built for work that happens in the background.
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-form-card">
          <span className="subtle-pill">WELCOME TO QUEUEBOX</span>
          <h1>{register ? "A little less busywork." : "Welcome back."}</h1>
          <p>
            {register
              ? "Create your account. Let the queue take it from here."
              : "Your workspace is ready when you are."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  autoComplete="name"
                  name="name"
                  required
                  placeholder="Your name"
                  minLength={2}
                />
              </label>
            )}
            <label>
              Email address
              <input
                autoComplete="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  autoComplete={register ? "new-password" : "current-password"}
                  name="password"
                  type={visible ? "text" : "password"}
                  required
                  minLength={register ? 6 : 1}
                  placeholder={
                    register ? "At least 8 characters" : "Enter your password"
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            {(error || notice) && (
              <div role={error ? "alert" : "status"} className={error ? "error-note" : "info-note"}>
                <Info size={17} />
                <p>{error || notice}</p>
              </div>
            )}
            <button className="button primary full-width" disabled={loading}>
              {loading ? <LoaderCircle size={16} className="spin" /> : null}
              {loading
                ? "Please wait…"
                : register
                  ? "Create account"
                  : "Sign in"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to QueueBox?"}{" "}
            <Link
              to={register ? "/login" : "/register"}
              onClick={() => setError("")}
            >
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="auth-disclaimer">
            Your session is secured with an HTTP-only cookie.
          </p>
        </div>
        <span className="auth-copyright">
          © 2025 QueueBox. Less noise. More done.
        </span>
      </div>
    </div>
  )
}
