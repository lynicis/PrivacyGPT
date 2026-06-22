export default {
  async scheduled(
    _event: ScheduledEvent,
    env: { APP_URL?: string; CRON_SECRET?: string }
  ) {
    const appUrl = env.APP_URL
    const cronSecret = env.CRON_SECRET

    if (!appUrl) {
      console.error("[cron-worker] APP_URL env var not set")
      return
    }

    const url = `${appUrl.replace(/\/$/, "")}/api/cron/watchdog`

    console.log(`[cron-worker] Triggering watchdog at ${url}`)

    const response = await fetch(url, {
      headers: {
        ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
      },
    })

    if (!response.ok) {
      console.error(`[cron-worker] Watchdog returned ${response.status}`)
      return
    }

    const result = await response.json()
    console.log("[cron-worker] Watchdog result:", result)
  },
}
