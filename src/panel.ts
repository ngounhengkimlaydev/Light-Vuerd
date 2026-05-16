import * as vscode from 'vscode'
import * as fs from 'fs'

export function openPanel(uri: vscode.Uri) {
  const panel = vscode.window.createWebviewPanel(
    'lightVuerd',
    'Light Vuerd ERD',
    vscode.ViewColumn.One,
    { enableScripts: true }
  )

  const raw = fs.readFileSync(uri.fsPath, 'utf8')
  panel.webview.html = getHtml(raw)
}

function getHtml(rawJson: string) {
  const safeJson = JSON.stringify(rawJson)

  return `
<!DOCTYPE html>
<html>
<head>
<style>
body {
  margin: 0;
  background: #0f172a;
  color: white;
  font-family: Arial, sans-serif;
  overflow: hidden;
}

.toolbar {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  background: #020617;
  border-bottom: 1px solid #1e293b;
  font-size: 13px;
}

button {
  background: #1e293b;
  color: white;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}

#wrap {
  width: 100vw;
  height: calc(100vh - 45px);
  overflow: hidden;
  cursor: grab;
}

#canvas {
  width: 100%;
  height: 100%;
}

.table-group {
  cursor: move;
}

.table-box {
  fill: #1e293b;
  stroke: #38bdf8;
  stroke-width: 1.5;
}

.table-head {
  fill: #020617;
}

.title {
  fill: white;
  font-size: 14px;
  font-weight: bold;
}

.field {
  fill: #cbd5e1;
  font-size: 12px;
}

.type {
  fill: #7dd3fc;
  font-size: 12px;
}

.relation {
  stroke: #94a3b8;
  stroke-width: 1.7;
  stroke-dasharray: 8 7;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  fill: none;
}

.relation-marker {
  stroke: #e2e8f0;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  fill: none;
}

.relation-ring {
  fill: #0f172a;
}
</style>
</head>

<body>
  <div class="toolbar">
    <strong>Light Vuerd</strong>
    <span>Tables: <b id="count">0</b></span>
    <span>Zoom: <b id="zoomText">100%</b></span>
    <button onclick="zoomIn()">+</button>
    <button onclick="zoomOut()">-</button>
    <button onclick="resetView()">Reset</button>
    <span>Wheel = zoom, middle mouse / space drag = pan, drag table = move</span>
  </div>

  <div id="wrap">
    <svg id="canvas">
      <g id="viewport">
        <g id="relations"></g>
        <g id="tables"></g>
      </g>
    </svg>
  </div>

<script>
const raw = ${safeJson}
const data = JSON.parse(raw)

const svg = document.getElementById('canvas')
const viewport = document.getElementById('viewport')
const relationsLayer = document.getElementById('relations')
const tablesLayer = document.getElementById('tables')
const count = document.getElementById('count')
const zoomText = document.getElementById('zoomText')

const collections = data.collections || {}

const tableEntities = collections.tableEntities || {}
const columnEntities =
  collections.columnEntities ||
  collections.tableColumnEntities ||
  collections.columns ||
  {}

const relationshipEntities =
  collections.relationshipEntities ||
  collections.relationships ||
  {}

const tables = Object.values(tableEntities)
count.textContent = tables.length

let scale = 1
let panX = 200
let panY = 80
let spaceDown = false
let isPanning = false
let dragTable = null
let startMouse = { x: 0, y: 0 }
let startPan = { x: 0, y: 0 }
let tablePositions = {}

function updateTransform() {
  viewport.setAttribute('transform', 'translate(' + panX + ',' + panY + ') scale(' + scale + ')')
  zoomText.textContent = Math.round(scale * 100) + '%'
}

function screenToWorld(clientX, clientY) {
  const rect = svg.getBoundingClientRect()
  return {
    x: (clientX - rect.left - panX) / scale,
    y: (clientY - rect.top - panY) / scale
  }
}

function zoomAt(clientX, clientY, factor) {
  const before = screenToWorld(clientX, clientY)

  scale *= factor
  scale = Math.max(0.15, Math.min(scale, 3))

  const rect = svg.getBoundingClientRect()
  panX = clientX - rect.left - before.x * scale
  panY = clientY - rect.top - before.y * scale

  updateTransform()
}

function zoomIn() {
  zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.15)
}

function zoomOut() {
  zoomAt(window.innerWidth / 2, window.innerHeight / 2, 0.85)
}

function resetView() {
  scale = 1
  panX = 200
  panY = 80
  updateTransform()
}

window.zoomIn = zoomIn
window.zoomOut = zoomOut
window.resetView = resetView

svg.addEventListener('wheel', (e) => {
  e.preventDefault()
  zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 0.88)
}, { passive: false })

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    spaceDown = true
    e.preventDefault()
  }
})

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    spaceDown = false
  }
})

svg.addEventListener('mousedown', (e) => {
  const tableGroup = e.target.closest?.('.table-group')

  if (tableGroup && !spaceDown && e.button === 0) {
    dragTable = tableGroup
    const id = tableGroup.dataset.id
    const world = screenToWorld(e.clientX, e.clientY)
    startMouse = world
    startPan = {
      x: tablePositions[id].x,
      y: tablePositions[id].y
    }
    return
  }

  if (e.button === 1 || spaceDown) {
    isPanning = true
    startMouse = { x: e.clientX, y: e.clientY }
    startPan = { x: panX, y: panY }
    e.preventDefault()
  }
})

window.addEventListener('mousemove', (e) => {
  if (dragTable) {
    const id = dragTable.dataset.id
    const world = screenToWorld(e.clientX, e.clientY)

    const dx = world.x - startMouse.x
    const dy = world.y - startMouse.y

    tablePositions[id].x = startPan.x + dx
    tablePositions[id].y = startPan.y + dy

    dragTable.setAttribute(
      'transform',
      'translate(' + tablePositions[id].x + ',' + tablePositions[id].y + ')'
    )

    renderRelations()
    return
  }

  if (isPanning) {
    panX = startPan.x + (e.clientX - startMouse.x)
    panY = startPan.y + (e.clientY - startMouse.y)
    updateTransform()
  }
})

window.addEventListener('mouseup', () => {
  isPanning = false
  dragTable = null
})

svg.addEventListener('auxclick', (e) => e.preventDefault())

function getColumns(table) {
  const ids = table.seqColumnIds || table.columnIds || []
  return ids.map(id => columnEntities[id]).filter(Boolean)
}

function getColumnName(column) {
  return column.name || column.columnName || column.fieldName || 'field'
}

function getColumnType(column) {
  return column.dataType || column.type || column.data_type || ''
}

function createText(x, y, className, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  el.setAttribute('x', x)
  el.setAttribute('y', y)
  el.setAttribute('class', className)
  el.textContent = text
  return el
}

function renderTables() {
  tablesLayer.innerHTML = ''

  tables.forEach((table, index) => {
    const id = table.id || Object.keys(tableEntities)[index]

    const x = table.ui?.x ?? table.x ?? 40 + (index % 5) * 330
    const y = table.ui?.y ?? table.y ?? 70 + Math.floor(index / 5) * 320

    const columns = getColumns(table)
    const width = 310
    const height = 52 + columns.length * 22

    tablePositions[id] = { x, y, width, height, table }

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.setAttribute('class', 'table-group')
    group.setAttribute('data-id', id)
    group.setAttribute('transform', 'translate(' + x + ',' + y + ')')

    const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    box.setAttribute('width', width)
    box.setAttribute('height', height)
    box.setAttribute('rx', 10)
    box.setAttribute('class', 'table-box')
    group.appendChild(box)

    const head = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    head.setAttribute('width', width)
    head.setAttribute('height', 38)
    head.setAttribute('rx', 10)
    head.setAttribute('class', 'table-head')
    group.appendChild(head)

    group.appendChild(createText(14, 24, 'title', table.name || 'unknown_table'))

    columns.forEach((column, i) => {
      const cy = 62 + i * 21
      group.appendChild(createText(14, cy, 'field', getColumnName(column)))
      group.appendChild(createText(180, cy, 'type', getColumnType(column)))
    })

    tablesLayer.appendChild(group)
  })
}

function findTableByColumnId(columnId) {
  for (const [tableId, table] of Object.entries(tableEntities)) {
    const ids = table.seqColumnIds || table.columnIds || []
    if (ids.includes(columnId)) return tableId
  }

  return null
}

function getRelationEndpoints(rel) {
  const startTableId =
    rel.start?.tableId ||
    rel.startTableId ||
    rel.parentTableId ||
    rel.sourceTableId ||
    rel.fromTableId ||
    findTableByColumnId(rel.start?.columnId || rel.parentColumnId || rel.sourceColumnId || rel.fromColumnId)

  const endTableId =
    rel.end?.tableId ||
    rel.endTableId ||
    rel.childTableId ||
    rel.targetTableId ||
    rel.toTableId ||
    findTableByColumnId(rel.end?.columnId || rel.childColumnId || rel.targetColumnId || rel.toColumnId)

  return { startTableId, endTableId }
}

function asNumber(value) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function getDirectionName(direction) {
  if (typeof direction === 'string') {
    const normalized = direction.toLowerCase()
    if (normalized === 'left' || normalized === 'right' || normalized === 'top' || normalized === 'bottom') {
      return normalized
    }
  }

  const value = asNumber(direction)
  if (value === null) return null
  if ((value & 1) === 1) return 'left'
  if ((value & 2) === 2) return 'right'
  if ((value & 4) === 4) return 'top'
  if ((value & 8) === 8) return 'bottom'
  return null
}

function getDirectionVector(direction) {
  if (direction === 'left') return { x: -1, y: 0 }
  if (direction === 'right') return { x: 1, y: 0 }
  if (direction === 'top') return { x: 0, y: -1 }
  return { x: 0, y: 1 }
}

function getFallbackDirections(from, to) {
  const fromCenter = {
    x: from.x + from.width / 2,
    y: from.y + from.height / 2
  }
  const toCenter = {
    x: to.x + to.width / 2,
    y: to.y + to.height / 2
  }
  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { start: 'right', end: 'left' }
      : { start: 'left', end: 'right' }
  }

  return dy >= 0
    ? { start: 'bottom', end: 'top' }
    : { start: 'top', end: 'bottom' }
}

function getOriginalTablePosition(position) {
  return {
    x: position.table.ui?.x ?? position.table.x ?? position.x,
    y: position.table.ui?.y ?? position.table.y ?? position.y
  }
}

function getAnchor(position, relationshipPoint, fallbackDirection) {
  const direction = getDirectionName(relationshipPoint?.direction) || fallbackDirection
  const vector = getDirectionVector(direction)
  const origin = getOriginalTablePosition(position)
  const pointX = asNumber(relationshipPoint?.x)
  const pointY = asNumber(relationshipPoint?.y)

  let x = position.x + position.width / 2
  let y = position.y + position.height / 2

  if (direction === 'left' || direction === 'right') {
    x = direction === 'left' ? position.x : position.x + position.width

    if (pointY !== null) {
      y = position.y + clamp(pointY - origin.y, 20, position.height - 16)
    }
  } else {
    y = direction === 'top' ? position.y : position.y + position.height

    if (pointX !== null) {
      x = position.x + clamp(pointX - origin.x, 20, position.width - 20)
    }
  }

  return { x, y, direction, vector }
}

function addVector(point, distance) {
  return {
    x: point.x + point.vector.x * distance,
    y: point.y + point.vector.y * distance
  }
}

function getRelationshipCardinality(value) {
  const numericValue = asNumber(value)
  if (numericValue === 2) return { optional: true, many: false, label: '0..1' }
  if (numericValue === 4) return { optional: true, many: true, label: '0..N' }
  if (numericValue === 8) return { optional: false, many: false, label: '1..1' }
  if (numericValue === 16) return { optional: false, many: true, label: '1..N' }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().replace(/[^a-z0-9*]+/g, '')
    if (normalized === 'zeroone' || normalized === 'zerotoone' || normalized === '01') {
      return { optional: true, many: false, label: '0..1' }
    }
    if (normalized === 'zeron' || normalized === 'zeromany' || normalized === 'zerotomany' || normalized === '0n' || normalized === '0*') {
      return { optional: true, many: true, label: '0..N' }
    }
    if (normalized === 'oneonly' || normalized === 'oneone' || normalized === 'onetoone' || normalized === '11') {
      return { optional: false, many: false, label: '1..1' }
    }
    if (normalized === 'onen' || normalized === 'onemany' || normalized === 'onetomany' || normalized === '1n' || normalized === '1*') {
      return { optional: false, many: true, label: '1..N' }
    }
  }

  return { optional: false, many: true, label: '1..N' }
}

function getStartCardinality(value) {
  const numericValue = asNumber(value)
  if (numericValue === 1) return { optional: true, many: false, label: '0..1' }
  if (numericValue === 2) return { optional: false, many: false, label: '1..1' }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase()
    if (normalized === 'ring' || normalized.includes('zero') || normalized.includes('optional')) {
      return { optional: true, many: false, label: '0..1' }
    }
  }

  return { optional: false, many: false, label: '1..1' }
}

function getRelationCardinalities(rel) {
  const relationshipText = typeof rel.relationshipType === 'string'
    ? rel.relationshipType.toLowerCase().replace(/[^a-z0-9*]+/g, '')
    : ''

  if (relationshipText === 'manytomany' || relationshipText === 'nn' || relationshipText === '**') {
    return {
      start: { optional: false, many: true, label: '1..N' },
      end: { optional: false, many: true, label: '1..N' }
    }
  }

  if (relationshipText === 'onetomany' || relationshipText === '1n' || relationshipText === '1*') {
    return {
      start: { optional: false, many: false, label: '1..1' },
      end: { optional: false, many: true, label: '1..N' }
    }
  }

  if (relationshipText === 'onetoone' || relationshipText === '11') {
    return {
      start: { optional: false, many: false, label: '1..1' },
      end: { optional: false, many: false, label: '1..1' }
    }
  }

  return {
    start: getStartCardinality(rel.startRelationshipType ?? rel.startCardinality),
    end: getRelationshipCardinality(rel.relationshipType ?? rel.endRelationshipType ?? rel.endCardinality)
  }
}

function createSvgElement(name, attributes) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name)

  Object.entries(attributes || {}).forEach(([key, value]) => {
    el.setAttribute(key, value)
  })

  return el
}

function appendMarkerLine(group, start, end) {
  group.appendChild(createSvgElement('line', {
    x1: String(start.x),
    y1: String(start.y),
    x2: String(end.x),
    y2: String(end.y)
  }))
}

function drawCardinalityMarker(anchor, cardinality, titleText) {
  const group = createSvgElement('g', { class: 'relation-marker' })
  const vector = anchor.vector
  const perpendicular = { x: -vector.y, y: vector.x }

  const title = createSvgElement('title', {})
  title.textContent = titleText
  group.appendChild(title)

  if (cardinality.optional) {
    const center = addVector(anchor, 7)
    group.appendChild(createSvgElement('circle', {
      class: 'relation-ring',
      cx: String(center.x),
      cy: String(center.y),
      r: '4.4'
    }))
  } else {
    const center = addVector(anchor, 6)
    appendMarkerLine(
      group,
      {
        x: center.x - perpendicular.x * 6,
        y: center.y - perpendicular.y * 6
      },
      {
        x: center.x + perpendicular.x * 6,
        y: center.y + perpendicular.y * 6
      }
    )
  }

  if (cardinality.many) {
    const base = addVector(anchor, 13)
    const tip = addVector(anchor, 25)
    appendMarkerLine(group, base, tip)
    appendMarkerLine(
      group,
      base,
      {
        x: tip.x + perpendicular.x * 8,
        y: tip.y + perpendicular.y * 8
      }
    )
    appendMarkerLine(
      group,
      base,
      {
        x: tip.x - perpendicular.x * 8,
        y: tip.y - perpendicular.y * 8
      }
    )
  }

  return group
}

function getRelationPath(startAnchor, endAnchor) {
  const start = addVector(startAnchor, 30)
  const end = addVector(endAnchor, 30)
  const startHorizontal = startAnchor.direction === 'left' || startAnchor.direction === 'right'
  const endHorizontal = endAnchor.direction === 'left' || endAnchor.direction === 'right'

  if (startHorizontal && endHorizontal) {
    const midX = (start.x + end.x) / 2
    return 'M ' + start.x + ' ' + start.y + ' L ' + midX + ' ' + start.y + ' L ' + midX + ' ' + end.y + ' L ' + end.x + ' ' + end.y
  }

  if (!startHorizontal && !endHorizontal) {
    const midY = (start.y + end.y) / 2
    return 'M ' + start.x + ' ' + start.y + ' L ' + start.x + ' ' + midY + ' L ' + end.x + ' ' + midY + ' L ' + end.x + ' ' + end.y
  }

  return 'M ' + start.x + ' ' + start.y + ' L ' + end.x + ' ' + start.y + ' L ' + end.x + ' ' + end.y
}

function renderRelations() {
  relationsLayer.innerHTML = ''

  Object.values(relationshipEntities).forEach((rel) => {
    const { startTableId, endTableId } = getRelationEndpoints(rel)

    const from = tablePositions[startTableId]
    const to = tablePositions[endTableId]

    if (!from || !to) return

    const fallbackDirections = getFallbackDirections(from, to)
    const startAnchor = getAnchor(from, rel.start, fallbackDirections.start)
    const endAnchor = getAnchor(to, rel.end, fallbackDirections.end)
    const cardinalities = getRelationCardinalities(rel)
    const titleText = cardinalities.start.label + ' to ' + cardinalities.end.label

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', getRelationPath(startAnchor, endAnchor))
    path.setAttribute('class', 'relation')
    const title = createSvgElement('title', {})
    title.textContent = titleText
    path.appendChild(title)

    relationsLayer.appendChild(path)
    relationsLayer.appendChild(drawCardinalityMarker(startAnchor, cardinalities.start, titleText))
    relationsLayer.appendChild(drawCardinalityMarker(endAnchor, cardinalities.end, titleText))
  })
}

renderTables()
renderRelations()
updateTransform()

console.log('collections keys:', Object.keys(collections))
console.log('relationship sample:', Object.values(relationshipEntities)[0])
console.log('column sample:', Object.values(columnEntities)[0])
</script>
</body>
</html>
`
}
