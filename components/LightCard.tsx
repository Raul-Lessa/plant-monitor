'use client'

import { useEffect, useState } from 'react'

type LightStatus = {
  online: boolean
  isOn: boolean
  updatedAt: string
}

function BulbIcon({ on }: { on: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      {on && <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />}
    </svg>
  )
}

export default function LightCard() {
  const [status, setStatus] = useState<LightStatus | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchStatus() {
    try {
      const res = await fetch('/api/light-status')
      if (!res.ok) return
      const data: LightStatus = await res.json()
      setStatus(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 30_000)
    return () => clearInterval(id)
  }, [])

  const isOn = status?.isOn ?? false
  const isOffline = !loading && status !== null && !status.online

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4 shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Luz de Cultivo</p>
        {isOffline && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            Offline
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
          loading ? 'bg-gray-100 text-gray-300'
            : isOn ? 'bg-emerald-100 text-emerald-600'
            : 'bg-gray-100 text-gray-400'
        }`}>
          <BulbIcon on={isOn} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className={`text-2xl font-bold tabular transition-colors duration-300 ${
            loading ? 'text-gray-200'
              : isOn ? 'text-emerald-600'
              : 'text-gray-400'
          }`}>
            {loading ? '—' : isOn ? 'Ligada' : 'Desligada'}
          </span>
          {status?.updatedAt && (
            <span className="text-[11px] text-gray-300">
              {new Date(status.updatedAt).toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
