import type { SourceID, SourceResponse } from "@shared/types"
import { getCacheTable } from "#/database/cache"

export default defineEventHandler(async (event) => {
  try {
    const { sources: _ }: { sources: SourceID[] } = await readBody(event)
    const cacheTable = await getCacheTable()
    const ids = _?.filter(k => sources[k])

    // 只有在数据库可用且有有效ID时才返回缓存数据
    if (ids?.length && cacheTable) {
      const caches = await cacheTable.getEntire(ids)
      const now = Date.now()
      return caches.map(cache => ({
        status: "cache",
        id: cache.id,
        items: cache.items,
        updatedTime: now - cache.updated < sources[cache.id].interval ? now : cache.updated,
      })) as SourceResponse[]
    }

    // 如果没有数据库或缓存，返回空数组（前端会处理）
    return []
  } catch (e) {
    logger.error("Error in entire API:", e)
    // 返回空数组而不是抛出错误，让前端处理
    return []
  }
})
