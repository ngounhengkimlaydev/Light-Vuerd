import * as vscode from "vscode";
import * as fs from "fs";

export function openPanel(uri: vscode.Uri) {
  const panel = vscode.window.createWebviewPanel(
    "lightVuerd",
    "Light Vuerd ERD",
    vscode.ViewColumn.One,
    { enableScripts: true },
  );

  const raw = fs.readFileSync(uri.fsPath, "utf8");
  panel.webview.html = getHtml(raw);
}

function getHtml(rawJson: string) {
  const safeJson = JSON.stringify(rawJson);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg0: #0b0f1a;
    --bg1: #111827;
    --bg2: #1a2236;
    --bg3: #243048;
    --border: #2d3f5a;
    --border-light: #3d5270;
    --text0: #e2eaf8;
    --text1: #94aac8;
    --text2: #5d7498;
    --accent: #3b82f6;
    --accent2: #60a5fa;
    --accent-glow: rgba(59,130,246,0.12);
    --green: #10b981;
    --amber: #f59e0b;
    --rose: #f43f5e;
    --purple: #a78bfa;
    --cyan: #22d3ee;
    --pk: #f59e0b;
    --fk: #60a5fa;
    --sidebar-w: 260px;
    --toolbar-h: 48px;
    --rel-1-1: #22d3ee;
    --rel-1-m: #a78bfa;
    --rel-m-m: #f43f5e;
  }

  body {
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    background: var(--bg0);
    color: var(--text0);
    overflow: hidden;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── TOOLBAR ── */
  .toolbar {
    height: var(--toolbar-h);
    background: var(--bg1);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    flex-shrink: 0;
    z-index: 20;
  }

  .toolbar-brand {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent2);
    margin-right: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .toolbar-brand svg { opacity: 0.9; }

  .toolbar-sep { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }

  .chip {
    font-size: 11px;
    color: var(--text1);
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 3px 8px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .chip b { color: var(--text0); font-weight: 600; }

  .tb-btn {
    height: 28px;
    padding: 0 10px;
    font-size: 11px;
    font-family: inherit;
    background: var(--bg2);
    color: var(--text1);
    border: 1px solid var(--border);
    border-radius: 5px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .tb-btn:hover { color: var(--text0); border-color: var(--border-light); background: var(--bg3); }
  .tb-btn:active { opacity: 0.8; }

  .spacer { flex: 1; }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0 8px;
    height: 28px;
    transition: border-color 0.15s;
  }
  .search-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
  .search-wrap svg { opacity: 0.5; flex-shrink: 0; }
  .search-wrap input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text0);
    font-family: inherit;
    font-size: 12px;
    width: 180px;
  }
  .search-wrap input::placeholder { color: var(--text2); }
  .search-status { font-size: 11px; color: var(--text2); min-width: 36px; text-align: right; }

  /* ── LAYOUT ── */
  .layout {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: var(--sidebar-w);
    background: var(--bg1);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 10px 12px 8px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text2);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sidebar-body { overflow-y: auto; flex: 1; padding: 6px 0; }
  .sidebar-body::-webkit-scrollbar { width: 4px; }
  .sidebar-body::-webkit-scrollbar-track { background: transparent; }
  .sidebar-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .sb-table {
    margin: 2px 6px;
    border-radius: 6px;
    overflow: hidden;
  }

  .sb-table-head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: var(--text0);
    border-radius: 6px;
    transition: background 0.12s;
    user-select: none;
  }
  .sb-table-head:hover { background: var(--bg2); }
  .sb-table-head.active { background: var(--accent-glow); color: var(--accent2); }

  .sb-table-icon {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: var(--bg3);
    border: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 9px;
    font-weight: 700;
    color: var(--accent2);
  }

  .sb-arrow {
    margin-left: auto;
    font-size: 10px;
    color: var(--text2);
    transition: transform 0.15s;
  }
  .sb-table-head.open .sb-arrow { transform: rotate(90deg); }

  .sb-columns {
    display: none;
    padding: 2px 0 4px 28px;
  }
  .sb-columns.open { display: block; }

  .sb-col {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px 3px 0;
    font-size: 11px;
    color: var(--text1);
    border-radius: 4px;
    cursor: pointer;
    transition: color 0.1s;
  }
  .sb-col:hover { color: var(--text0); }

  .col-badge {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .col-badge.pk { background: rgba(245,158,11,0.15); color: var(--pk); border: 1px solid rgba(245,158,11,0.3); }
  .col-badge.fk { background: rgba(96,165,250,0.12); color: var(--fk); border: 1px solid rgba(96,165,250,0.25); }
  .col-badge.col { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }

  .col-type { margin-left: auto; color: var(--text2); font-size: 10px; }

  /* Relations legend in sidebar */
  .sidebar-legend {
    padding: 10px 12px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .legend-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text2);
    margin-bottom: 8px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--text1);
    margin-bottom: 4px;
  }
  .legend-line {
    width: 32px;
    height: 2px;
    border-radius: 1px;
    flex-shrink: 0;
  }

  /* ── CANVAS ── */
  .canvas-wrap {
    flex: 1;
    overflow: hidden;
    position: relative;
    cursor: grab;
  }
  .canvas-wrap.panning { cursor: grabbing; }
  #canvas { width: 100%; height: 100%; display: block; }

  /* ── TABLE NODES ── */
  .table-group { cursor: move; }

  .table-bg {
    fill: var(--bg2);
    stroke: var(--border);
    stroke-width: 1;
  }
  .table-group.search-hit .table-bg { stroke: var(--amber); stroke-width: 1.5; }
  .table-group.search-active .table-bg { stroke: var(--accent2); stroke-width: 2; }
  .table-group.selected .table-bg { stroke: var(--accent2); stroke-width: 2; }

  .table-header-bg { fill: var(--bg3); }

  .table-title { fill: var(--text0); font-size: 13px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; }
  .table-subtitle { fill: var(--text2); font-size: 10px; font-family: 'SF Mono', 'Fira Code', monospace; }

  .row-even { fill: var(--bg2); }
  .row-odd  { fill: #161d2e; }
  .row-hover { fill: var(--bg3); }

  .col-name { fill: var(--text0); font-size: 11px; font-family: 'SF Mono', 'Fira Code', monospace; }
  .col-type-text { fill: var(--text2); font-size: 10px; font-family: 'SF Mono', 'Fira Code', monospace; }
  .col-pk-text { fill: var(--pk); font-size: 9px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; }
  .col-fk-text { fill: var(--fk); font-size: 9px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; }

  /* ── RELATIONS ── */
  .rel-path-1-1 { stroke: var(--rel-1-1); stroke-width: 1.5; fill: none; stroke-dasharray: none; opacity: 0.7; }
  .rel-path-1-m { stroke: var(--rel-1-m); stroke-width: 1.5; fill: none; opacity: 0.7; }
  .rel-path-m-m { stroke: var(--rel-m-m); stroke-width: 1.5; fill: none; opacity: 0.7; }
  .rel-marker { fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .rel-ring { stroke-width: 1.5; vector-effect: non-scaling-stroke; }

  /* ── TOOLTIP ── */
  .rel-label { fill: var(--text0); font-size: 10px; font-family: 'SF Mono', 'Fira Code', monospace; }

  /* Hint bar */
  .hint-bar {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(11,15,26,0.88);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 11px;
    color: var(--text2);
    pointer-events: none;
    white-space: nowrap;
    backdrop-filter: blur(4px);
  }
</style>
</head>
<body>

<!-- TOOLBAR -->
<div class="toolbar">
  <div class="toolbar-brand">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="3" stroke="#60a5fa" stroke-width="1.5"/>
      <rect x="4" y="4" width="8" height="2" rx="1" fill="#60a5fa"/>
      <rect x="4" y="8" width="5" height="1.5" rx="0.75" fill="#5d7498"/>
      <rect x="4" y="11" width="6" height="1.5" rx="0.75" fill="#5d7498"/>
    </svg>
    ERD Viewer
  </div>
  <div class="toolbar-sep"></div>
  <div class="chip">Tables <b id="countText">0</b></div>
  <div class="chip">Rels <b id="relCount">0</b></div>
  <div class="toolbar-sep"></div>
  <div class="chip">Zoom <b id="zoomText">100%</b></div>
  <button class="tb-btn" onclick="zoomIn()">＋</button>
  <button class="tb-btn" onclick="zoomOut()">－</button>
  <button class="tb-btn" onclick="resetView()">⟳ Reset</button>
  <button class="tb-btn" onclick="fitAll()">⊞ Fit</button>
  <div class="spacer"></div>
  <div class="search-wrap">
    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input id="searchInput" type="search" placeholder="Search table or column…" />
    <button class="tb-btn" id="prevSearch" style="height:20px;padding:0 6px;border:none;background:transparent;">↑</button>
    <button class="tb-btn" id="nextSearch" style="height:20px;padding:0 6px;border:none;background:transparent;">↓</button>
    <span id="searchStatus" class="search-status">0/0</span>
  </div>
</div>

<!-- LAYOUT -->
<div class="layout">

  <!-- SIDEBAR -->
  <div class="sidebar">
    <div class="sidebar-header">
      <span>Schema Explorer</span>
      <span id="sbCount" style="color:var(--text1)"></span>
    </div>
    <div class="sidebar-body" id="sidebarBody"></div>
    <div class="sidebar-legend">
      <div class="legend-title">Relationships</div>
      <div class="legend-item"><div class="legend-line" style="background:var(--rel-1-1)"></div> 1 : 1</div>
      <div class="legend-item"><div class="legend-line" style="background:var(--rel-1-m)"></div> 1 : N</div>
      <div class="legend-item"><div class="legend-line" style="background:var(--rel-m-m)"></div> N : N</div>
    </div>
  </div>

  <!-- CANVAS -->
  <div class="canvas-wrap" id="canvasWrap">
    <svg id="canvas">
      <defs>
        <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g id="viewport">
        <g id="relations"></g>
        <g id="tables"></g>
      </g>
    </svg>
    <div class="hint-bar">Scroll = zoom &nbsp;·&nbsp; Middle/Space+drag = pan &nbsp;·&nbsp; Drag table = move &nbsp;·&nbsp; Ctrl+F = search</div>
  </div>
</div>

<script>
const raw = ${safeJson}
const data = JSON.parse(raw)

const svg = document.getElementById('canvas')
const viewport = document.getElementById('viewport')
const relationsLayer = document.getElementById('relations')
const tablesLayer = document.getElementById('tables')
const countText = document.getElementById('countText')
const relCount = document.getElementById('relCount')
const zoomText = document.getElementById('zoomText')
const searchInput = document.getElementById('searchInput')
const prevSearchButton = document.getElementById('prevSearch')
const nextSearchButton = document.getElementById('nextSearch')
const searchStatus = document.getElementById('searchStatus')
const sidebarBody = document.getElementById('sidebarBody')
const sbCount = document.getElementById('sbCount')
const canvasWrap = document.getElementById('canvasWrap')

const collections = data.collections || {}
const tableEntities = collections.tableEntities || {}
const columnEntities = collections.columnEntities || collections.tableColumnEntities || collections.columns || {}
const relationshipEntities = collections.relationshipEntities || collections.relationships || {}

const tables = Object.values(tableEntities)
countText.textContent = tables.length
relCount.textContent = Object.values(relationshipEntities).length
sbCount.textContent = tables.length + ' tables'

let scale = 1, panX = 0, panY = 0
let spaceDown = false, isPanning = false, dragTable = null
let startMouse = {x:0,y:0}, startPan = {x:0,y:0}
let tablePositions = {}
let searchMatches = [], activeSearchIndex = -1

// ── TABLE DIMENSIONS ──
const TW = 320
const ROW_H = 22
const HEAD_H = 46

function tableHeight(columns) { return HEAD_H + columns.length * ROW_H + 8 }

// ── TRANSFORM ──
function updateTransform() {
  viewport.setAttribute('transform', 'translate(' + panX + ',' + panY + ') scale(' + scale + ')')
  zoomText.textContent = Math.round(scale * 100) + '%'
}

function screenToWorld(cx, cy) {
  const r = svg.getBoundingClientRect()
  return { x: (cx - r.left - panX) / scale, y: (cy - r.top - panY) / scale }
}

function zoomAt(cx, cy, factor) {
  const before = screenToWorld(cx, cy)
  scale = Math.max(0.1, Math.min(scale * factor, 4))
  const r = svg.getBoundingClientRect()
  panX = cx - r.left - before.x * scale
  panY = cy - r.top - before.y * scale
  updateTransform()
}

function zoomIn()  { zoomAt(canvasWrap.clientWidth/2, canvasWrap.clientHeight/2, 1.15) }
function zoomOut() { zoomAt(canvasWrap.clientWidth/2, canvasWrap.clientHeight/2, 0.87) }
function resetView() { scale=1; panX=0; panY=0; updateTransform(); }
window.zoomIn = zoomIn; window.zoomOut = zoomOut; window.resetView = resetView

function fitAll() {
  if (!Object.keys(tablePositions).length) return
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity
  Object.values(tablePositions).forEach(p => {
    minX=Math.min(minX,p.x); minY=Math.min(minY,p.y)
    maxX=Math.max(maxX,p.x+p.width); maxY=Math.max(maxY,p.y+p.height)
  })
  const pad=60, W=canvasWrap.clientWidth, H=canvasWrap.clientHeight
  const sw=(W-pad*2)/(maxX-minX), sh=(H-pad*2)/(maxY-minY)
  scale = Math.max(0.1,Math.min(Math.min(sw,sh),2))
  panX = pad - minX*scale
  panY = pad - minY*scale
  updateTransform()
}
window.fitAll = fitAll

// ── EVENTS ──
svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : 0.91) }, {passive:false})

