import { createContext, useContext, useState } from "react"
import { Check, X } from "lucide-react"
import { Outlet } from "react-router-dom"
import { CreateOperation } from "./CreateOperation"

interface Workspace {
  openCreate: () => void
  notify: (message: string) => void
}

const Context = createContext<Workspace | null>(null)

export function useWorkspace() {
  const workspace = useContext(Context)
  if (!workspace) throw new Error("useWorkspace must be used within WorkspaceProvider")
  return workspace
}

export function WorkspaceProvider() {
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState("")

  return (
    <Context.Provider
      value={{
        openCreate: () => setCreating(true),
        notify: setToast,
      }}
    >
      <Outlet />
      {creating && <CreateOperation onClose={() => setCreating(false)} />}
      {toast && (
        <div role="status" className="toast">
          <span className="toast-icon">
            <Check size={15} />
          </span>
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </Context.Provider>
  )
}
