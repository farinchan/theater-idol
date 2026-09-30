import { readSiteSettings } from '../utils/settingsStorage'

export default defineEventHandler(async () => {
  return await readSiteSettings()
})