window.addEventListener('keydown', e => {
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='f') { e.preventDefault(); searchInput.focus(); searchInput.select(); return }
  if (e.target===searchInput) return
  if (e.code==='Space') { spaceDown=true; e.preventDefault() }
})
window.addEventListener('keyup', e => { if(e.code==='Space') spaceDown=false })

svg.addEventListener('mousedown', e => {
  const tg = e.target.closest?.('.table-group')
  if (tg && !spaceDown && e.button===0) {
    dragTable = tg
    const id = tg.dataset.id
    const w = screenToWorld(e.clientX, e.clientY)
    startMouse = w
    startPan = {x:tablePositions[id].x, y:tablePositions[id].y}
    return
  }
  if (e.button===1||spaceDown) {
    isPanning=true; canvasWrap.classList.add('panning')
    startMouse={x:e.clientX,y:e.clientY}; startPan={x:panX,y:panY}; e.preventDefault()
  }
})

window.addEventListener('mousemove', e => {
  if (dragTable) {
    const id = dragTable.dataset.id
    const w = screenToWorld(e.clientX, e.clientY)
    tablePositions[id].x = startPan.x + w.x - startMouse.x
    tablePositions[id].y = startPan.y + w.y - startMouse.y
    dragTable.setAttribute('transform','translate('+tablePositions[id].x+','+tablePositions[id].y+')')
    renderRelations(); return
  }
  if (isPanning) {
    panX = startPan.x + (e.clientX - startMouse.x)
    panY = startPan.y + (e.clientY - startMouse.y)
    updateTransform()
  }
})
window.addEventListener('mouseup', () => { isPanning=false; dragTable=null; canvasWrap.classList.remove('panning') })
svg.addEventListener('auxclick', e => e.preventDefault())

