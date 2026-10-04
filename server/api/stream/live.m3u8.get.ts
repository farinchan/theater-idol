import { handleStreamProxy } from '~~/server/utils/streamProxy'

export default defineEventHandler(async (event) => {
  return handleStreamProxy(event)
})
