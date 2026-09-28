import { client, account } from '~/appwrite'

export default defineNuxtPlugin(() => {
  // Ensure client.ping() runs once when the app starts
  client.ping().catch((err) => {
    console.error('Appwrite ping error:', err)
  })

  // Check user session on client start
  if (import.meta.client) {
    const { checkSession } = useAppwriteAuth()
    checkSession().catch(() => {})
  }

  return {
    provide: {
      appwrite: client,
      appwriteAccount: account
    }
  }
})
