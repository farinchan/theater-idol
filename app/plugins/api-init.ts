import { apiService } from '~/services/api-service'
import { streamService } from '~/services/stream-service'
import { chatService } from '~/services/chat-service'
import { setGlobalToast } from '~/composables/error-helper'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  if (config.public?.apiUrl) {
    apiService.setBaseUrl(config.public.apiUrl as string)
    streamService.setBaseUrl(config.public.apiUrl as string)
  }

  if (config.public?.wsUrl) {
    chatService.setWsUrl(config.public.wsUrl as string)
  }

  if (import.meta.client) {
    try {
      const toast = useToast()
      setGlobalToast(toast)
    } catch {
      // Toast not available
    }
  }
})
