import AdventuresTable from "./AdventuresTable"
import { listAdventuresForAdmin } from "./adventure.action"

const PAGE_SIZE = 10

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const query = await searchParams
  const page = Math.max(1, Number(query.page ?? "1") || 1)
  const search = (query.search ?? "").trim()

  const result = await listAdventuresForAdmin({
    page,
    pageSize: PAGE_SIZE,
    search,
  })

  const adventures = result.ok ? result.adventure : []
  const total = result.ok ? result.total : 0

  return (
    <AdventuresTable
      adventures={adventures}
      total={total}
      page={page}
      search={search}
      loadError={result.ok ? null : result.error}
    />
  )
}