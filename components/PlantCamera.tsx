'use client'

import { useEffect, useState } from 'react'

type Snapshot = {
  url: string | null
  capturedAt: string | null
}

export default function PlantCamera() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/snapshot')
      .then((r) => r.json())
      .then((d: Snapshot) => setSnap(d))
      .finally(() => setLoading(false))

    const id = setInterval(() => {
      fetch('/api/snapshot')
        .then((r) => r.json())
        .then((d: Snapshot) => setSnap(d))
    }, 5 * 60_000)

    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4 shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Câmera</p>
        {snap?.capturedAt && (
          <span className="text-[11px] text-gray-300">
            {new Date(snap.capturedAt).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        )}
      </div>

      <div className="rounded-lg overflow-hidden bg-gray-50" style={{ aspectRatio: '4/3' }}>
        {loading ? (
          <div className="w-full h-full animate-pulse bg-gray-100" />
        ) : snap?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={snap.url}
            alt="Foto da planta"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <CameraIcon />
            <span className="text-xs text-gray-300">Aguardando primeira foto…</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}
