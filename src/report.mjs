const numberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const round = (value, digits = 1) => {
  const n = numberOrNull(value)
  return n === null ? null : Number(n.toFixed(digits))
}

const gib = (bytes) => {
  const n = numberOrNull(bytes)
  return n !== null && n >= 0 ? round(n / (1024 ** 3)) : null
}

export function compareScans(current, previous) {
  const currentTitles = new Set((current?.issues || []).map(issue => issue.title))
  const previousTitles = new Set((previous?.issues || []).map(issue => issue.title))
  return {
    delta: Math.round((current?.score ?? 0) - (previous?.score ?? 0)),
    added: [...currentTitles].filter(title => !previousTitles.has(title)),
    resolved: [...previousTitles].filter(title => !currentTitles.has(title))
  }
}

export function buildSummaryReport(data, analysis, { demo = false, previous = null } = {}) {
  if (!data || !analysis) throw new Error('A completed diagnosis is required')
  const battery = data.battery || {}
  const designed = numberOrNull(battery.designedCapacity)
  const maximum = numberOrNull(battery.maxCapacity)
  const batteryHealth = designed > 0 && maximum !== null && maximum > 0
    ? round((maximum / designed) * 100) : null
  const mainTemp = numberOrNull(data.temperature?.main)
  const fallbackTemp = numberOrNull(data.temperature?.max)
  return {
    schemaVersion: 1,
    scanAt: data.timestamp || null,
    mode: demo ? 'sample-data-demo' : 'local-desktop',
    privacy: 'Summary-only export; no IP addresses, startup app names, serial numbers or raw diagnostic data',
    health: {
      score: analysis.score,
      status: analysis.status,
      warnings: (analysis.issues || []).map(({ level, title, detail }) => ({ level, title, detail })),
      previousScore: previous?.score ?? null,
      comparison: previous ? compareScans(analysis, previous) : null
    },
    system: {
      os: data.os?.distro || data.os?.platform || null,
      cpu: data.cpu?.brand || null,
      cpuLoadPercent: round(data.cpu?.load, 0),
      memoryTotalGiB: gib(data.memory?.total),
      memoryUsedGiB: gib(data.memory?.used),
      gpu: (data.graphics || []).map(g => g.model).filter(Boolean),
      storage: (data.storage || []).map(d => ({
        capacityGiB: gib(d.size),
        freeGiB: gib(d.available),
        usedPercent: round(d.use)
      })),
      cpuTemperatureC: mainTemp ?? fallbackTemp,
      batteryHealthPercent: batteryHealth,
      networkRttMs: round(data.network?.ping)
    }
  }
}
