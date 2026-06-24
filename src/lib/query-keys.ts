export const queryKeys = {
  companies: {
    all: ["companies"] as const,
    list: (filters: Record<string, unknown>) =>
      ["companies", "list", filters] as const,
    byKey: (key: string) => ["companies", key] as const,
  },
  changelogs: {
    all: ["changelogs"] as const,
    list: (filters: Record<string, unknown>) =>
      ["changelogs", "list", filters] as const,
  },
  snapshots: {
    all: ["snapshots"] as const,
    counts: () => ["snapshots", "counts"] as const,
    totalCount: () => ["snapshots", "total-count"] as const,
  },
  admin: {
    pendingReviews: () => ["admin", "pending-reviews"] as const,
    data: () => ["admin", "data"] as const,
  },
}
