'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Reading } from '@/lib/supabase'

const PERIODS = [
  { label: '1h',  hours: 1 },
  { label: '6h',  hours: 6 },
  { label: '24h', hours: 24 },
  { label: '7d',  hours: 168 },
]

export default function HumidityChart() {
  const [data, setData] = useState<Reading[]>([])
  const [hours, setHours] = useState(24)

  useEffect(() => {
    const from = new Date(Date.now() - hours * 3_600_000).toISOString()
    fetch(`/api/readings?limit=500&from=${from}`)
      .then((r) => r.json())
      .then((d: Reading[]) => setData([...d].reverse()))
  }, [hours])

  const formatted = data.map((r) => ({
    time: new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    value: r.humidity,
  }))

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4 shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Umidade do Ar</p>
          <p className="text-xs text-gray-400">%</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setHours(p.hours)}
              className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all duration-150 ${
                hours === p.hours
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {formatted.length === 0 ? (
        <div className="h-45 flex items-center justify-center text-xs text-gray-300">
          Sem dados para este período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, border: '1px solid #f3f4f6', borderRadius: 8, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
              formatter={(v) => [v != null ? `${v}%` : '—', 'Umidade']}
              labelStyle={{ color: '#9ca3af', marginBottom: 2 }}
            />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
