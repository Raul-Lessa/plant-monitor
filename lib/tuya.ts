import { createHmac, createHash } from 'crypto'

const REGION_URLS: Record<string, string> = {
  us: 'https://openapi.tuyaus.com',
  eu: 'https://openapi.tuyaeu.com',
  cn: 'https://openapi.tuyacn.com',
  in: 'https://openapi.tuyain.com',
}

const BASE_URL = REGION_URLS[process.env.TUYA_REGION ?? 'us'] ?? REGION_URLS.us
const CLIENT_ID = process.env.TUYA_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET ?? ''

let tokenCache: { value: string; expiresAt: number } | null = null

function hmacSign(str: string): string {
  return createHmac('sha256', CLIENT_SECRET).update(str).digest('hex').toUpperCase()
}

function sha256Hex(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function stringToSign(method: string, body: string, url: string): string {
  return `${method}\n${sha256Hex(body)}\n\n${url}`
}

function buildHeaders(url: string, accessToken = ''): Record<string, string> {
  const t = Date.now().toString()
  const nonce = Date.now().toString(36) + Math.random().toString(36).slice(2)
  const sts = stringToSign('GET', '', url)
  const sign = hmacSign(CLIENT_ID + accessToken + t + nonce + sts)

  const headers: Record<string, string> = {
    client_id: CLIENT_ID,
    sign,
    t,
    nonce,
    sign_method: 'HMAC-SHA256',
  }
  if (accessToken) headers.access_token = accessToken
  return headers
}

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value

  const url = '/v1.0/token?grant_type=1'
  const res = await fetch(BASE_URL + url, { headers: buildHeaders(url) })
  const json = await res.json()

  if (!json.success) throw new Error(`Tuya auth: ${json.msg ?? json.code}`)

  const { access_token, expire_time } = json.result as { access_token: string; expire_time: number }
  tokenCache = { value: access_token, expiresAt: Date.now() + (expire_time - 60) * 1000 }
  return access_token
}

export async function getDeviceStatus(deviceId: string): Promise<{ online: boolean; isOn: boolean }> {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('Tuya credentials not configured')

  const token = await getToken()
  const url = `/v1.0/devices/${deviceId}/status`
  const res = await fetch(BASE_URL + url, { headers: buildHeaders(url, token) })
  const json = await res.json()

  if (!json.success) throw new Error(`Tuya device: ${json.msg ?? json.code}`)

  const statuses = json.result as Array<{ code: string; value: unknown }>
  const sw = statuses.find((s) => s.code === 'switch' || s.code === 'switch_1')
  return { online: true, isOn: Boolean(sw?.value) }
}
