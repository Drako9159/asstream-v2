"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function ToastHandler({ error, message }: { error?: string, message?: string }) {
  const handled = useRef({ error: false, message: false })

  useEffect(() => {
    // Evitamos ejecutarlo múltiples veces en StrictMode
    if (error && !handled.current.error) {
      toast.error("Error", { description: error })
      handled.current.error = true
    }
    if (message && !handled.current.message) {
      toast.success("Éxito", { description: message })
      handled.current.message = true
    }
  }, [error, message])

  return null
}
