import { getDeviceStatus } from '@/lib/tuya'

const DEVICE_ID = process.env.TUYA_DEVICE_ID ?? '0064762170039fd32c25'

export async function GET() {
  try {
    const status = await getDeviceStatus(DEVICE_ID)
    return Response.json({ ...status, updatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[light-status]', err instanceof Error ? err.message : err)
    return Response.json({ online: false, isOn: false, updatedAt: new Date().toISOString() })
  }
}
