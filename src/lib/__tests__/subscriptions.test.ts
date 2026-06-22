import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { db } from "../db"
import { subscriptions } from "../db/schema"
import { eq } from "drizzle-orm"
import {
  subscribeEmailHandler,
  confirmSubscriptionHandler,
  unsubscribeHandler,
} from "../api"

describe("subscription pipeline", () => {
  const testEmail = "test-subscriber@example.com"

  beforeEach(async () => {
    // Clean up just in case
    await db.delete(subscriptions).where(eq(subscriptions.email, testEmail))
  })

  afterEach(async () => {
    // Clean up
    await db.delete(subscriptions).where(eq(subscriptions.email, testEmail))
  })

  it("should block invalid emails", async () => {
    const res = await subscribeEmailHandler({
      email: "invalid-email",
      companyId: null,
    })
    expect(res.success).toBe(false)
    expect(res.error).toBe("Invalid email format")
  })

  it("should insert subscription in pending status", async () => {
    const res = await subscribeEmailHandler({
      email: testEmail,
      companyId: null,
    })
    expect(res.success).toBe(true)
    expect(res.message).toContain("check your email")

    const records = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, testEmail))
    expect(records).toHaveLength(1)
    expect(records[0].status).toBe("pending_confirmation")
    expect(records[0].token).toBeDefined()
  })

  it("should confirm subscription when valid token is provided", async () => {
    // 1. Subscribe
    await subscribeEmailHandler({ email: testEmail, companyId: null })
    const records = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, testEmail))
    const token = records[0].token

    // 2. Confirm
    const confirmRes = await confirmSubscriptionHandler({ token })
    expect(confirmRes.success).toBe(true)
    expect(confirmRes.companyName).toBe("All Companies")

    // 3. Verify status updated
    const updated = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, testEmail))
    expect(updated[0].status).toBe("confirmed")
  })

  it("should unsubscribe when token is provided", async () => {
    // 1. Subscribe
    await subscribeEmailHandler({ email: testEmail, companyId: null })
    const records = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, testEmail))
    const token = records[0].token

    // 2. Unsubscribe
    const unsubRes = await unsubscribeHandler({ token })
    expect(unsubRes.success).toBe(true)

    // 3. Verify deleted
    const recordsAfter = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, testEmail))
    expect(recordsAfter).toHaveLength(0)
  })
})
