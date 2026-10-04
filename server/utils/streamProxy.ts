import type { H3Event } from 'h3'
import { getQuery, setResponseHeaders, createError } from 'h3'
import { encryptStreamUrl, decryptStreamUrl } from '~~/server/utils/streamCrypto'

function isAllowedStreamHost(hostname: string, config: any): boolean {
  const host = hostname.toLowerCase()

  // 1. Blokir loopback, cloud metadata (169.254.x.x), dan rentang IP privat
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.startsWith('127.') ||
    host.startsWith('169.254.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return false
  }

  // 2. Izinkan hostname yang dikonfigurasi pada STREAM_URL
  const configuredStreamUrl = (config?.streamUrl as string) || process.env.STREAM_URL || ''
  if (configuredStreamUrl) {
    try {
      const configuredHost = new URL(configuredStreamUrl).hostname.toLowerCase()
      if (host === configuredHost || host.endsWith('.' + configuredHost)) return true
    } catch {}
  }

  // 3. Izinkan hostname yang dikonfigurasi pada STREAM_PROXY_ORIGIN
  const configuredOrigin = (config?.streamProxyOrigin as string) || process.env.STREAM_PROXY_ORIGIN || ''
  if (configuredOrigin) {
    try {
      const originHost = new URL(configuredOrigin).hostname.toLowerCase()
      if (host === originHost || host.endsWith('.' + originHost)) return true
    } catch {}
  }

  // 4. Daftar putih domain penyedia streaming teater & video resmi/tepercaya
  const allowedPatterns = [
    /\.workers\.dev$/,
    /(^|\.)hanabira48\.com$/,
    /(^|\.)mux\.dev$/,
    /(^|\.)akamaized\.net$/,
    /(^|\.)fastly\.net$/,
    /(^|\.)cloudfront\.net$/,
    /(^|\.)cloudinary\.com$/,
    /(^|\.)appwrite\.io$/,
    /(^|\.)googlevideo\.com$/
  ]

  return allowedPatterns.some(pattern => pattern.test(host))
}

/**
 * Core Stream Proxy Handler
 * - Mendekripsi token `?s=` jika ada (potongan video/sub-playlist)
 * - Jika tidak ada parameter, menggunakan STREAM_URL rahasia dari server
 * - Menyembunyikan 100% URL upstream dari Developer Tools Network
 */
