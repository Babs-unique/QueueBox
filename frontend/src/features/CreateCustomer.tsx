import { useRef, useState, type FormEvent } from "react"
import { Info, UserPlus } from "lucide-react"
import { Modal } from "../components/ui"
import { useWorkspace } from "./workspace"
import { getApiErrorMessage } from "../api/baseApi"
import { useCreateCustomerMutation } from "./customers/customersApi"

interface CreateCustomerProps {
  onClose: () => void
  onCreated: () => void
}
interface FieldErrors {
  name?: string
  email?: string
}

export function CreateCustomer({ onClose, onCreated }: CreateCustomerProps) {
  const { notify } = useWorkspace()
  const [createCustomer, { isLoading }] = useCreateCustomerMutation()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [requestError, setRequestError] = useState("")
  const submitted = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitted.current || isLoading) return
    setRequestError("")
    const nextErrors: FieldErrors = {}
    if (!name.trim()) nextErrors.name = "Enter a customer name."
    else if (name.trim().length > 120)
      nextErrors.name = "Use 120 characters or fewer."
    if (!email.trim()) nextErrors.email = "Enter an email address."
    else if (
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      nextErrors.email = "Enter a valid email address."
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      event.currentTarget
        .querySelector<HTMLInputElement>(
          nextErrors.name ? "#customer-name" : "#customer-email",
        )
        ?.focus()
      return
    }
    try {
      const customer = await createCustomer({ name: name.trim(), email: email.trim() }).unwrap()
      submitted.current = true
      notify(`${customer.name} added to your customers.`)
      onCreated()
    } catch (error) {
      setRequestError(getApiErrorMessage(error))
    }
  }

  return (
    <Modal
      title="Add customer"
      subtitle="A new customer for your billing workspace."
      onClose={onClose}
    >
      <form className="customer-create-form" onSubmit={submit} noValidate>
        <div className="customer-create-intro">
          <span className="customer-create-icon">
            <UserPlus size={21} />
          </span>
          <div>
            <strong>Start with the essentials.</strong>
            <p>Add a customer name and email to your account.</p>
          </div>
        </div>
        <label htmlFor="customer-name">
          Customer name <span className="required-label">Required</span>
        </label>
        <input
          id="customer-name"
          name="customerName"
          autoComplete="organization"
          placeholder="e.g. Acme Inc."
          value={name}
          maxLength={120}
          required
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "customer-name-error" : undefined}
          onChange={(event) => {
            setName(event.target.value)
            setErrors((previous) => ({ ...previous, name: undefined }))
          }}
        />
        {errors.name && (
          <p id="customer-name-error" className="field-error" role="alert">
            {errors.name}
          </p>
        )}
        <label htmlFor="customer-email">
          Email address <span className="required-label">Required</span>
        </label>
        <input
          id="customer-email"
          name="customerEmail"
          type="email"
          autoComplete="email"
          placeholder="billing@company.com"
          value={email}
          maxLength={254}
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "customer-email-error" : undefined}
          onChange={(event) => {
            setEmail(event.target.value)
            setErrors((previous) => ({ ...previous, email: undefined }))
          }}
        />
        {errors.email && (
          <p id="customer-email-error" className="field-error" role="alert">
            {errors.email}
          </p>
        )}
        {requestError && (
          <div className="error-note" role="alert">
            <Info size={17} />
            <p>{requestError}</p>
          </div>
        )}
        <div className="info-note">
          <Info size={16} />
          <span>This customer will be saved to your QueueBox account.</span>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="button"
            disabled={isLoading}
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={isLoading}>
            {isLoading ? "Adding…" : "Add customer"}
            {!isLoading && <UserPlus size={15} />}
          </button>
        </div>
      </form>
    </Modal>
  )
}
