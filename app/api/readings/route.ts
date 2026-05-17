import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateVpd } from '@/lib/vpd'

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.API_SECRET_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { temperature, humidity, soil } = body as Record<string, unknown>

  if (
    typeof temperature !== 'number' ||
    typeof humidity !== 'number' ||
    typeof soil !== 'number' ||
    temperature < -40 || temperature > 80 ||
    humidity < 0 || humidity > 100 ||
    soil < 0 || soil > 100
  ) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const vpd = parseFloat(calculateVpd(temperature, humidity).toFixed(4))

  const { error } = await supabase
    .from('readings')
    .insert({ temperature, humidity, soil, vpd })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, vpd })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)
  const from = searchParams.get('from')

  let query = supabase
    .from('readings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (from) {
    query = query.gte('created_at', from)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
