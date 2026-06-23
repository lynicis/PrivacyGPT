# Queue-Based Watchdog Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the watchdog pipeline to use Cloudflare Queues to execute single company checks asynchronously.

**Architecture:** We will create a custom entrypoint `src/entry.ts` that wraps the TanStack Start handler for `fetch` and adds a `queue` handler. We will refactor `src/lib/watchdog.ts` to extract the single-company check (`checkCompany`) and change `runWatchdog` to enqueue company IDs. We will also update wrangler configurations and test configurations.

**Tech Stack:** Bun, Cloudflare Workers/Queues, Vitest, Drizzle ORM, TanStack Start

---

### Task 1: Update wrangler.jsonc

**Files:**
- Modify: `wrangler.jsonc`

**Step 1: Write configuration changes**

Edit `wrangler.jsonc` to point `main` to `src/entry.ts` and add `queues` configuration.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "privacygpt",
  "compatibility_date": "2026-06-22",
  "compatibility_flags": ["nodejs_compat"],
  "main": "src/entry.ts",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "privacygpt-db",
      "database_id": "0564b525-7dab-4146-acb0-b47616c39bae"
    }
  ],
  "queues": {
    "producers": [
      {
        "binding": "WATCHDOG_QUEUE",
        "queue": "privacygpt-watchdog-queue"
      }
    ],
    "consumers": [
      {
        "queue": "privacygpt-watchdog-queue",
        "max_batch_size": 1,
        "max_batch_timeout": 5
      }
    ]
  }
}
```

**Step 2: Commit**

```bash
git add wrangler.jsonc
git commit -m "config: configure watchdog queue bindings and entrypoint in wrangler.jsonc"
```

---

### Task 2: Create custom entrypoint

**Files:**
- Create: `src/entry.ts`

**Step 1: Write the minimal implementation**

Create `src/entry.ts`:

```typescript
import handler from "@tanstack/react-start/server-entry"
import { handleWatchdogQueueMessage } from "./lib/watchdog"

export default {
  fetch: handler.fetch,
  async queue(batch: any, env: any, ctx: any) {
    for (const message of batch.messages) {
      await handleWatchdogQueueMessage(message.body, env)
    }
  }
}
```

**Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS (or minimal errors related to `handleWatchdogQueueMessage` not being implemented yet)

**Step 3: Commit**

```bash
git add src/entry.ts
git commit -m "feat: add entrypoint routing fetch to TanStack and queue to watchdog"
```

---

### Task 3: Refactor watchdog.ts and extract checkCompany

**Files:**
- Modify: `src/lib/watchdog.ts`

**Step 1: Implement checkCompany and handleWatchdogQueueMessage**

Refactor `src/lib/watchdog.ts` to separate the fetching/comparison into `checkCompany`, and change `runWatchdog` to push to `WATCHDOG_QUEUE` when `WATCHDOG_QUEUE` binding is available.

```typescript
export async function checkCompany(companyId: number): Promise<void> {
  const db = await getDb()
  const company = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)
    .then((rows) => rows[0] || null)

  if (!company) {
    throw new Error(`Company with ID ${companyId} not found`)
  }

  console.log(`[watchdog] Checking ${company.companyName}...`)
  const result = await fetchPolicyText(company.sourceUrl)
  if (!result) {
    throw new Error(`Failed to fetch policy text for ${company.companyName}`)
  }

  const contentHash = hashText(result.text)
  const now = new Date().toISOString()

  const latestSnapshot = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.companyId, company.id))
    .orderBy(desc(snapshots.fetchedAt))
    .limit(1)
    .then((rows) => rows[0] || null)

  if (!latestSnapshot) {
    console.log(`[watchdog] Storing baseline for ${company.companyName}`)
    await db.insert(snapshots).values({
      companyId: company.id,
      fetchedAt: now,
      contentHash,
      rawContent: result.text,
    })
  } else if (latestSnapshot.contentHash !== contentHash) {
    console.log(`[watchdog] ⚠ CHANGE DETECTED for ${company.companyName}!`)
    const { diffHtml } = generateDiff(latestSnapshot.rawContent, result.text)

    await db.insert(changelogs).values({
      companyId: company.id,
      detectedAt: now,
      beforeText: latestSnapshot.rawContent.slice(0, 5000),
      afterText: result.text.slice(0, 5000),
      diffHtml,
      status: "pending_review",
    })

    await db.insert(snapshots).values({
      companyId: company.id,
      fetchedAt: now,
      contentHash,
      rawContent: result.text,
    })

    await db
      .update(companies)
      .set({ lastChangedDate: now.split("T")[0] })
      .where(eq(companies.id, company.id))
  } else {
    console.log(`[watchdog] No changes for ${company.companyName}`)
  }
}

export async function handleWatchdogQueueMessage(
  body: { companyId: number },
  env?: any
): Promise<void> {
  if (!body || typeof body.companyId !== "number") {
    throw new Error("Invalid watchdog queue message body")
  }
  await checkCompany(body.companyId)
}

export async function runWatchdog(): Promise<{
  checked?: number
  baselines?: number
  changes?: number
  errors?: number
  enqueued?: number
}> {
  const db = await getDb()
  const allCompanies = await db.select().from(companies)
  
  // Attempt to check if queue binding exists (Cloudflare context)
  let queue: { send(msg: any): Promise<void> } | undefined
  try {
    const mod = await import("cloudflare:workers")
    queue = (mod.env as any).WATCHDOG_QUEUE
  } catch {
    // Fallback to direct synchronous execution if not in Worker context with Queue
  }

  if (queue) {
    console.log("[watchdog] Queue binding detected. Enqueuing checks...")
    let enqueued = 0
    for (const company of allCompanies) {
      await queue.send({ companyId: company.id })
      enqueued++
    }
    return { enqueued }
  }

  // Fallback to original sequential checking
  let checked = 0
  let baselines = 0
  let changes = 0
  let errors = 0

  for (const company of allCompanies) {
    try {
      await checkCompany(company.id)
      checked++
    } catch (e) {
      console.error(`[watchdog] Error checking company ${company.id}:`, e)
      errors++
    }
  }

  return { checked, baselines, changes, errors }
}
```

**Step 2: Verify typecheck & tests**

Run: `bun run typecheck`
Expected: PASS
Run: `bun run test`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/watchdog.ts
git commit -m "feat: refactor watchdog to support individual company check and queue message consumption"
```

---

### Task 4: Add new tests for queue logic

**Files:**
- Modify: `src/lib/__tests__/watchdog.test.ts`

**Step 1: Write tests for checkCompany and handleWatchdogQueueMessage**

Add Vitest unit tests verifying that `checkCompany` fetches/compares properly, and `handleWatchdogQueueMessage` processes valid messages or rejects invalid messages.

**Step 2: Run tests**

Run: `bun run test`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/__tests__/watchdog.test.ts
git commit -m "test: add unit tests for checkCompany and handleWatchdogQueueMessage"
```
