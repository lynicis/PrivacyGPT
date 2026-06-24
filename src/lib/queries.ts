import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  getCompaniesFn,
  getCompanyByKeyFn,
  getChangelogsFn,
  getSnapshotCountsFn,
  getSnapshotTotalCountFn,
  getPendingReviewsCountFn,
  reviewChangelogFn,
} from "./api"

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

export function companiesQueryOptions(filters: Record<string, any> = {}) {
  return queryOptions({
    queryKey: queryKeys.companies.list(filters),
    queryFn: () => getCompaniesFn({ data: filters } as any),
  })
}

export function useCompanies(filters: Record<string, any> = {}) {
  return useQuery(companiesQueryOptions(filters))
}

export function companyByKeyQueryOptions(key: string) {
  return queryOptions({
    queryKey: queryKeys.companies.byKey(key),
    queryFn: () => getCompanyByKeyFn({ data: key } as any),
    enabled: !!key,
  })
}

export function useCompanyByKey(key: string) {
  return useQuery(companyByKeyQueryOptions(key))
}

export function changelogsQueryOptions(filters: Record<string, any> = {}) {
  return queryOptions({
    queryKey: queryKeys.changelogs.list(filters),
    queryFn: () => getChangelogsFn({ data: filters } as any),
  })
}

export function useChangelogs(filters: Record<string, any> = {}) {
  return useQuery(changelogsQueryOptions(filters))
}

export function snapshotCountsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.snapshots.counts(),
    queryFn: () => getSnapshotCountsFn(),
  })
}

export function useSnapshotCounts() {
  return useQuery(snapshotCountsQueryOptions())
}

export function snapshotTotalCountQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.snapshots.totalCount(),
    queryFn: () => getSnapshotTotalCountFn(),
  })
}

export function useSnapshotTotalCount() {
  return useQuery(snapshotTotalCountQueryOptions())
}

export function pendingReviewsCountQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.admin.pendingReviews(),
    queryFn: () => getPendingReviewsCountFn(),
  })
}

export function usePendingReviewsCount() {
  return useQuery(pendingReviewsCountQueryOptions())
}

export function useReviewChangelog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; reviewNotes: string }) =>
      reviewChangelogFn({ data: vars } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.changelogs.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.pendingReviews(),
      })
    },
  })
}
