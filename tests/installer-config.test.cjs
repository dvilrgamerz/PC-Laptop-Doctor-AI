const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'))
test('Windows packaged application defines two independent EXE targets', () => {
  assert.equal(pkg.build.appId, 'com.dvilr.pclaptopdoctor')
  assert.equal(pkg.build.asar, true)
  assert.equal(pkg.build.nsis.oneClick, false)
  assert.equal(pkg.build.nsis.allowToChangeInstallationDirectory, true)
  assert.deepEqual(pkg.build.win.target.map(entry => entry.target), ['nsis','portable'])
  assert.ok(pkg.scripts['dist:win'].includes('electron-builder'))
})
test('branded ICO includes multiple correctly sized images', () => {
  const icon = fs.readFileSync(path.join(root,'build','icon.ico'))
  assert.equal(icon.readUInt16LE(0),0)
  assert.equal(icon.readUInt16LE(2),1)
  const count = icon.readUInt16LE(4)
  assert.ok(count>=2)
  for(let i=0;i<count;i++){
    const entry=6+i*16
    const size=icon.readUInt32LE(entry+8)
    const offset=icon.readUInt32LE(entry+12)
    assert.ok(size>40 && offset>=6+count*16)
    assert.ok(offset+size<=icon.length)
  }
})
test('app has explicit real and demo modes and release download destination', () => {
  const source = fs.readFileSync(path.join(root,'src','App.jsx'),'utf8')
  assert.ok(source.includes('releases/tag/v2.0.0'))
  assert.ok(source.includes('WEB PREVIEW'))
  assert.ok(source.includes('DiagnosticView'))
})
