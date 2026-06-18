import type { QueryClient } from "@tanstack/react-query"

export async function optimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updater: (old: T | undefined) => T | undefined,
): Promise<T | undefined> {
  await queryClient.cancelQueries({ queryKey })
  const previous = queryClient.getQueryData<T>(queryKey)
  queryClient.setQueryData<T | undefined>(queryKey, updater)
  return previous
}

export function rollbackUpdate<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  previous: T | undefined,
): void {
  if (previous !== undefined) {
    queryClient.setQueryData(queryKey, previous)
  }
}
