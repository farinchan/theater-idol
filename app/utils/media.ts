import { apiService } from '~/services/api-service'

/**
 * Helper to resolve media URLs (handles relative backend uploads like /uploads/... and full URLs)
 */
export function resolveMediaUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }

  try {
    const apiUrl = apiService.getBaseUrl() || 'http://localhost:8080'
    const origin = new URL(apiUrl).origin
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${origin}${cleanPath}`
  } catch {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `http://localhost:8080${cleanPath}`
  }
}
