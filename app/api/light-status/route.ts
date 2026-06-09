import sharp from 'sharp'
import { supabase } from '@/lib/supabase'

const BUCKET = 'plant-snapshots'
// 0–255: luzes de cultivo deixam o frame muito claro; ajuste se necessário
const BRIGHTNESS_THRESHOLD = 80

export async function GET() {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download('latest.jpg')

    if (error || !data) {
      return Response.json({ online: false, isOn: false, updatedAt: new Date().toISOString() })
    }

    const buffer = Buffer.from(await data.arrayBuffer())
    const stats = await sharp(buffer).stats()

    const [r, g, b] = stats.channels
    const brightness = Math.round(0.299 * r.mean + 0.587 * g.mean + 0.114 * b.mean)
    const isOn = brightness > BRIGHTNESS_THRESHOLD

    return Response.json({
      online: true,
      isOn,
      brightness,
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[light-status]', err instanceof Error ? err.message : err)
    return Response.json({ online: false, isOn: false, updatedAt: new Date().toISOString() })
  }
}