// ── COLUMN HELPERS ──
function getColumns(table) {
  const ids = table.seqColumnIds || table.columnIds || []
  return ids.map(id => columnEntities[id]).filter(Boolean)
}
function getColumnName(col) { return col.name || col.columnName || col.fieldName || 'field' }
function getColumnType(col) { return col.dataType || col.type || col.data_type || '' }

function isColumnPK(col, table) {
  const name = getColumnName(col).toLowerCase()
  return col.primaryKey || col.pk || name === 'id' || name === table.name?.toLowerCase()+'_id'
}

function isColumnFK(colId) {
  return Object.values(relationshipEntities).some(rel => {
    const endColId = rel.end?.columnId || rel.childColumnId || rel.targetColumnId
    return endColId === colId
  })
}

// ── SVG HELPERS ──
function ns(tag, attrs={}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,String(v)))
  return el
}
function text(x,y,cls,content,extra={}) {
  const el = ns('text', {x,y,class:cls,...extra})
  el.textContent = content
  return el
}

// ── RENDER TABLES ──
function renderTables() {
  tablesLayer.innerHTML = ''
  const COLS_PER_ROW = Math.ceil(Math.sqrt(tables.length))

  tables.forEach((table, index) => {
    const id = table.id || Object.keys(tableEntities)[index]
    const columns = getColumns(table)
    const width = TW
    const height = tableHeight(columns)

    const defaultX = 40 + (index % COLS_PER_ROW) * (TW + 60)
    const defaultY = 40 + Math.floor(index / COLS_PER_ROW) * (height + 60)
    const x = table.ui?.x ?? table.x ?? defaultX
    const y = table.ui?.y ?? table.y ?? defaultY

    tablePositions[id] = {
      x, y, width, height,
      table,
      searchText: [table.name, ...columns.map(c => getColumnName(c)+' '+getColumnType(c))].filter(Boolean).join(' ').toLowerCase()
    }

    const group = ns('g', {class:'table-group', 'data-id':id, transform:'translate('+x+','+y+')'})

    // Shadow layer
    const shadow = ns('rect', {x:2,y:4,width,height,rx:10,fill:'rgba(0,0,0,0.4)'})
    group.appendChild(shadow)

    // Main body
    const body = ns('rect', {width,height,rx:10,class:'table-bg'})
    group.appendChild(body)

    // Header
    const hdr = ns('rect', {width,height:HEAD_H,rx:10,class:'table-header-bg'})
    group.appendChild(hdr)
    // Clip bottom corners of header
    const hdrBot = ns('rect', {y:HEAD_H-10,width,height:10,class:'table-header-bg'})
    group.appendChild(hdrBot)

    // Header accent line
    const accent = ns('line', {x1:0,y1:HEAD_H,x2:width,y2:HEAD_H,stroke:'var(--border-light)','stroke-width':0.5})
    group.appendChild(accent)

    // Table name
    group.appendChild(text(14, 22, 'table-title', table.name || 'table'))
    group.appendChild(text(14, 38, 'table-subtitle', columns.length + ' columns'))

    // Column dot indicator (color pill)
    const dotX = width - 16
    const dotCol = '#3b82f6'
    const dot = ns('circle', {cx:dotX, cy:20, r:5, fill:dotCol, opacity:'0.6'})
    group.appendChild(dot)

    // Row divider
    const divider = ns('line', {x1:0, y1:HEAD_H, x2:width, y2:HEAD_H, stroke:'var(--border)', 'stroke-width':0.5})
    group.appendChild(divider)

    // Columns
    columns.forEach((col, i) => {
      const cy = HEAD_H + 4 + i * ROW_H
      const colId = (table.seqColumnIds || table.columnIds || [])[i]
      const isPK = isColumnPK(col, table)
      const isFK = !isPK && isColumnFK(colId)

      // Row bg (subtle alternation)
      const rowBg = ns('rect', {x:0, y:cy, width, height:ROW_H, fill: i%2===0 ? 'rgba(26,34,54,0)' : 'rgba(13,18,30,0.4)'})
      group.appendChild(rowBg)

      // Row separator
      if (i < columns.length - 1) {
        const sep = ns('line', {x1:8, y1:cy+ROW_H, x2:width-8, y2:cy+ROW_H, stroke:'var(--border)', 'stroke-width':0.3, opacity:'0.5'})
        group.appendChild(sep)
      }

      const textY = cy + ROW_H - 7

      // Badge
      if (isPK) {
        const badge = ns('rect', {x:10, y:cy+4, width:20, height:14, rx:3, fill:'rgba(245,158,11,0.12)', stroke:'rgba(245,158,11,0.3)', 'stroke-width':0.5})
        group.appendChild(badge)
        group.appendChild(text(20, cy+14, 'col-pk-text', 'PK', {'text-anchor':'middle'}))
      } else if (isFK) {
        const badge = ns('rect', {x:10, y:cy+4, width:20, height:14, rx:3, fill:'rgba(96,165,250,0.1)', stroke:'rgba(96,165,250,0.25)', 'stroke-width':0.5})
        group.appendChild(badge)
        group.appendChild(text(20, cy+14, 'col-fk-text', 'FK', {'text-anchor':'middle'}))
      } else {
        const dot2 = ns('circle', {cx:20, cy:cy+11, r:2, fill:'var(--border-light)'})
        group.appendChild(dot2)
      }

      group.appendChild(text(38, textY, 'col-name', getColumnName(col)))
      group.appendChild(text(width - 10, textY, 'col-type-text', getColumnType(col), {'text-anchor':'end'}))
    })

    // Bottom rounded clip
    tablesLayer.appendChild(group)
  })

  renderSidebar()
  updateSearch()
}

