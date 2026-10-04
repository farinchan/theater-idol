import crypto from 'node:crypto'

/**
 * Stream URL Obfuscation & Encryption Utility
 * Berfungsi menyembunyikan STREAM_URL asli dari browser / DevTools Network.
 * Menggunakan AES-256-GCM terotentikasi sehingga URL aman dan tidak dapat dibaca dari client.
 */

// Kunci enkripsi 256-bit diturunkan dari secret environment server
function getEncryptionKey(): Buffer {
  const secret =
    process.env.STREAM_SECRET ||
    process.env.APPWRITE_API_KEY ||
    process.env.SUMOPOD_WEBHOOK_SECRET ||
    'theater-idol-secure-stream-salt-2025-key'

  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Enkripsi URL upstream menjadi token URL-safe yang tidak dapat dibaca
 */
export function encryptStreamUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return ''

  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(12) // 96-bit IV standar AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    let encrypted = cipher.update(rawUrl, 'utf8')
    encrypted = Buffer.concat([encrypted, cipher.final()])
    const authTag = cipher.getAuthTag() // 16-byte authentication tag

    // Gabungkan IV (12) + Tag (16) + Ciphertext
    const tokenBuffer = Buffer.concat([iv, authTag, encrypted])
    return tokenBuffer.toString('base64url')
  } catch (err) {
    console.error('[StreamCrypto] Gagal mengenkripsi stream URL:', err)
    return ''
  }
}

/**
 * Dekripsi token dari request proxy kembali ke URL upstream asli
 */
export function decryptStreamUrl(token: string): string | null {
  if (!token || typeof token !== 'string') return null

  try {
    const key = getEncryptionKey()
    const rawBuffer = Buffer.from(token, 'base64url')

    // Minimal panjang: IV (12) + Tag (16) = 28 byte
    if (rawBuffer.length < 29) return null

    const iv = rawBuffer.subarray(0, 12)
    const authTag = rawBuffer.subarray(12, 28)
    const cipherText = rawBuffer.subarray(28)

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(cipherText, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted || null
  } catch {
    // Return null jika token tidak valid atau diubah oleh pihak ketiga
    return null
  }
}
