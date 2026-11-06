import { useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  Check,
  Info,
  Layers,
  LoaderCircle,
} from "lucide-react"
import { Modal } from "../components/ui"
import { getApiErrorMessage } from "../api/baseApi"
import {
  useCreateBillingOperationMutation,
  type CreatedBillingOperation,
} from "./billing/billingApi"

export function CreateOperation({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  )
  const [reviewing, setReviewing] = useState(false)
  const [created, setCreated] = useState<CreatedBillingOperation | null>(null)
  const [error, setError] = useState("")
  const [createBillingOperation, { isLoading }] =
    useCreateBillingOperationMutation()
  const periodLabel = period
    ? new Date(`${period}-02`).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : ""

  async function submit() {
    setError("")
    try {
      const result = await createBillingOperation({
        billingPeriod: period,
        idempotencyKey,
      }).unwrap()
      setCreated(result)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    }
  }

  return (
    <Modal
      title={created ? "Billing operation submitted" : "New billing operation"}
      subtitle={
        created
          ? "Your request was accepted by QueueBox."
          : "Choose the billing period to process for your customers."
      }
      onClose={onClose}
    >
      {created ? (
        <>
          <div className="success-circle">
            <Check size={28} />
          </div>
          <div className="success-content">
            <h3>Operation accepted.</h3>
            <p>
              {created.queueDispatch
                ? "The operation and its invoice jobs were queued."
                : (created.warning ??
                  "The operation was saved, but queue dispatch is delayed.")}
            </p>
            <code>{created.id}</code>
          </div>
          <div className="info-note">
            <Info size={16} />
            {created.queueDispatch
              ? "The backend does not yet expose operation history or job status."
              : "The request is durably saved. Check the backend queue before retrying."}
          </div>
          <div className="modal-actions">
            <button className="button primary" onClick={onClose}>
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flow-steps">
            <span className={!reviewing ? "active" : ""}>
              <b>1</b> Billing period
            </span>
            <span className="step-line" />
            <span className={reviewing ? "active" : ""}>
              <b>2</b> Review & submit
            </span>
          </div>
          {!reviewing ? (
            <div className="form-section">
              <label htmlFor="billing-period">Billing period</label>
              <p>Select the month to generate invoices for.</p>
              <div className="input-icon">
                <CalendarDays size={17} />
                <input
                  id="billing-period"
                  type="month"
                  required
                  value={period}
                  onChange={(event) => {
                    if (event.target.value !== period) {
                      setPeriod(event.target.value)
                      setIdempotencyKey(crypto.randomUUID())
                    }
                  }}
                />
              </div>
              <div className="info-note">
                <Info size={16} />
                QueueBox creates one invoice job for each customer in your
                account.
              </div>
            </div>
          ) : (
            <div className="review-box">
              <Layers size={23} />
              <div>
                <h3>{periodLabel}</h3>
                <p>One billing operation · Asynchronous invoice generation</p>
              </div>
            </div>
          )}
          {error && (
            <div className="error-note" role="alert">
              <Info size={17} />
              <p>{error}</p>
            </div>
          )}
          <div className="modal-actions">
            <button
              className="button"
              disabled={isLoading}
              onClick={reviewing ? () => setReviewing(false) : onClose}
            >
              {reviewing ? "Back" : "Cancel"}
            </button>
            <button
              className="button primary"
              disabled={!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || isLoading}
              onClick={reviewing ? submit : () => setReviewing(true)}
            >
              {isLoading ? (
                <>
                  Submitting…
                  <LoaderCircle size={15} className="spin" />
                </>
              ) : (
                <>
                  {reviewing ? "Submit operation" : "Review operation"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