// ── SIDEBAR ──
function renderSidebar() {
  sidebarBody.innerHTML = ''
  Object.entries(tableEntities).forEach(([tableId, table]) => {
    const columns = getColumns(table)

    const tableDiv = document.createElement('div')
    tableDiv.className = 'sb-table'

    const head = document.createElement('div')
    head.className = 'sb-table-head'
    head.innerHTML = '<div class="sb-table-icon">T</div><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (table.name||'table') + '</span><span class="sb-arrow">▶</span>'

    const cols = document.createElement('div')
    cols.className = 'sb-columns'

    columns.forEach((col, i) => {
      const colId = (table.seqColumnIds || table.columnIds || [])[i]
      const isPK = isColumnPK(col, table)
      const isFK = !isPK && isColumnFK(colId)
      const div = document.createElement('div')
      div.className = 'sb-col'
      const type = isPK ? 'pk' : isFK ? 'fk' : 'col'
      const label = isPK ? 'PK' : isFK ? 'FK' : '·'
      div.innerHTML = '<span class="col-badge ' + type + '">' + label + '</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + getColumnName(col) + '</span><span class="col-type">' + getColumnType(col) + '</span>'
      cols.appendChild(div)
    })

    head.addEventListener('click', () => {
      const isOpen = head.classList.toggle('open')
      cols.classList.toggle('open', isOpen)
      if (isOpen) {
        // Pan to table
        const pos = tablePositions[tableId]
        if (pos) {
          const W = canvasWrap.clientWidth, H = canvasWrap.clientHeight
          panX = W/2 - (pos.x + pos.width/2) * scale
          panY = H/2 - (pos.y + pos.height/2) * scale
          updateTransform()
          // highlight
          tablesLayer.querySelectorAll('.table-group').forEach(g => g.classList.remove('selected'))
          const tg = tablesLayer.querySelector('.table-group[data-id="'+tableId+'"]')
          if (tg) tg.classList.add('selected')
        }
      }
    })

    tableDiv.appendChild(head)
    tableDiv.appendChild(cols)
    sidebarBody.appendChild(tableDiv)
  })
}

