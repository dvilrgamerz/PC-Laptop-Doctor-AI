import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSummaryReport, compareScans } from '../src/report.mjs'

test('scan comparison reports resolved and new warnings', () => {
  const previous = { score: 65, issues: [{ title: 'Hot CPU' }] }
  const current = { score: 88, issues: [{ title: 'Low disk' }] }
  assert.deepEqual(compareScans(current, previous), {
    delta: 23, added: ['Low disk'], resolved: ['Hot CPU']
  })
})

test('export excludes sensitive raw fields and marks demo samples', () => {
  const data = {
    timestamp: '2026-11-11T11:00:00Z',
    cpu: { brand: 'Test CPU', load: 22, serial: 'SECRET' },
    os: { distro: 'Windows' },
    memory: { total: 8 * 1024 ** 3, used: 4 * 1024 ** 3 },
    graphics: [{ model: 'Example GPU' }],
    storage: [{ fs: 'C:', mount: 'C:', size: 100 * 1024 ** 3, available: 20 * 1024 ** 3, use: 80 }],
    temperature: { main: null, max: 0 },
    battery: { designedCapacity: 100, maxCapacity: 75 },
    network: { ip4: '192.168.1.33', iface: 'Wi-Fi', ping: null },
    startupApps: [{ name: 'PRIVATE STARTUP PROGRAM' }]
  }
  const result = buildSummaryReport(data, {
    score: 92, status: 'Excellent', issues: []
  }, { demo: true })
  const serialized = JSON.stringify(result)
  for (const secret of ['192.168.1.33', 'PRIVATE STARTUP PROGRAM', 'SECRET', '"iface"', '"mount"']) {
    assert.equal(serialized.includes(secret), false, secret)
  }
  assert.equal(result.mode, 'sample-data-demo')
  assert.equal(result.system.batteryHealthPercent, 75)
  assert.equal(result.system.networkRttMs, null)
  assert.equal(result.system.memoryTotalGiB, 8)
  assert.equal(result.system.cpuTemperatureC, null)
})
