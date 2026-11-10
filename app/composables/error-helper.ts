import axios from 'axios'

let globalToast: any = null

export const setGlobalToast = (toast: any) => {
  globalToast = toast
}

export const getGlobalToast = () => {
  return globalToast
}

export const handleServiceError = (error: any): never => {
  if (axios.isCancel(error)) {
    throw error // Re-throw cancelled requests
  }

  const responseData = error.response?.data
  let title = responseData?.message || 'Gagal'
  let message = ''

  // Handle validation errors (422)
  if (error.response?.status === 422) {
    if (responseData?.errors && Array.isArray(responseData.errors)) {
      message = responseData.errors.map((err: any) => err.message).join(', ')
    } else if (responseData?.error && typeof responseData.error === 'object') {
      message = Object.entries(responseData.error)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ')
    } else if (typeof responseData?.error === 'string') {
      message = responseData.error
    }
  } else {
    message = responseData?.error || responseData?.message || error.message || 'Terjadi kesalahan'
    if (message === title) message = ''
  }

  const toast = getGlobalToast()
  if (toast) {
    try {
      toast.add({
        title,
        description: message,
        icon: 'i-lucide-circle-x',
        color: 'error'
      })
    } catch (e) {
      console.error('[ErrorHelper] Toast add failed:', e)
    }
  } else {
    console.error('[ErrorHelper] Error:', title, message)
  }

  throw error // Re-throw to stop execution
}