// ── SEARCH ──
function getTableGroup(id) {
  return tablesLayer.querySelector('.table-group[data-id="'+id+'"]')
}
function clearSearchClasses() {
  tablesLayer.querySelectorAll('.table-group').forEach(g => g.classList.remove('search-hit','search-active'))
}
function updateSearchStatus() {
  searchStatus.textContent = searchMatches.length ? (activeSearchIndex+1)+'/'+searchMatches.length : '0/0'
}
function focusTable(id) {
  const pos = tablePositions[id]; if(!pos) return
  const W=canvasWrap.clientWidth, H=canvasWrap.clientHeight
  panX = W/2 - (pos.x+pos.width/2)*scale
  panY = H/2 - (pos.y+pos.height/2)*scale
  updateTransform()
}
function activateSearchMatch(index) {
  if (!searchMatches.length) { activeSearchIndex=-1; updateSearchStatus(); return }
  activeSearchIndex = (index+searchMatches.length)%searchMatches.length
  clearSearchClasses()
  searchMatches.forEach(id => getTableGroup(id)?.classList.add('search-hit'))
  const activeId = searchMatches[activeSearchIndex]
  getTableGroup(activeId)?.classList.add('search-active')
  focusTable(activeId)
  updateSearchStatus()
}
function updateSearch() {
  const q = searchInput.value.trim().toLowerCase()
  clearSearchClasses()
  if (!q) { searchMatches=[]; activeSearchIndex=-1; updateSearchStatus(); return }
  searchMatches = Object.entries(tablePositions)
    .filter(([,p]) => p.searchText.includes(q)).map(([id]) => id)
  activateSearchMatch(0)
}
function nextSearchMatch(delta) {
  if (!searchMatches.length) { updateSearch(); return }
  activateSearchMatch(activeSearchIndex+delta)
}
searchInput.addEventListener('input', updateSearch)
searchInput.addEventListener('keydown', e => {
  if (e.key==='Enter') { e.preventDefault(); nextSearchMatch(e.shiftKey?-1:1) }
  if (e.key==='Escape') { searchInput.value=''; updateSearch(); }
})
prevSearchButton.addEventListener('click', () => nextSearchMatch(-1))
nextSearchButton.addEventListener('click', () => nextSearchMatch(1))

