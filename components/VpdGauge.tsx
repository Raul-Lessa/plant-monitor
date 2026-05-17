'use client'

import { useEffect, useState } from 'react'
import { calculateVpd, getVpdZone, getPhaseRange, type PlantPhase, type VpdZone } from '@/lib/vpd'
import StatusBadge from './StatusBadge'
import type { Reading } from '@/lib/supabase'

const PHASES: { value: PlantPhase; label: string }[] = [
  { value: 'seedling',   label: 'Muda' },
  { value: 'vegetative', label: 'Vegetativo' },
  { value: 'flowering',  label: 'Floração' },
]

const ZONE_TEXT: Record<VpdZone, string> = {
  low:   'text-red-500',
  ideal: 'text-emerald-600',
  high:  'text-amber-500',
}

const METRICS = [
  { key: 'temperature' as const, label: 'Temperatura', unit: '°C', color: 'text-amber-600' },
  { key: 'humidity'    as const, label: 'Umidade ar',  unit: '%',  color: 'text-indigo-500' },
  { key: 'soil'        as const, label: 'Solo',        unit: '%',  color: 'text-emerald-600' },
]

const SEGMENTS = [
  { bg: 'bg-slate-100', activeBg: 'bg-slate-300' },
  { bg: 'bg-red-200',   activeBg: 'bg-red-400'   },
  { bg: 'bg-emerald-200', activeBg: 'bg-emerald-500' },
  { bg: 'bg-amber-200', activeBg: 'bg-amber-400' },
  { bg: 'bg-red-300',   activeBg: 'bg-red-600'   },
]

function getActiveSegment(v: number | null): number {
  if (v === null) return -1
  if (v < 0.4) return 0
  if (v < 0.8) return 1
  if (v < 1.2) return 2
  if (v < 1.6) return 3
  return 4
}

export default function VpdGauge() {
  const [phase, setPhase] = useState<PlantPhase>('vegetative')
  const [latest, setLatest] = useState<Reading | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchLatest() {
    try {
      const res = await fetch('/api/readings?limit=1')
      if (!res.ok) return
      const data: Reading[] = await res.json()
      setLatest(data[0] ?? null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLatest()
    const id = setInterval(fetchLatest, 30_000)
    return () => clearInterval(id)
  }, [])

  const vpd   = latest ? parseFloat(calculateVpd(latest.temperature, latest.humidity).toFixed(2)) : null
  const zone: VpdZone  = vpd !== null ? getVpdZone(vpd, phase) : 'ideal'
  const range = getPhaseRange(phase)
  const activeSeg = getActiveSegment(vpd)

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col gap-6 shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">

      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">VPD Atual</span>
        {vpd !== null && <StatusBadge zone={zone} />}
      </div>

      {/* Big number */}
      <div className="flex flex-col items-center gap-1">
        <div className={`text-7xl font-bold tabular leading-none ${vpd !== null ? ZONE_TEXT[zone] : 'text-gray-200'}`}>
          {loading ? '—' : vpd !== null ? vpd.toFixed(2) : '—'}
        </div>
        <span className="text-sm font-medium text-gray-400">kPa</span>
      </div>

      {/* Zone bar — segmented, active segment highlighted */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
          {SEGMENTS.map((seg, i) => (
            <div
              key={i}
              className={`flex-1 transition-colors duration-300 ${activeSeg === i ? seg.activeBg : seg.bg}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 tabular">
          <span>0</span>
          <span>0.4</span>
          <span>0.8</span>
          <span>1.2</span>
          <span>1.6</span>
          <span>2.0</span>
        </div>
        <p className="text-[11px] text-center text-gray-400">
          Faixa ideal: <span className="text-gray-600 font-medium">{range.min} – {range.max} kPa</span>
        </p>
      </div>

      {/* Sensor metrics */}
      {latest && (
        <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
          {METRICS.map(({ key, label, unit, color }) => (
            <div key={key} className="flex flex-col items-center py-3 gap-0.5">
              <span className={`text-lg font-semibold tabular ${color}`}>
                {latest[key]}{unit}
              </span>
              <span className="text-[11px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Phase selector */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Fase</span>
        <div className="flex gap-1.5">
          {PHASES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPhase(p.value)}
              className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-all duration-150 ${
                phase === p.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-gray-300 text-right -mt-2">
        {latest
          ? `Última leitura · ${new Date(latest.created_at).toLocaleTimeString('pt-BR')}`
          : 'Aguardando leitura…'}
      </p>
    </div>
  )
}