export async function handleStreamProxy(event: H3Event) {
  const query = getQuery(event)
  const config = useRuntimeConfig()

  let targetUrl = ''

  // 1. Cek token terenkripsi `s` (untuk segment chunk dan sub-playlist)
  if (query.s && typeof query.s === 'string') {
    const decrypted = decryptStreamUrl(query.s)
    if (!decrypted) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Token segmen stream tidak valid atau kedaluwarsa'
      })
    }
    targetUrl = decrypted
  } else if (query.url && typeof query.url === 'string') {
    // 2. Fallback query url jika digunakan untuk testing custom/demo stream
    targetUrl = decodeURIComponent(query.url)
  } else {
    // 3. Default: Ambil STREAM_URL dari konfigurasi rahasia server
    targetUrl = (config.streamUrl as string) || process.env.STREAM_URL || ''
  }

  if (!targetUrl) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Siaran live stream belum dikonfigurasi di server'
    })
  }

  let parsedUrl: URL
  try {
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      throw new Error('Invalid protocol')
    }
    parsedUrl = new URL(targetUrl)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL stream tidak valid'
    })
  }

  // Validasi SSRF (Server-Side Request Forgery Prevention)
  if (!isAllowedStreamHost(parsedUrl.hostname, config)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Domain upstream tidak diizinkan demi keamanan (SSRF Protection)'
    })
  }

  const upstreamOrigin = (config.streamProxyOrigin as string) || process.env.STREAM_PROXY_ORIGIN || ''
  const useProxy = config.streamUseProxy !== false && process.env.STREAM_USE_PROXY !== 'false'

  // Headers untuk upstream request (Origin & Referer jika dikonfigurasi)
  const upstreamHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*'
  }

  if (useProxy && upstreamOrigin) {
    upstreamHeaders['Origin'] = upstreamOrigin
    upstreamHeaders['Referer'] = upstreamOrigin.endsWith('/') ? upstreamOrigin : `${upstreamOrigin}/`
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: upstreamHeaders
    })

    if (!upstreamRes.ok) {
      throw createError({
        statusCode: upstreamRes.status,
        statusMessage: `Gagal mengambil stream dari sumber upstream: HTTP ${upstreamRes.status}`
      })
    }

    const contentType = upstreamRes.headers.get('content-type') || ''
    const proxyBase = '/api/stream/proxy'

    // Selalu set header CORS agar browser bebas memutar video
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    })

    const buffer = await upstreamRes.arrayBuffer()
    const textSample = new TextDecoder('utf-8').decode(buffer.slice(0, 100))
    const isM3u8 = textSample.includes('#EXTM3U')

    // Jika konten berupa playlist m3u8 (master ataupun sub-playlist)
    if (isM3u8) {
      const fullText = new TextDecoder('utf-8').decode(buffer)
      const lines = fullText.split(/\r?\n/)

      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim()
        if (!trimmed) return line

        // Enkripsi URI kunci enkripsi AES-128 jika ada: #EXT-X-KEY:METHOD=...,URI="..."
        if (trimmed.startsWith('#EXT-X-KEY:')) {
          return trimmed.replace(/URI="([^"]+)"/, (_, keyUri) => {
            let resolvedKey = keyUri
            if (!keyUri.startsWith('http://') && !keyUri.startsWith('https://')) {
              try {
                resolvedKey = new URL(keyUri, targetUrl).href
              } catch {
                return `URI="${keyUri}"`
              }
            }
            const keyToken = encryptStreamUrl(resolvedKey)
            return `URI="${proxyBase}?s=${keyToken}"`
          })
        }

        // Jangan ubah baris komentar / metadata lainnya
        if (trimmed.startsWith('#')) {
          return line
        }

        // Resolusikan URL relatif menjadi absolut terhadap URL playlist induk
        let resolvedUrl = trimmed
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          try {
            resolvedUrl = new URL(trimmed, targetUrl).href
          } catch {
            return line
          }
        }

        // Enkripsi URL segmen menjadi token terenkripsi aman
        // Di DevTools Network hanya terlihat: /api/stream/proxy?s=BGmRyIVd...
        const token = encryptStreamUrl(resolvedUrl)
        return `${proxyBase}?s=${token}`
      })

      const rewrittenM3u8 = rewrittenLines.join('\n')

      setResponseHeaders(event, {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': Buffer.byteLength(rewrittenM3u8, 'utf-8').toString()
      })

      return rewrittenM3u8
    }

    // Jika berupa file binary (chunk video .ts, fMP4 .m4s, audio .aac)
    let outContentType = contentType
    const isTsSyncByte = buffer.byteLength > 0 && new Uint8Array(buffer)[0] === 0x47
    if (isTsSyncByte || targetUrl.includes('.ts') || targetUrl.includes('/segment/')) {
      outContentType = 'video/mp2t'
    } else if (targetUrl.includes('.m4s')) {
      outContentType = 'video/iso.segment'
    } else if (targetUrl.includes('.aac')) {
      outContentType = 'audio/aac'
    }

    setResponseHeaders(event, {
      'Content-Type': outContentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=60',
      'Content-Length': buffer.byteLength.toString()
    })

    return Buffer.from(buffer)
  } catch (err: any) {
    console.error('[StreamProxy] Error fetching upstream stream:', err?.message)
    throw createError({
      statusCode: err?.statusCode || 502,
      statusMessage: err?.statusMessage || err?.message || 'Bad Gateway: Gagal mengambil siaran live stream.'
    })
  }
}
