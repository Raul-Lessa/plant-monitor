import type { VpdZone } from '@/lib/vpd'

const CONFIG: Record<VpdZone, { label: string; dot: string; text: string }> = {
  low:   { label: 'Baixo',  dot: 'bg-red-400',    text: 'text-red-600' },
  ideal: { label: 'Ideal',  dot: 'bg-emerald-400', text: 'text-emerald-700' },
  high:  { label: 'Alto',   dot: 'bg-amber-400',   text: 'text-amber-700' },
}

export default function StatusBadge({ zone }: { zone: VpdZone }) {
  const { label, dot, text } = CONFIG[zone]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
