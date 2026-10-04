import { getActiveViewerCount } from '~~/server/utils/streamViewers'

export default defineEventHandler(() => {
  return {
    viewers: getActiveViewerCount()
  }
})
