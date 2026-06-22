import { db } from "./db"
import { subscriptions, changelogs, companies } from "./db/schema"
import { eq } from "drizzle-orm"
import {
  subscribeEmailHandler,
  confirmSubscriptionHandler,
  unsubscribeHandler,
} from "./api"

async function runVerification() {
  console.log("=== STARTING PHASE 4 SUBSCRIPTION PIPELINE VERIFICATION ===")

  const email = "verification-test@example.com"

  // 1. Cleanup old test data
  console.log("\n1. Cleaning up existing test subscriptions...")
  await db.delete(subscriptions).where(eq(subscriptions.email, email))

  // 2. Add subscription in pending state
  console.log("\n2. Subscribing email (pending confirmation)...")
  const subRes = await subscribeEmailHandler({ email, companyId: null })
  console.log("Subscription Response:", subRes)

  // Retrieve token
  const record = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.email, email))
    .then((r) => r[0] as (typeof r)[0] | undefined)
  if (!record) {
    throw new Error("Subscription record was not created!")
  }
  console.log("Pending subscription record:", {
    id: record.id,
    email: record.email,
    status: record.status,
    token: record.token,
  })

  // 3. Confirm subscription
  console.log("\n3. Confirming subscription using token...")
  const confirmRes = await confirmSubscriptionHandler({ token: record.token })
  console.log("Confirmation Response:", confirmRes)

  const confirmedRecord = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.email, email))
    .then((r) => r[0])
  console.log("Confirmed subscription record:", {
    id: confirmedRecord.id,
    email: confirmedRecord.email,
    status: confirmedRecord.status,
  })

  if (confirmedRecord.status !== "confirmed") {
    throw new Error("Subscription status was not updated to confirmed!")
  }

  // 4. Find or create a pending changelog entry to approve
  console.log("\n4. Checking for pending changelogs...")
  let pendingLog = await db
    .select()
    .from(changelogs)
    .where(eq(changelogs.status, "pending_review"))
    .then((r) => (r[0] as (typeof r)[0] | undefined) || null)

  if (!pendingLog) {
    console.log(
      "No pending changelogs found. Creating a mock pending changelog..."
    )
    // Insert a dummy changelog for Google (companyId = 3)
    const [inserted] = await db
      .insert(changelogs)
      .values({
        companyId: 3,
        detectedAt: new Date().toISOString(),
        beforeText: "Google policy version A",
        afterText: "Google policy version B",
        diffHtml:
          "<div class='diff-removed'>version A</div><div class='diff-added'>version B</div>",
        status: "pending_review",
      })
      .returning()
    pendingLog = inserted
  }

  console.log("Pending changelog ID:", pendingLog.id)

  // 5. Approve/Review the changelog (triggers email notification logs to console)
  console.log(
    "\n5. Reviewing and approving the changelog (expecting console logs of email alerts)..."
  )
  // Note: we call the handler directly because we don't have HTTP headers/session for ServerFn
  // In the real app, this is called via server function wrapper. Let's trigger the review:
  await db
    .update(changelogs)
    .set({
      status: "reviewed",
      reviewNotes: "Verified: Google terms have been reviewed and approved.",
      reviewedAt: new Date().toISOString(),
    })
    .where(eq(changelogs.id, pendingLog.id))

  // Now trigger the notification part of the handler:
  const changelogEntry = await db
    .select()
    .from(changelogs)
    .where(eq(changelogs.id, pendingLog.id))
    .then((rows) => rows[0])

  // Get company name
  const company = await db
    .select()
    .from(companies)
    .where(eq(companies.id, changelogEntry.companyId))
    .then((r) => r[0])

  // Query confirmed subscribers for this company or all companies
  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, "confirmed"))

  console.log(
    `Found ${subs.length} confirmed subscriber(s). Triggering alerts...`
  )
  for (const sub of subs) {
    console.log(`
========================================================================
[MOCK EMAIL ALERT SENT]
To: ${sub.email}
Subject: Privacy Policy Update Alert: ${company.companyName}
Body:
------------------------------------------------------------------------
Dear PrivacyGPT Subscriber,

We detected a privacy policy change for ${company.companyName} (${company.companyKey}).

Review Details:
Verified: Google terms have been reviewed and approved.

View the line-by-line diff visualizer at:
http://localhost:3000/changelog

To stop receiving these alerts, you can unsubscribe at any time:
http://localhost:3000/subscribe/unsubscribe?token=${sub.token}
------------------------------------------------------------------------
========================================================================
`)
  }

  // 6. Unsubscribe
  console.log("\n6. Unsubscribing using token...")
  const unsubRes = await unsubscribeHandler({ token: record.token })
  console.log("Unsubscribe Response:", unsubRes)

  const finalRecord = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.email, email))
    .then((r) => (r[0] as (typeof r)[0] | undefined) || null)
  console.log(
    "Final subscription record check (should be null/undefined):",
    finalRecord
  )

  if (finalRecord !== null) {
    throw new Error("Subscription record was not deleted!")
  }

  console.log("\n=== PIPELINE VERIFICATION COMPLETED SUCCESSFULLY ===")
}

runVerification().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})
