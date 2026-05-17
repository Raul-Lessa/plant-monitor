'use client'

import { useEffect, useState } from 'react'
import { calculateVpd } from '@/lib/vpd'
import type { Reading } from '@/lib/supabase'

const TEMPS      = Array.from({ length: 21 }, (_, i) => i + 15)       // 15–35°C
const HUMIDITIES = Array.from({ length: 12 }, (_, i) => 35 + i * 5)   // 35–90%

function getCellClass(vpd: number): string {
  if (vpd < 0.4)  return 'bg-slate-50 text-slate-400'
  if (vpd < 0.6)  return 'bg-red-100 text-red-700'
  if (vpd < 0.8)  return 'bg-red-200 text-red-900'
  if (vpd < 1.0)  return 'bg-green-200 text-green-900'
  if (vpd < 1.2)  return 'bg-green-300 text-green-900'
  if (vpd < 1.4)  return 'bg-orange-200 text-orange-900'
  if (vpd < 1.6)  return 'bg-orange-300 text-orange-900'
  if (vpd < 2.0)  return 'bg-red-400 text-white'
  return 'bg-red-700 text-white'
}

function snapHumidity(h: number) {
  return Math.max(35, Math.min(90, Math.round(h / 5) * 5))
}
function snapTemp(t: number) {
  return Math.max(15, Math.min(35, Math.round(t)))
}

export default function VpdTable() {
  const [latest, setLatest] = useState<Reading | null>(null)

  useEffect(() => {
    fetch('/api/readings?limit=1')
      .then((r) => r.json())
      .then((d: Reading[]) => setLatest(d[0] ?? null))

    const id = setInterval(() => {
      fetch('/api/readings?limit=1')
        .then((r) => r.json())
        .then((d: Reading[]) => setLatest(d[0] ?? null))
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const activeTemp = latest ? snapTemp(latest.temperature) : null
  const activeHum  = latest ? snapHumidity(latest.humidity) : null

  return (
    <div className="bg-white rounded-2xl shadow p-4 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Tabela VPD</h2>
          <p className="text-xs text-gray-400">Temperatura × Umidade relativa do ar</p>
        </div>
        {latest && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            Leitura atual: {latest.temperature}°C · {latest.humidity}%
          </span>
        )}
      </div>

      <div className="overflow-auto rounded-lg border border-gray-200 max-h-[520px]">
        <table className="border-collapse text-xs w-full">
          {/* Header — umidades */}
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 bg-gray-900 text-gray-300 px-3 py-2 text-center font-medium whitespace-nowrap text-[11px]">
                °C / %
              </th>
              {HUMIDITIES.map((h) => (
                <th
                  key={h}
                  className={`px-3 py-2 text-center font-semibold text-[11px] min-w-[3.5rem] transition-colors ${
                    activeHum === h
                      ? 'bg-white text-gray-900 underline underline-offset-2'
                      : 'bg-gray-900 text-gray-300'
                  }`}
                >
                  {h}%
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {TEMPS.map((t) => (
              <tr key={t} className="group">
                {/* Coluna temperatura — sticky */}
                <td
                  className={`sticky left-0 z-10 px-3 py-1 text-center font-semibold text-[11px] whitespace-nowrap transition-colors ${
                    activeTemp === t
                      ? 'bg-white text-gray-900 underline underline-offset-2'
                      : 'bg-gray-900 text-gray-300'
                  }`}
                >
                  {t}°C
                </td>

                {/* Células VPD */}
                {HUMIDITIES.map((h) => {
                  const vpd = parseFloat(calculateVpd(t, h).toFixed(2))
                  const isActive = activeTemp === t && activeHum === h

                  return (
                    <td
                      key={h}
                      title={`${t}°C · ${h}% → VPD ${vpd} kPa`}
                      className={[
                        'px-2 py-1 text-center tabular-nums font-medium transition-all',
                        getCellClass(vpd),
                        isActive
                          ? 'outline outline-2 outline-offset-[-2px] outline-gray-900 font-bold scale-[0.96] shadow-inner z-10 relative'
                          : 'group-hover:brightness-95',
                      ].join(' ')}
                    >
                      {vpd.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-300" />
          Muda / Início Veg. <span className="text-gray-400">(0.4–0.8 kPa)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-300 border border-green-400" />
          Final Veg. / Início Flor. <span className="text-gray-400">(0.8–1.2 kPa)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-300 border border-orange-400" />
          Meio / Final Floração <span className="text-gray-400">(1.2–1.6 kPa)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-600 border border-red-700" />
          Perigo <span className="text-gray-400">(&gt;1.6 kPa)</span>
        </div>
      </div>
    </div>
  )
}
