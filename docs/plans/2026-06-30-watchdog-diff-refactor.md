# Watchdog Text Extraction and Diffing Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the watchdog's HTML-to-text extraction and diffing logic to preserve vertical page layout (newlines) so that line-by-line diffing does not collapse into a single massive block and remains readable and concise.

**Architecture:** Update `stripHtmlToText` to collapse horizontal spaces while preserving vertical line/paragraph layout. Refactor `diffLines` usage in `checkCompany` to generate readable, multi-line diff outputs. Add test coverage for layout-preserving text extraction and correct line-by-line diff formatting.

**Tech Stack:** Bun, Drizzle ORM, D1 (SQLite), Vitest, html-to-text, diff

---

### Task 1: Refactor stripHtmlToText to preserve newlines

**Files:**

- Modify: `src/lib/watchdog.ts:10-48`
- Modify: `src/lib/__tests__/watchdog.test.ts:96-101`

**Step 1: Write a failing test for layout preservation**
Update the "collapses whitespace" test and add a new test in `src/lib/__tests__/watchdog.test.ts` to assert that paragraph newlines are preserved rather than being collapsed into a single line.

```typescript
it("collapses horizontal whitespace but preserves vertical newlines", () => {
  const html = "<p>Paragraph one.</p><p>Paragraph two.</p>"
  const result = stripHtmlToText(html)
  expect(result).toContain("Paragraph one.\nParagraph two.")
})
```

**Step 2: Run test to verify it fails**
Run: `bun run test`
Expected: FAIL on the new test since paragraph newlines are collapsed into spaces.

**Step 3: Modify stripHtmlToText implementation**
Update `stripHtmlToText` to avoid replacing all newlines with a single space. Split by newline, collapse horizontal spaces on each line, filter out empty lines, and join with a single newline or double newline.

```typescript
export function stripHtmlToText(html: string): string {
  const options = {
    selectors: [
      { selector: "nav", format: "skip" },
      { selector: "header", format: "skip" },
      { selector: "footer", format: "skip" },
      { selector: "aside", format: "skip" },
      { selector: "form", format: "skip" },
      { selector: "svg", format: "skip" },
      { selector: "script", format: "skip" },
      { selector: "style", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
    wordwrap: null,
    preserveNewlines: true,
  }

  const converted = decodeHtmlEntities(convert(html, options))
  return converted
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n")
}
```

**Step 4: Run test to verify it passes**
Run: `bun run test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/watchdog.ts src/lib/__tests__/watchdog.test.ts
git commit -m "refactor: preserve newlines in stripHtmlToText"
```

---

### Task 2: Refactor diff formatting in checkCompany

**Files:**

- Modify: `src/lib/watchdog.ts:161-169`

**Step 1: Write a failing/verifying test**
Add a test inside `src/lib/__tests__/watchdog.test.ts` to assert that when only one line changes in a multi-line document, `checkCompany` creates a concise diff containing only the changed parts or correctly formats line changes without wrapping the entire unchanged document.

**Step 2: Run test to verify behavior**
Run: `bun run test`

**Step 3: Refactor diffLines formatting**
Verify that line-by-line diff returns clean HTML.

```typescript
const diffHtml = diffLines(latestSnapshot.rawContent, result.text)
  .map((part) =>
    part.added
      ? `<span class="diff-added">${escapeHtml(part.value)}</span>`
      : part.removed
        ? `<span class="diff-removed">${escapeHtml(part.value)}</span>`
        : `<span class="diff-unchanged">${escapeHtml(part.value)}</span>`
  )
  .join("\n")
```

(No modifications needed here if `latestSnapshot.rawContent` contains newlines, but we should make sure that the stored format resolves future comparisons properly.)

**Step 4: Run test to verify it passes**
Run: `bun run test`
Expected: PASS

**Step 5: Commit**

```bash
git commit -am "test: verify line-by-line diffing with newlines preserved"
```
