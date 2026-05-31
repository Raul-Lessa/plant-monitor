import VpdGauge from '@/components/VpdGauge'
import VpdTable from '@/components/VpdTable'
import TemperatureChart from '@/components/TemperatureChart'
import HumidityChart from '@/components/HumidityChart'
import SoilChart from '@/components/SoilChart'
import LightCard from '@/components/LightCard'
import PlantCamera from '@/components/PlantCamera'

export const dynamic = 'force-dynamic'

function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-dvh flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <LeafIcon />
            <span className="text-sm font-semibold text-gray-900 tracking-tight">Plant Monitor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400">Ao vivo</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-10 py-8 flex flex-col gap-5">

        {/* KPI row — gauge + table side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          <VpdGauge />
          <VpdTable />
        </div>

        {/* Charts + light status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <TemperatureChart />
          <HumidityChart />
          <LightCard />
        </div>

        <SoilChart />

        <PlantCamera />

        <p className="text-center text-[11px] text-gray-300 pb-2">
          Plant Monitor · atualiza a cada 30s
        </p>
      </main>
    </div>
  )
}
