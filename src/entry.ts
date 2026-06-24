import handler from "@tanstack/react-start/server-entry"
import { handleWatchdogQueueMessage } from "./lib/watchdog"
import { reviewChangelogWithAI } from "./lib/ai-reviewer"

export default {
  fetch: handler.fetch,
  async queue(batch: any, env: any, _ctx: any) {
    const queueName = batch.queue

    if (queueName === "privacygpt-ai-review-queue") {
      for (const message of batch.messages) {
        try {
          await reviewChangelogWithAI(message.body.changelogId, env)
          message.ack()
        } catch (err) {
          console.error(
            `[ai-review] Failed for changelog ${message.body.changelogId}:`,
            err
          )
          message.retry()
        }
      }
    } else if (queueName === "privacygpt-watchdog-queue") {
      for (const message of batch.messages) {
        try {
          await handleWatchdogQueueMessage(message.body, env)
          message.ack()
        } catch (err) {
          console.error(
            `[watchdog] Failed for company ${message.body?.companyId}:`,
            err
          )
          message.retry()
        }
      }
    } else {
      console.warn(`[queue] Unknown queue: ${queueName}`)
    }
  },
}
