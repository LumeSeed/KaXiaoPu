import { ref, watch, type Ref } from 'vue'
import { productAPI } from '../api/product'
import type { CategoryGroup } from '../utils/category'

// Public category responses have no counts in v1.5.2. Read pagination totals
// with one product per request; never infer totals from the visible page.
const cache = new Map<number, { value: number; expiresAt: number }>()
const pending = new Map<number, Promise<number | undefined>>()

const getCount = (id: number): Promise<number | undefined> => {
  const cached = cache.get(id)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value)
  const existing = pending.get(id)
  if (existing) return existing
  const request = productAPI.list({ page: 1, page_size: 1, ...(id ? { category_id: id } : {}) })
    .then(response => {
      const total = response.data.pagination?.total
      if (typeof total !== 'number' || !Number.isInteger(total) || total < 0) return undefined
      cache.set(id, { value: total, expiresAt: Date.now() + 60_000 })
      return total
    })
    .catch(() => undefined)
    .finally(() => pending.delete(id))
  pending.set(id, request)
  return request
}

export function useCategoryProductCounts(groups: Ref<CategoryGroup[]>) {
  const counts = ref<Record<number, number>>({})
  watch(() => groups.value.flatMap(group => [group.id, ...group.children.map(child => child.id)]).join(','), async (ids, _, onCleanup) => {
    let stale = false
    onCleanup(() => { stale = true })
    counts.value = {}
    if (!ids) return
    // 0 is the unfiltered total, queried separately to avoid double-counting children.
    const queue = [...new Set([0, ...ids.split(',').map(Number)])]
    await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => {
      while (queue.length && !stale) {
        const id = queue.shift()!
        const count = await getCount(id)
        if (!stale && count !== undefined) counts.value[id] = count
      }
    }))
  }, { immediate: true })
  return counts
}
