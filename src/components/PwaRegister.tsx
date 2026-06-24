import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // SW registration failed silently — no caching needed for basic installable
    })
  }, [])

  return null
}
