export type PlantPhase = 'seedling' | 'vegetative' | 'flowering'
export type VpdZone = 'low' | 'ideal' | 'high'

const PHASE_RANGES: Record<PlantPhase, { min: number; max: number }> = {
  seedling:   { min: 0.4, max: 0.8 },
  vegetative: { min: 0.8, max: 1.2 },
  flowering:  { min: 1.2, max: 1.6 },
}

export function calculateVpd(temperature: number, humidity: number): number {
  const svp = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3))
  return svp * (1 - humidity / 100)
}

export function getVpdZone(vpd: number, phase: PlantPhase): VpdZone {
  const { min, max } = PHASE_RANGES[phase]
  if (vpd < min) return 'low'
  if (vpd > max) return 'high'
  return 'ideal'
}

export function getPhaseRange(phase: PlantPhase) {
  return PHASE_RANGES[phase]
}