// ── RELATION HELPERS ──
function findTableByColumnId(columnId) {
  for (const [id, table] of Object.entries(tableEntities)) {
    const ids = table.seqColumnIds || table.columnIds || []
    if (ids.includes(columnId)) return id
  }
  return null
}
function getRelationEndpoints(rel) {
  const startTableId = rel.start?.tableId || rel.startTableId || rel.parentTableId || rel.sourceTableId || rel.fromTableId
    || findTableByColumnId(rel.start?.columnId || rel.parentColumnId || rel.sourceColumnId || rel.fromColumnId)
  const endTableId = rel.end?.tableId || rel.endTableId || rel.childTableId || rel.targetTableId || rel.toTableId
    || findTableByColumnId(rel.end?.columnId || rel.childColumnId || rel.targetColumnId || rel.toColumnId)
  return {startTableId, endTableId}
}

function asNumber(v) { const n=Number(v); return Number.isFinite(n)?n:null }
function clamp(v,a,b) { return Math.max(a,Math.min(b,v)) }

function getDirectionName(d) {
  if (typeof d==='string') { const n=d.toLowerCase(); if(['left','right','top','bottom'].includes(n)) return n }
  const v=asNumber(d); if(v===null) return null
  if((v&1)===1) return 'left'; if((v&2)===2) return 'right'; if((v&4)===4) return 'top'; if((v&8)===8) return 'bottom'
  return null
}
function getDirectionVector(d) {
  if(d==='left') return {x:-1,y:0}; if(d==='right') return {x:1,y:0}; if(d==='top') return {x:0,y:-1}; return {x:0,y:1}
}
function getFallbackDirections(from,to) {
  const fc={x:from.x+from.width/2,y:from.y+from.height/2}, tc={x:to.x+to.width/2,y:to.y+to.height/2}
  const dx=tc.x-fc.x, dy=tc.y-fc.y
  if (Math.abs(dx)>=Math.abs(dy)) return dx>=0 ? {start:'right',end:'left'} : {start:'left',end:'right'}
  return dy>=0 ? {start:'bottom',end:'top'} : {start:'top',end:'bottom'}
}
function getOriginalPos(pos) {
  return {x: pos.table.ui?.x??pos.table.x??pos.x, y: pos.table.ui?.y??pos.table.y??pos.y}
}
function getAnchor(pos, rp, fallback) {
  const dir = getDirectionName(rp?.direction) || fallback
  const vec = getDirectionVector(dir)
  const origin = getOriginalPos(pos)
  const px = asNumber(rp?.x), py = asNumber(rp?.y)
  let x = pos.x+pos.width/2, y = pos.y+pos.height/2
  if (dir==='left'||dir==='right') {
    x = dir==='left' ? pos.x : pos.x+pos.width
    if(py!==null) y = pos.y+clamp(py-origin.y, 20, pos.height-16)
  } else {
    y = dir==='top' ? pos.y : pos.y+pos.height
    if(px!==null) x = pos.x+clamp(px-origin.x, 20, pos.width-20)
  }
  return {x,y,direction:dir,vector:vec}
}
function addVec(pt, dist) { return {x:pt.x+pt.vector.x*dist, y:pt.y+pt.vector.y*dist} }

