import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const BUCKET = 'plant-snapshots'

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.API_SECRET_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const buffer = Buffer.from(await request.arrayBuffer())
  if (buffer.length === 0) {
    return Response.json({ error: 'Empty body' }, { status: 400 })
  }

  const now = new Date()
  const path = `${now.toISOString().replace(/[:.]/g, '-')}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/jpeg' })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  await supabase.storage
    .from(BUCKET)
    .upload('latest.jpg', buffer, { contentType: 'image/jpeg', upsert: true })

  await supabase.from('snapshots').insert({ path })

  const { data } = supabase.storage.from(BUCKET).getPublicUrl('latest.jpg')
  return Response.json({ url: data.publicUrl, capturedAt: now.toISOString() })
}

export async function GET() {
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 20, sortBy: { column: 'name', order: 'desc' } })

  const photos = (files ?? [])
    .filter(f => f.name !== 'latest.jpg')
    .slice(0, 3)
    .map(f => ({
      url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
      capturedAt: f.updated_at ?? f.created_at,
    }))

  return Response.json({ photos })
}
