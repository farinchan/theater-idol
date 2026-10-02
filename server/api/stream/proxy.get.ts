export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawUrl = (query.url as string) || 'https://jkt48.thecmonofficial.workers.dev/playback'

  if (!rawUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter URL wajib disertakan'
    })
  }

  let targetUrl: string
  try {
    targetUrl = decodeURIComponent(rawUrl)
    // Validate protocol
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      throw new Error('Invalid protocol')
    }
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL tidak valid'
    })
  }

  // Spoof headers required by anti-hotlinking / origin-locked workers
  const upstreamHeaders: Record<string, string> = {
    'Origin': 'https://stream.hanabira48.com',
    'Referer': 'https://stream.hanabira48.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*'
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: upstreamHeaders
    })

    if (!upstreamRes.ok) {
      throw createError({
        statusCode: upstreamRes.status,
        statusMessage: `Gagal mengambil stream dari sumber: HTTP ${upstreamRes.status}`
      })
    }

    const contentType = upstreamRes.headers.get('content-type') || ''
    const reqUrl = getRequestURL(event)
    const proxyBase = `${reqUrl.protocol}//${reqUrl.host}/api/stream/proxy`

    // Selalu set header CORS agar browser bebas mengakses stream
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    })

    // Cek apakah konten berupa playlist m3u8
    // Sumber workers.dev terkadang mengembalikan content-type application/javascript atau text/html
    const buffer = await upstreamRes.arrayBuffer()
    const textSample = new TextDecoder('utf-8').decode(buffer.slice(0, 100))
    const isM3u8 = textSample.includes('#EXTM3U')

    if (isM3u8) {
      const fullText = new TextDecoder('utf-8').decode(buffer)
      
      // Rewrite setiap URL sub-playlist atau segment di dalam m3u8 agar melewati proxy kita
      const lines = fullText.split(/\r?\n/)
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) {
          return line
        }

        // Resolusikan URL absolut jika relatif
        let resolvedUrl = trimmed
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          try {
            resolvedUrl = new URL(trimmed, targetUrl).href
          } catch {
            return line
          }
        }

        // Bungkus ke proxy
        return `${proxyBase}?url=${encodeURIComponent(resolvedUrl)}`
      })

      const rewrittenM3u8 = rewrittenLines.join('\n')

      setResponseHeaders(event, {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': Buffer.byteLength(rewrittenM3u8, 'utf-8').toString()
      })

      return rewrittenM3u8
    }

    // Jika bukan playlist m3u8 (misalnya file chunk video .ts / audio), kirim buffer langsung
    let outContentType = contentType
    if (targetUrl.includes('.ts') || targetUrl.includes('/segment/')) {
      outContentType = 'video/mp2t'
    } else if (targetUrl.includes('.m4s')) {
      outContentType = 'video/iso.segment'
    }

    setResponseHeaders(event, {
      'Content-Type': outContentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=60',
      'Content-Length': buffer.byteLength.toString()
    })

    return Buffer.from(buffer)
  } catch (err: any) {
    console.error('[StreamProxy] Error fetching upstream:', err?.message)
    throw createError({
      statusCode: err?.statusCode || 502,
      statusMessage: err?.statusMessage || err?.message || 'Bad Gateway: Gagal mengambil siaran live stream.'
    })
  }
})