function getRelationCardinalities(rel) {
  const rt = typeof rel.relationshipType==='string' ? rel.relationshipType.toLowerCase().replace(/[^a-z0-9*]+/g,'') : ''
  if (rt==='manytomany'||rt==='nn'||rt==='**') return {type:'m-m',start:{optional:true,many:true},end:{optional:true,many:true}}
  if (rt==='onetomany'||rt==='1n'||rt==='1*') return {type:'1-m',start:{optional:false,many:false},end:{optional:true,many:true}}
  if (rt==='onetoone'||rt==='11') return {type:'1-1',start:{optional:false,many:false},end:{optional:false,many:false}}
  // Numeric
  const endV = asNumber(rel.relationshipType??rel.endRelationshipType??rel.endCardinality)
  if (endV===16) return {type:'1-m',start:{optional:false,many:false},end:{optional:false,many:true}}
  if (endV===4)  return {type:'1-m',start:{optional:false,many:false},end:{optional:true,many:true}}
  if (endV===8)  return {type:'1-1',start:{optional:false,many:false},end:{optional:false,many:false}}
  return {type:'1-m',start:{optional:false,many:false},end:{optional:true,many:true}}
}

function getRelationPath(sa, ea) {
  const s = addVec(sa,28), e = addVec(ea,28)
  const sh = sa.direction==='left'||sa.direction==='right'
  const eh = ea.direction==='left'||ea.direction==='right'
  if(sh&&eh) { const mx=(s.x+e.x)/2; return 'M'+s.x+' '+s.y+' L'+mx+' '+s.y+' L'+mx+' '+e.y+' L'+e.x+' '+e.y }
  if(!sh&&!eh) { const my=(s.y+e.y)/2; return 'M'+s.x+' '+s.y+' L'+s.x+' '+my+' L'+e.x+' '+my+' L'+e.x+' '+e.y }
  return 'M'+s.x+' '+s.y+' L'+e.x+' '+s.y+' L'+e.x+' '+e.y
}

