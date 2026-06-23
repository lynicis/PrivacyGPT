import handler from "@tanstack/react-start/server-entry"
import { handleWatchdogQueueMessage } from "./lib/watchdog"

export default {
  fetch: handler.fetch,
  async queue(batch: any, env: any, _ctx: any) {
    for (const message of batch.messages) {
      await handleWatchdogQueueMessage(message.body, env)
    }
  },
}
