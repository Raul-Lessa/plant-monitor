'use client'

import { useEffect, useState } from 'react'

type Photo = {
  url: string
  capturedAt: string | null
}

export default function PlantCamera() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () =>
      fetch('/api/snapshot')
        .then(r => r.json())
        .then(d => { setPhotos(d.photos ?? []); setSelected(0) })
        .finally(() => setLoading(false))

    load()
    const id = setInterval(load, 5 * 60_000)
    return () => clearInterval(id)
  }, [])

  const main = photos[selected]

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4 shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Câmera</p>
        {main?.capturedAt && (
          <span className="text-[11px] text-gray-300">
            {new Date(main.capturedAt).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {/* Imagem principal */}
        <div className="flex-1 rounded-lg overflow-hidden bg-gray-50 aspect-4/3">
          {loading ? (
            <div className="w-full h-full animate-pulse bg-gray-100" />
          ) : main ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={main.url} alt="Foto da planta" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <CameraIcon />
              <span className="text-xs text-gray-300">Aguardando primeira foto…</span>
            </div>
          )}
        </div>

        {/* Miniaturas */}
        {photos.length > 1 && (
          <div className="flex flex-col gap-2 w-20">
            {photos.map((p, i) => (
              <button
                type="button"
                key={p.capturedAt ?? i}
                onClick={() => setSelected(i)}
                className={`rounded-md overflow-hidden border-2 transition-colors ${
                  i === selected ? 'border-emerald-400' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                style={{ aspectRatio: '4/3' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
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