// ── DRAW CARDINALITY MARKER ──
function drawMarker(anchor, cardinality, color) {
  const g = ns('g', {class:'rel-marker', stroke:color})
  const v = anchor.vector
  const perp = {x:-v.y, y:v.x}

  if (cardinality.optional) {
    const center = addVec(anchor, 9)
    const ring = ns('circle', {class:'rel-ring', cx:String(center.x), cy:String(center.y), r:'4', stroke:color, 'stroke-width':'1.5', fill:'var(--bg0)'})
    g.appendChild(ring)
  } else {
    const center = addVec(anchor, 8)
    const line = ns('line', {
      x1:String(center.x - perp.x*6), y1:String(center.y - perp.y*6),
      x2:String(center.x + perp.x*6), y2:String(center.y + perp.y*6),
      stroke:color, 'stroke-width':'1.8', 'stroke-linecap':'round'
    })
    g.appendChild(line)
  }

  if (cardinality.many) {
    const base = addVec(anchor, 16)
    const tip  = addVec(anchor, 28)
    // crow's foot
    const lineMain = ns('line', {x1:String(base.x),y1:String(base.y),x2:String(tip.x),y2:String(tip.y),stroke:color,'stroke-width':'1.5','stroke-linecap':'round'})
    const lineA = ns('line', {
      x1:String(base.x), y1:String(base.y),
      x2:String(tip.x+perp.x*8), y2:String(tip.y+perp.y*8),
      stroke:color,'stroke-width':'1.5','stroke-linecap':'round'
    })
    const lineB = ns('line', {
      x1:String(base.x), y1:String(base.y),
      x2:String(tip.x-perp.x*8), y2:String(tip.y-perp.y*8),
      stroke:color,'stroke-width':'1.5','stroke-linecap':'round'
    })
    g.appendChild(lineMain)
    g.appendChild(lineA)
    g.appendChild(lineB)
  } else {
    // single bar
    const center = addVec(anchor, 20)
    const line = ns('line', {
      x1:String(center.x - perp.x*6), y1:String(center.y - perp.y*6),
      x2:String(center.x + perp.x*6), y2:String(center.y + perp.y*6),
      stroke:color,'stroke-width':'1.8','stroke-linecap':'round'
    })
    g.appendChild(line)
  }

  return g
}

// ── RENDER RELATIONS ──
function renderRelations() {
  relationsLayer.innerHTML = ''
  const rels = Object.values(relationshipEntities)

  rels.forEach(rel => {
    const {startTableId, endTableId} = getRelationEndpoints(rel)
    const from = tablePositions[startTableId], to = tablePositions[endTableId]
    if (!from||!to) return

    const fd = getFallbackDirections(from,to)
    const sa = getAnchor(from, rel.start, fd.start)
    const ea = getAnchor(to, rel.end, fd.end)
    const car = getRelationCardinalities(rel)

    const colorMap = {'1-1':'var(--rel-1-1)','1-m':'var(--rel-1-m)','m-m':'var(--rel-m-m)'}
    const color = colorMap[car.type] || 'var(--rel-1-m)'

    const path = ns('path', {d:getRelationPath(sa,ea), stroke:color, 'stroke-width':'1.5', fill:'none', opacity:'0.75'})
    relationsLayer.appendChild(path)

    relationsLayer.appendChild(drawMarker(sa, car.start, color))
    relationsLayer.appendChild(drawMarker(ea, car.end, color))

    // Label at midpoint
    const s = addVec(sa,28), e = addVec(ea,28)
    const mx = (s.x+e.x)/2, my = (s.y+e.y)/2
    const labelText = car.type.replace('-',':')
    const labelBg = ns('rect', {x:mx-12,y:my-9,width:24,height:14,rx:4,fill:'var(--bg1)',stroke:color,'stroke-width':0.5,opacity:'0.9'})
    const label = ns('text', {x:mx, y:my+1, 'text-anchor':'middle', 'font-size':'9', 'font-family':"'SF Mono','Fira Code',monospace", fill:color, 'font-weight':'700'})
    label.textContent = labelText
    relationsLayer.appendChild(labelBg)
    relationsLayer.appendChild(label)
  })
}

renderTables()
renderRelations()
// Center initial view
setTimeout(() => { fitAll() }, 50)
</script>
</body>
</html>`;
}
