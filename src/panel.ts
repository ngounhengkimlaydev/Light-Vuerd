import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function openPanel(uri: vscode.Uri) {
  const panel = vscode.window.createWebviewPanel(
    "lightVuerd",
    "Light Vuerd ERD",
    vscode.ViewColumn.One,
    { enableScripts: true },
  );

  const raw = fs.readFileSync(uri.fsPath, "utf8");

  panel.webview.onDidReceiveMessage(async (message) => {
    try {
      if (message?.type === "saveJson") {
        fs.writeFileSync(uri.fsPath, message.rawJson, "utf8");
        vscode.window.showInformationMessage("Light Vuerd: ERD JSON saved.");
        return;
      }

      if (message?.type === "exportSql") {
        const fileBase = path.basename(uri.fsPath).replace(/(\.vuerd)?\.json$/i, "");
        const dialect = String(message.dialect || "sql").replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "sql";
        const defaultUri = vscode.Uri.file(path.join(path.dirname(uri.fsPath), `${fileBase}.${dialect}.sql`));
        const target = await vscode.window.showSaveDialog({
          defaultUri,
          filters: { "SQL files": ["sql"], "All files": ["*"] },
        });
        if (!target) return;
        fs.writeFileSync(target.fsPath, String(message.sql || ""), "utf8");
        vscode.window.showInformationMessage("Light Vuerd: SQL exported.");
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage("Light Vuerd: file operation failed. " + reason);
    }
  });

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
    --font: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
    --font-ui: Inter, ui-sans-serif, system-ui, sans-serif;
  }

  body {
    font-family: var(--font-ui);
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
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent2);
    margin-right: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

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
    height: 26px;
    padding: 0 10px;
    font-size: 11px;
    font-family: var(--font-ui);
    background: var(--bg2);
    color: var(--text1);
    border: 1px solid var(--border);
    border-radius: 5px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  .tb-btn:hover { color: var(--text0); border-color: var(--border-light); background: var(--bg3); }
  .tb-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .tb-btn:disabled:hover { color: var(--text1); border-color: var(--border); background: var(--bg2); }
  .tb-btn.primary { color: #bfdbfe; border-color: rgba(96,165,250,0.45); }
  .tb-btn.primary:hover { color: white; background: rgba(59,130,246,0.18); }

  /* DB type dropdown */
  .db-select-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .db-select {
    height: 26px;
    padding: 0 24px 0 8px;
    font-size: 11px;
    font-family: var(--font-ui);
    background: var(--bg2);
    color: var(--text1);
    border: 1px solid var(--border);
    border-radius: 5px;
    cursor: pointer;
    appearance: none;
    outline: none;
  }
  .db-select:focus { border-color: var(--accent); }
  .db-select-arrow {
    position: absolute;
    right: 6px;
    pointer-events: none;
    color: var(--text2);
    font-size: 10px;
  }

  .spacer { flex: 1; }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0 8px;
    height: 26px;
    transition: border-color 0.15s;
  }
  .search-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
  .search-wrap svg { opacity: 0.5; flex-shrink: 0; }
  .search-wrap input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text0);
    font-family: var(--font-ui);
    font-size: 12px;
    width: 160px;
  }
  .search-wrap input::placeholder { color: var(--text2); }
  .search-status { font-size: 11px; color: var(--text2); min-width: 30px; text-align: right; }

  /* ── LAYOUT ── */
  .layout { display: flex; flex: 1; overflow: hidden; }

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

  .sb-table { margin: 2px 6px; border-radius: 6px; overflow: hidden; }

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
    width: 18px; height: 18px; border-radius: 4px;
    background: var(--bg3); border: 1px solid var(--border-light);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 9px; font-weight: 700; color: var(--accent2);
  }

  .sb-arrow { margin-left: auto; font-size: 10px; color: var(--text2); transition: transform 0.15s; }
  .sb-table-head.open .sb-arrow { transform: rotate(90deg); }

  .sb-columns { display: none; padding: 2px 0 4px 28px; }
  .sb-columns.open { display: block; }

  .sb-col {
    display: flex; align-items: center; gap: 6px; padding: 3px 8px 3px 0;
    font-size: 11px; color: var(--text1); border-radius: 4px; cursor: pointer;
    transition: color 0.1s;
  }
  .sb-col:hover { color: var(--text0); }

  .col-badge {
    font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 3px; flex-shrink: 0;
  }
  .col-badge.pk { background: rgba(245,158,11,0.15); color: var(--pk); border: 1px solid rgba(245,158,11,0.3); }
  .col-badge.fk { background: rgba(96,165,250,0.12); color: var(--fk); border: 1px solid rgba(96,165,250,0.25); }
  .col-badge.col { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }

  .col-type { margin-left: auto; color: var(--text2); font-size: 10px; }

  .sidebar-legend {
    padding: 10px 12px; border-top: 1px solid var(--border); flex-shrink: 0;
  }
  .legend-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text2); margin-bottom: 8px; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text1); margin-bottom: 4px; }
  .legend-line { width: 32px; height: 2px; border-radius: 1px; flex-shrink: 0; }

  /* ── CANVAS ── */
  .canvas-wrap { flex: 1; overflow: hidden; position: relative; cursor: grab; }
  .canvas-wrap.panning { cursor: grabbing; }
  #canvas { width: 100%; height: 100%; display: block; }

  .table-group { cursor: move; }
  .table-bg { fill: var(--bg2); stroke: var(--border); stroke-width: 1; }
  .table-group.search-hit .table-bg { stroke: var(--amber); stroke-width: 1.5; }
  .table-group.search-active .table-bg { stroke: var(--accent2); stroke-width: 2; }
  .table-group.selected .table-bg { stroke: var(--accent2); stroke-width: 2; }
  .field-row.selected .field-row-bg { fill: rgba(59,130,246,0.18); }
  .table-header-bg { fill: var(--bg3); }
  .table-title { fill: var(--text0); font-size: 13px; font-weight: 700; font-family: var(--font-ui); }
  .table-subtitle { fill: var(--text2); font-size: 10px; font-family: var(--font-ui); }
  .table-group.compact .table-title { font-weight: 800; }
  .col-name { fill: var(--text0); font-size: 11px; font-family: var(--font); }
  .col-type-text { fill: var(--text2); font-size: 10px; font-family: var(--font); }
  .col-nullable-text { fill: var(--purple); font-size: 9px; font-weight: 600; font-family: var(--font-ui); cursor: pointer; }
  .col-notnull-text { fill: var(--rose); font-size: 9px; font-weight: 600; font-family: var(--font-ui); cursor: pointer; }
  .col-comment-text { fill: var(--text2); font-size: 9px; font-style: italic; font-family: var(--font-ui); }
  .col-pk-text { fill: var(--pk); font-size: 9px; font-weight: 700; font-family: var(--font-ui); }
  .col-fk-text { fill: var(--fk); font-size: 9px; font-weight: 700; font-family: var(--font-ui); }
  .rel-path-1-1 { stroke: var(--rel-1-1); stroke-width: 1.5; fill: none; opacity: 0.7; }
  .rel-path-1-m { stroke: var(--rel-1-m); stroke-width: 1.5; fill: none; opacity: 0.7; }
  .rel-path-m-m { stroke: var(--rel-m-m); stroke-width: 1.5; fill: none; opacity: 0.7; }
  .rel-marker { fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .rel-ring { stroke-width: 1.5; vector-effect: non-scaling-stroke; }

  .hint-bar {
    position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
    background: rgba(11,15,26,0.88); border: 1px solid var(--border); border-radius: 20px;
    padding: 5px 14px; font-size: 11px; color: var(--text2); pointer-events: none;
    white-space: nowrap; backdrop-filter: blur(4px);
  }

  /* ── CONTEXT MENU ── */
  .ctx-menu {
    position: fixed;
    background: var(--bg1);
    border: 1px solid var(--border-light);
    border-radius: 8px;
    padding: 4px;
    min-width: 200px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
    z-index: 1000;
    font-size: 12px;
    animation: ctxIn 0.1s ease;
  }
  @keyframes ctxIn { from { opacity:0; transform: scale(0.95) translateY(-4px); } to { opacity:1; transform: scale(1) translateY(0); } }

  .ctx-item {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 10px; border-radius: 5px; cursor: pointer;
    color: var(--text1); transition: background 0.1s, color 0.1s;
    user-select: none;
  }
  .ctx-item:hover { background: var(--bg3); color: var(--text0); }
  .ctx-item.danger:hover { background: rgba(244,63,94,0.12); color: #fda4af; }
  .ctx-item .ctx-icon { width: 16px; text-align: center; font-size: 13px; flex-shrink: 0; }
  .ctx-item .ctx-shortcut { margin-left: auto; font-size: 10px; color: var(--text2); }
  .ctx-sep { height: 1px; background: var(--border); margin: 4px 6px; }
  .ctx-section-label { padding: 4px 10px 2px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text2); }

  /* ── INLINE EDITOR ── */
  .inline-editor-overlay {
    position: fixed; inset: 0; z-index: 500; pointer-events: none;
  }
  .inline-editor {
    position: absolute;
    pointer-events: all;
    background: var(--bg1);
    border: 1.5px solid var(--accent);
    border-radius: 6px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 0 3px var(--accent-glow);
    padding: 10px;
    min-width: 300px;
    z-index: 600;
    animation: editorIn 0.12s ease;
  }
  @keyframes editorIn { from { opacity:0; transform: scale(0.96); } to { opacity:1; transform: scale(1); } }

  .inline-editor-title {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text2); margin-bottom: 8px;
  }

  .inline-field {
    display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;
  }
  .inline-field label { font-size: 11px; color: var(--text2); }
  .inline-input {
    background: var(--bg2); border: 1px solid var(--border); border-radius: 5px;
    padding: 5px 8px; color: var(--text0); font-family: var(--font); font-size: 12px;
    outline: none; transition: border-color 0.15s;
    width: 100%;
  }
  .inline-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }

  /* Nullable toggle row */
  .nullable-toggle-row {
    display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
    padding: 6px 8px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px;
  }
  .nullable-toggle-row label { font-size: 11px; color: var(--text1); flex: 1; cursor: pointer; user-select: none; }
  .toggle-switch {
    position: relative; width: 34px; height: 18px; flex-shrink: 0;
  }
  .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-track {
    position: absolute; inset: 0; border-radius: 9px; background: var(--bg3);
    border: 1px solid var(--border); transition: background 0.2s, border-color 0.2s; cursor: pointer;
  }
  .toggle-track::after {
    content: ''; position: absolute; top: 2px; left: 2px;
    width: 12px; height: 12px; border-radius: 50%; background: var(--text2);
    transition: transform 0.2s, background 0.2s;
  }
  .toggle-switch input:checked + .toggle-track { background: rgba(167,139,250,0.25); border-color: var(--purple); }
  .toggle-switch input:checked + .toggle-track::after { transform: translateX(16px); background: var(--purple); }

  /* Type autocomplete */
  .type-combo { position: relative; }
  .type-dropdown {
    position: absolute; top: calc(100% + 2px); left: 0; right: 0;
    background: var(--bg1); border: 1px solid var(--border-light); border-radius: 6px;
    max-height: 180px; overflow-y: auto; z-index: 700;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .type-dropdown::-webkit-scrollbar { width: 4px; }
  .type-dropdown::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  .type-opt {
    padding: 5px 10px; cursor: pointer; font-size: 11px; font-family: var(--font);
    color: var(--text1); transition: background 0.1s, color 0.1s;
    display: flex; align-items: center; gap: 8px;
  }
  .type-opt:hover, .type-opt.active { background: var(--bg3); color: var(--text0); }
  .type-opt .type-cat { font-size: 9px; color: var(--text2); margin-left: auto; text-transform: uppercase; letter-spacing: 0.08em; }

  /* Relation type picker */
  .rel-picker {
    display: flex; gap: 6px; margin-bottom: 8px;
  }
  .rel-opt {
    flex: 1; padding: 6px; border: 1px solid var(--border); border-radius: 6px;
    background: var(--bg2); cursor: pointer; text-align: center;
    font-size: 10px; color: var(--text2); transition: all 0.15s;
  }
  .rel-opt:hover { border-color: var(--border-light); color: var(--text1); }
  .rel-opt.selected { border-color: var(--accent); background: var(--accent-glow); color: var(--accent2); }
  .rel-opt .rel-icon { font-size: 16px; display: block; margin-bottom: 3px; }

  .inline-actions { display: flex; gap: 6px; justify-content: flex-end; margin-top: 4px; }
  .inline-btn {
    padding: 4px 12px; border-radius: 5px; font-size: 11px; font-family: var(--font-ui);
    cursor: pointer; border: 1px solid var(--border); background: var(--bg2); color: var(--text1);
    transition: all 0.15s;
  }
  .inline-btn:hover { background: var(--bg3); color: var(--text0); }
  .inline-btn.primary { background: var(--accent); border-color: var(--accent); color: white; }
  .inline-btn.primary:hover { background: #2563eb; }

  /* Inline name edit on SVG */
  .svg-input-overlay {
    position: fixed; z-index: 800;
  }
  .svg-inline-input {
    background: var(--bg3); border: 1px solid var(--accent); border-radius: 4px;
    padding: 2px 6px; color: var(--text0); font-weight: 700; font-family: var(--font-ui);
    font-size: 13px; outline: none; min-width: 140px;
    box-shadow: 0 0 0 2px var(--accent-glow);
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
    ERD
  </div>
  <div class="toolbar-sep"></div>
  <div class="chip">Tables <b id="countText">0</b></div>
  <div class="chip">Rels <b id="relCount">0</b></div>
  <div class="toolbar-sep"></div>
  <div class="chip">Zoom <b id="zoomText">100%</b></div>
  <button class="tb-btn" onclick="zoomIn()">＋</button>
  <button class="tb-btn" onclick="zoomOut()">－</button>
  <button class="tb-btn" onclick="resetView()">⟳</button>
  <button class="tb-btn" onclick="fitAll()">⊞ Fit</button>
  <button class="tb-btn" id="undoBtn" onclick="undoChange()" title="Undo (Ctrl+Z)">Undo</button>
  <button class="tb-btn" id="redoBtn" onclick="redoChange()" title="Redo (Ctrl+Shift+Z)">Redo</button>
  <div class="toolbar-sep"></div>
  <!-- DB dialect selector -->
  <div class="db-select-wrap">
    <select class="db-select" id="dbDialect" title="SQL dialect for type suggestions">
      <option value="mysql">MySQL</option>
      <option value="mariadb">MariaDB</option>
      <option value="postgres">PostgreSQL</option>
      <option value="sqlite">SQLite</option>
      <option value="mssql">SQL Server</option>
    </select>
    <span class="db-select-arrow">▾</span>
  </div>
  <button class="tb-btn" onclick="openSettings()">Settings</button>
  <button class="tb-btn" onclick="exportSql()">Export SQL</button>
  <button class="tb-btn primary" onclick="saveFile()">Save</button>
  <div class="spacer"></div>
  <div class="search-wrap">
    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input id="searchInput" type="search" placeholder="Search…" />
    <button class="tb-btn" id="prevSearch" style="height:18px;padding:0 5px;border:none;background:transparent;font-size:10px;">↑</button>
    <button class="tb-btn" id="nextSearch" style="height:18px;padding:0 5px;border:none;background:transparent;font-size:10px;">↓</button>
    <span id="searchStatus" class="search-status">0/0</span>
  </div>
</div>

<!-- LAYOUT -->
<div class="layout">

  <!-- SIDEBAR -->
  <div class="sidebar">
    <div class="sidebar-header">
      <span>Schema</span>
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
    <div class="hint-bar" id="hintBar">Right-click = menu &nbsp;·&nbsp; Dbl-click table name = rename &nbsp;·&nbsp; Dbl-click row = edit field &nbsp;·&nbsp; Ctrl+Z = undo</div>
  </div>
</div>

<!-- Overlays -->
<div id="ctxMenu" class="ctx-menu" style="display:none"></div>
<div id="editorOverlay" class="inline-editor-overlay" style="display:none">
  <div id="inlineEditor" class="inline-editor"></div>
</div>

<script>
const raw = ${safeJson}
const data = JSON.parse(raw)
data.collections = data.collections || {}
const vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null

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
const ctxMenu = document.getElementById('ctxMenu')
const editorOverlay = document.getElementById('editorOverlay')
const inlineEditor = document.getElementById('inlineEditor')
const dbDialect = document.getElementById('dbDialect')
const undoBtn = document.getElementById('undoBtn')
const redoBtn = document.getElementById('redoBtn')
const hintBar = document.getElementById('hintBar')

// ── DATA ──
const collections = data.collections
const tableEntities = collections.tableEntities || (collections.tableEntities = {})
const columnEntities = collections.columnEntities || collections.tableColumnEntities || (collections.columnEntities = {})
const relationshipEntities = collections.relationshipEntities || (collections.relationshipEntities = {})
// Normalize references
if (!collections.columnEntities) collections.columnEntities = columnEntities
if (!collections.relationshipEntities) collections.relationshipEntities = relationshipEntities

function normalizeIdentity(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeTableIdentity(table, key) {
  const schema = normalizeIdentity(table.schema || table.schemaName || table.database || table.databaseName)
  const name = normalizeIdentity(table.name || table.tableName || table.entityName)
  const id = normalizeIdentity(table.id || key)
  const identity = name || id
  return identity ? schema + ':' + identity : ''
}

function normalizeColumnIdentity(col, id) {
  const name = normalizeIdentity(col?.name || col?.columnName || col?.fieldName)
  return name || normalizeIdentity(id)
}

function mergeColumnData(targetCol, sourceCol) {
  if (!targetCol || !sourceCol) return
  const sourceName = sourceCol.name || sourceCol.columnName || sourceCol.fieldName
  if (!(targetCol.name || targetCol.columnName || targetCol.fieldName) && sourceName) targetCol.name = sourceName
  if (!getColumnType(targetCol) && getColumnType(sourceCol)) targetCol.dataType = getColumnType(sourceCol)
  if (sourceCol.primaryKey || sourceCol.pk) {
    targetCol.primaryKey = true
    targetCol.pk = true
  }
  if (sourceCol.notNull || sourceCol.nullable === false) {
    targetCol.notNull = true
    targetCol.nullable = false
  }
}

function dedupeTableColumns(table, columnRemap) {
  const ids = table.seqColumnIds || table.columnIds || []
  const seen = {}
  const nextIds = []

  ids.forEach(id => {
    const col = columnEntities[id]
    if (!col) return
    const identity = normalizeColumnIdentity(col, id)
    if (identity && seen[identity]) {
      if (seen[identity] === id) return
      columnRemap[id] = seen[identity]
      mergeColumnData(columnEntities[seen[identity]], col)
      delete columnEntities[id]
      return
    }
    seen[identity] = id
    nextIds.push(id)
  })

  table.seqColumnIds = nextIds
  table.columnIds = nextIds
}

function mergeColumnIds(targetTable, sourceTable, columnRemap) {
  const targetIds = getTableColumnIds(targetTable)
  const sourceIds = sourceTable.seqColumnIds || sourceTable.columnIds || []
  sourceIds.forEach(id => {
    if (id && !targetIds.includes(id)) targetIds.push(id)
  })
  dedupeTableColumns(targetTable, columnRemap)
}

function normalizeDuplicateTables() {
  const canonicalByIdentity = {}
  const remap = {}
  const columnRemap = {}

  Object.entries(tableEntities).forEach(([key, table]) => {
    const identity = normalizeTableIdentity(table, key)
    if (!identity) return

    if (!canonicalByIdentity[identity]) {
      canonicalByIdentity[identity] = key
      remap[key] = key
      if (table.id) remap[table.id] = key
      return
    }

    const canonicalKey = canonicalByIdentity[identity]
    const canonical = tableEntities[canonicalKey]
    mergeColumnIds(canonical, table, columnRemap)
    if (!canonical.name && table.name) canonical.name = table.name
    if (!canonical.ui && table.ui) canonical.ui = table.ui
    if (canonical.x == null && table.x != null) canonical.x = table.x
    if (canonical.y == null && table.y != null) canonical.y = table.y
    remap[key] = canonicalKey
    if (table.id) remap[table.id] = canonicalKey
    delete tableEntities[key]
  })

  Object.values(tableEntities).forEach(table => dedupeTableColumns(table, columnRemap))

  const resolveTableRef = value => {
    if (!value) return value
    const canonicalKey = remap[value] || getTableEntityKey(value)
    const canonical = tableEntities[canonicalKey]
    return canonical?.id || canonicalKey || value
  }
  const resolveColumnRef = value => columnRemap[value] || value

  Object.values(relationshipEntities).forEach(rel => {
    ;['startTableId','parentTableId','sourceTableId','fromTableId','endTableId','childTableId','targetTableId','toTableId'].forEach(key => {
      if (rel[key]) rel[key] = resolveTableRef(rel[key])
    })
    ;['parentColumnId','sourceColumnId','fromColumnId','childColumnId','targetColumnId','toColumnId'].forEach(key => {
      if (rel[key]) rel[key] = resolveColumnRef(rel[key])
    })
    if (rel.start?.tableId) rel.start.tableId = resolveTableRef(rel.start.tableId)
    if (rel.end?.tableId) rel.end.tableId = resolveTableRef(rel.end.tableId)
    if (rel.start?.columnId) rel.start.columnId = resolveColumnRef(rel.start.columnId)
    if (rel.end?.columnId) rel.end.columnId = resolveColumnRef(rel.end.columnId)
  })
}

normalizeDuplicateTables()

let tables = []
let selectedTableId = null
let selectedColumnId = null
let compactMode = false

// ── SQL TYPES BY DIALECT ──
const SQL_TYPES = {
  mysql: [
    {t:'INT',cat:'numeric'},{t:'BIGINT',cat:'numeric'},{t:'SMALLINT',cat:'numeric'},{t:'TINYINT',cat:'numeric'},{t:'DECIMAL(10,2)',cat:'numeric'},{t:'FLOAT',cat:'numeric'},{t:'DOUBLE',cat:'numeric'},
    {t:'VARCHAR(255)',cat:'string'},{t:'VARCHAR(100)',cat:'string'},{t:'CHAR(36)',cat:'string'},{t:'TEXT',cat:'string'},{t:'MEDIUMTEXT',cat:'string'},{t:'LONGTEXT',cat:'string'},{t:'TINYTEXT',cat:'string'},
    {t:'DATE',cat:'date'},{t:'DATETIME',cat:'date'},{t:'TIMESTAMP',cat:'date'},{t:'TIME',cat:'date'},{t:'YEAR',cat:'date'},
    {t:'BOOLEAN',cat:'bool'},{t:'TINYINT(1)',cat:'bool'},
    {t:'JSON',cat:'special'},{t:'ENUM',cat:'special'},{t:'SET',cat:'special'},{t:'BLOB',cat:'binary'},{t:'LONGBLOB',cat:'binary'},
  ],
  mariadb: [
    {t:'INT',cat:'numeric'},{t:'BIGINT',cat:'numeric'},{t:'SMALLINT',cat:'numeric'},{t:'DECIMAL(10,2)',cat:'numeric'},{t:'FLOAT',cat:'numeric'},{t:'DOUBLE',cat:'numeric'},
    {t:'VARCHAR(255)',cat:'string'},{t:'CHAR(36)',cat:'string'},{t:'TEXT',cat:'string'},{t:'MEDIUMTEXT',cat:'string'},{t:'LONGTEXT',cat:'string'},
    {t:'DATE',cat:'date'},{t:'DATETIME',cat:'date'},{t:'TIMESTAMP',cat:'date'},{t:'TIME',cat:'date'},
    {t:'BOOLEAN',cat:'bool'},{t:'TINYINT(1)',cat:'bool'},
    {t:'JSON',cat:'special'},{t:'ENUM',cat:'special'},{t:'UUID',cat:'special'},{t:'BLOB',cat:'binary'},
  ],
  postgres: [
    {t:'INTEGER',cat:'numeric'},{t:'BIGINT',cat:'numeric'},{t:'SMALLINT',cat:'numeric'},{t:'NUMERIC(10,2)',cat:'numeric'},{t:'REAL',cat:'numeric'},{t:'DOUBLE PRECISION',cat:'numeric'},{t:'SERIAL',cat:'numeric'},{t:'BIGSERIAL',cat:'numeric'},
    {t:'VARCHAR(255)',cat:'string'},{t:'CHAR(36)',cat:'string'},{t:'TEXT',cat:'string'},{t:'CITEXT',cat:'string'},
    {t:'DATE',cat:'date'},{t:'TIMESTAMP',cat:'date'},{t:'TIMESTAMPTZ',cat:'date'},{t:'TIME',cat:'date'},{t:'TIMETZ',cat:'date'},{t:'INTERVAL',cat:'date'},
    {t:'BOOLEAN',cat:'bool'},
    {t:'UUID',cat:'special'},{t:'JSONB',cat:'special'},{t:'JSON',cat:'special'},{t:'ARRAY',cat:'special'},{t:'BYTEA',cat:'binary'},{t:'POINT',cat:'geo'},{t:'POLYGON',cat:'geo'},
  ],
  sqlite: [
    {t:'INTEGER',cat:'numeric'},{t:'REAL',cat:'numeric'},{t:'NUMERIC',cat:'numeric'},
    {t:'TEXT',cat:'string'},{t:'VARCHAR(255)',cat:'string'},
    {t:'BLOB',cat:'binary'},{t:'BOOLEAN',cat:'bool'},
    {t:'DATE',cat:'date'},{t:'DATETIME',cat:'date'},
  ],
  mssql: [
    {t:'INT',cat:'numeric'},{t:'BIGINT',cat:'numeric'},{t:'SMALLINT',cat:'numeric'},{t:'TINYINT',cat:'numeric'},{t:'DECIMAL(18,2)',cat:'numeric'},{t:'FLOAT',cat:'numeric'},{t:'MONEY',cat:'numeric'},
    {t:'VARCHAR(255)',cat:'string'},{t:'NVARCHAR(255)',cat:'string'},{t:'CHAR(36)',cat:'string'},{t:'NCHAR(36)',cat:'string'},{t:'TEXT',cat:'string'},{t:'NTEXT',cat:'string'},
    {t:'DATE',cat:'date'},{t:'DATETIME',cat:'date'},{t:'DATETIME2',cat:'date'},{t:'DATETIMEOFFSET',cat:'date'},{t:'SMALLDATETIME',cat:'date'},{t:'TIME',cat:'date'},
    {t:'BIT',cat:'bool'},{t:'UNIQUEIDENTIFIER',cat:'special'},{t:'VARBINARY(MAX)',cat:'binary'},{t:'IMAGE',cat:'binary'},{t:'XML',cat:'special'},
  ],
}

function getTypes() { return SQL_TYPES[dbDialect.value] || SQL_TYPES.mysql }

function filterTypes(query) {
  const q = query.toLowerCase()
  return getTypes().filter(({t}) => t.toLowerCase().includes(q))
}

const DB_KEY = 'lightVuerd.dbDialect'
const MOUSE_KEY = 'lightVuerd.mouseSettings'
const DEFAULT_MOUSE_SETTINGS = { dragButton: 0, panButton: 1, menuButton: 2 }
const BUTTON_OPTIONS = [
  { value: 0, label: 'Left button' },
  { value: 1, label: 'Middle button' },
  { value: 2, label: 'Right button' },
]

dbDialect.value = localStorage.getItem(DB_KEY) || dbDialect.value
dbDialect.addEventListener('change', () => localStorage.setItem(DB_KEY, dbDialect.value))

function loadMouseSettings() {
  try {
    return { ...DEFAULT_MOUSE_SETTINGS, ...JSON.parse(localStorage.getItem(MOUSE_KEY) || '{}') }
  } catch {
    return { ...DEFAULT_MOUSE_SETTINGS }
  }
}

let mouseSettings = loadMouseSettings()

function saveMouseSettings(next) {
  mouseSettings = { ...DEFAULT_MOUSE_SETTINGS, ...next }
  localStorage.setItem(MOUSE_KEY, JSON.stringify(mouseSettings))
  updateHint()
}

function buttonLabel(button) {
  return BUTTON_OPTIONS.find(item => item.value === Number(button))?.label || 'Mouse button'
}

function updateHint() {
  if (!hintBar) return
  hintBar.innerHTML = buttonLabel(mouseSettings.menuButton) + ' = menu &nbsp;·&nbsp; ' +
    buttonLabel(mouseSettings.dragButton) + ' drag = move table &nbsp;·&nbsp; ' +
    buttonLabel(mouseSettings.panButton) + ' drag = pan &nbsp;·&nbsp; Ctrl+Z = undo'
}

// ── STATE ──
let scale = 1, panX = 0, panY = 0
let spaceDown = false, isPanning = false, dragTable = null
let didMoveTable = false
let dragHistoryStarted = false
let startMouse = {x:0,y:0}, startPan = {x:0,y:0}
let tablePositions = {}
let searchMatches = [], activeSearchIndex = -1

// ── SAVE ──
let saveTimer = null
function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveFile, 600)
}

function saveFile() {
  clearTimeout(saveTimer)
  vscodeApi?.postMessage({ type: 'saveJson', rawJson: JSON.stringify(data, null, 2) })
}
window.saveFile = saveFile

const undoStack = []
const redoStack = []
let isRestoringHistory = false

function snapshotData() {
  return JSON.stringify(data)
}

function replaceObject(target, source) {
  Object.keys(target).forEach(key => delete target[key])
  Object.assign(target, source || {})
}

function restoreSnapshot(snapshot) {
  const parsed = JSON.parse(snapshot)
  const parsedCollections = parsed.collections || {}

  Object.keys(data).forEach(key => {
    if (key !== 'collections') delete data[key]
  })
  Object.entries(parsed).forEach(([key, value]) => {
    if (key !== 'collections') data[key] = value
  })
  data.collections = collections

  Object.keys(collections).forEach(key => {
    if (!['tableEntities','columnEntities','tableColumnEntities','relationshipEntities'].includes(key)) delete collections[key]
  })
  Object.entries(parsedCollections).forEach(([key, value]) => {
    if (key === 'tableEntities') replaceObject(tableEntities, value)
    else if (key === 'columnEntities' || key === 'tableColumnEntities') replaceObject(columnEntities, value)
    else if (key === 'relationshipEntities') replaceObject(relationshipEntities, value)
    else collections[key] = value
  })
  collections.tableEntities = tableEntities
  collections.columnEntities = columnEntities
  collections.tableColumnEntities = columnEntities
  collections.relationshipEntities = relationshipEntities

  normalizeDuplicateTables()
  selectedTableId = null
  selectedColumnId = null
  renderAll()
}

function updateHistoryButtons() {
  if (undoBtn) undoBtn.disabled = undoStack.length === 0
  if (redoBtn) redoBtn.disabled = redoStack.length === 0
}

function pushHistory() {
  if (isRestoringHistory) return
  undoStack.push(snapshotData())
  if (undoStack.length > 80) undoStack.shift()
  redoStack.length = 0
  updateHistoryButtons()
}

function undoChange() {
  if (!undoStack.length) return
  isRestoringHistory = true
  redoStack.push(snapshotData())
  restoreSnapshot(undoStack.pop())
  isRestoringHistory = false
  updateHistoryButtons()
  saveFile()
}

function redoChange() {
  if (!redoStack.length) return
  isRestoringHistory = true
  undoStack.push(snapshotData())
  restoreSnapshot(redoStack.pop())
  isRestoringHistory = false
  updateHistoryButtons()
  saveFile()
}

window.undoChange = undoChange
window.redoChange = redoChange

function quoteIdent(name) {
  const text = String(name || 'unnamed').replace(new RegExp(String.fromCharCode(0), 'g'), '')
  if (dbDialect.value === 'mysql' || dbDialect.value === 'mariadb') {
    const tick = String.fromCharCode(96)
    return tick + text.replace(new RegExp(tick, 'g'), tick + tick) + tick
  }
  if (dbDialect.value === 'mssql') return '[' + text.replace(/]/g, ']]') + ']'
  return '"' + text.replace(/"/g, '""') + '"'
}

function defaultSqlType() {
  if (dbDialect.value === 'postgres') return 'TEXT'
  if (dbDialect.value === 'sqlite') return 'TEXT'
  if (dbDialect.value === 'mssql') return 'NVARCHAR(255)'
  return 'VARCHAR(255)'
}

function buildForeignKeys(tableId) {
  const clauses = []
  Object.values(relationshipEntities).forEach(rel => {
    const ep = getRelationEndpoints(rel)
    if (ep.endTableId !== tableId) return
    const fromCol = rel.start?.columnId || rel.parentColumnId || rel.sourceColumnId || rel.fromColumnId
    const toCol = rel.end?.columnId || rel.childColumnId || rel.targetColumnId || rel.toColumnId
    if (!fromCol || !toCol || !columnEntities[fromCol] || !columnEntities[toCol]) return
    const fromTable = getTableEntity(ep.startTableId)
    if (!fromTable) return
    clauses.push('  FOREIGN KEY (' + quoteIdent(getColumnName(columnEntities[toCol])) + ') REFERENCES ' + quoteIdent(fromTable.name || ep.startTableId) + ' (' + quoteIdent(getColumnName(columnEntities[fromCol])) + ')')
  })
  return clauses
}

function generateSql() {
  const nl = String.fromCharCode(10)
  const blocks = Object.entries(tableEntities).map(([tableId, table]) => {
    const columns = getColumns(table)
    const columnIds = getTableColumnIds(table)
    const lines = columns.map((col, index) => {
      const colId = columnIds[index]
      const nullable = isColumnNullable(col)
      const parts = ['  ' + quoteIdent(getColumnName(col)), getColumnType(col) || defaultSqlType()]
      if (isColumnPK(col, table) && columnIds.filter(id => isColumnPK(columnEntities[id] || {}, table)).length === 1) parts.push('PRIMARY KEY')
      if (!nullable) parts.push('NOT NULL')
      const comment = getColumnComment(col)
      if (comment && (dbDialect.value === 'mysql' || dbDialect.value === 'mariadb')) parts.push('COMMENT ' + "'" + comment.replace(/'/g, "\\'") + "'")
      return parts.join(' ')
    })
    const pkNames = columnIds.filter(id => isColumnPK(columnEntities[id] || {}, table)).map(id => quoteIdent(getColumnName(columnEntities[id])))
    if (pkNames.length > 1) lines.push('  PRIMARY KEY (' + pkNames.join(', ') + ')')
    lines.push(...buildForeignKeys(tableId))
    return 'CREATE TABLE ' + quoteIdent(table.name || tableId) + ' (' + nl + lines.join(',' + nl) + nl + ');'
  })
  return '-- Light Vuerd SQL export (' + dbDialect.options[dbDialect.selectedIndex].text + ')' + nl + nl + blocks.join(nl + nl)
}

function exportSql() {
  vscodeApi?.postMessage({ type: 'exportSql', dialect: dbDialect.value, sql: generateSql() })
}
window.exportSql = exportSql

// ── STATS ──
function refreshStats() {
  tables = Object.values(tableEntities)
  countText.textContent = tables.length
  relCount.textContent = Object.values(relationshipEntities).length
  sbCount.textContent = tables.length + ' tables'
}

// ── DIMENSIONS ──
// Spreadsheet-style: one row per field, fixed columns: badge|name|type|null|default|comment
const TW = 580          // wider to fit all columns
const COMPACT_TW = 580
const ROW_H = 22        // single-line row height
const HEAD_H = 46       // table header (name + subtitle)
const COL_HDR_H = 18    // column-labels sub-header height
const COMPACT_HEAD_H = 72

// Fixed column X positions (left edges)
const CX_BADGE  = 0      // 0..32  icon/badge zone
const CX_NAME   = 32     // field name
const CX_TYPE   = 160    // data type
const CX_NULL   = 258    // NULL / N-N
const CX_DFLT   = 306    // default value
const CX_CMT    = 380    // comment (stretches to end)

function zoomStableSize(screenPx, minWorld, maxWorld) {
  const scaled = screenPx / Math.max(scale, 0.08)
  return Math.round(Math.max(minWorld, Math.min(scaled, maxWorld)))
}

function tableWidth() {
  return compactMode ? Math.min(COMPACT_TW, 580) : TW
}

function tableHeaderHeight() {
  return compactMode ? 80 : HEAD_H
}

function compactTitleSize() { return 34 }

function tableHeight(columns) {
  return compactMode ? tableHeaderHeight() : HEAD_H + COL_HDR_H + columns.length * ROW_H + 6
}

// ── TRANSFORM ──
function updateTransform() {
  viewport.setAttribute('transform', 'translate(' + panX + ',' + panY + ') scale(' + scale + ')')
  zoomText.textContent = Math.round(scale * 100) + '%'
  const next = scale <= 0.5
  if (next !== compactMode) { compactMode = next; renderTables(); renderRelations() }
}

function screenToWorld(cx, cy) {
  const r = svg.getBoundingClientRect()
  return { x: (cx - r.left - panX) / scale, y: (cy - r.top - panY) / scale }
}

function worldToScreen(wx, wy) {
  const r = svg.getBoundingClientRect()
  return { x: wx * scale + panX + r.left, y: wy * scale + panY + r.top }
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
  scale = Math.max(0.50, Math.min(Math.min(sw, sh), 1.2))
  panX = pad - minX*scale; panY = pad - minY*scale
  updateTransform()
}
window.fitAll = fitAll

function makeId(prefix, bucket) {
  let id = ''
  do { id = prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7) }
  while (bucket[id])
  return id
}

function getTableColumnIds(table) {
  const ids = table.seqColumnIds || table.columnIds || []
  table.seqColumnIds = ids; table.columnIds = ids; return ids
}

function getCenterWorldPoint() {
  const rect = svg.getBoundingClientRect()
  return screenToWorld(rect.left + rect.width/2, rect.top + rect.height/2)
}

// ── COLUMN HELPERS ──
function getColumns(table) {
  const ids = table.seqColumnIds || table.columnIds || []
  return ids.map(id => columnEntities[id]).filter(Boolean)
}
function getColumnName(col) { return col.name || col.columnName || col.fieldName || 'field' }
function getColumnType(col) { return col.dataType || col.type || col.data_type || '' }
function getColumnComment(col) { return col.comment || col.description || col.remarks || '' }

// Nullable: default true (nullable) unless explicitly set to false / notNull=true
function isColumnNullable(col) {
  if (col.nullable === false || col.notNull === true || col.not_null === true || col.required === true) return false
  if (col.nullable === true) return true
  return true // default nullable
}

function isColumnPK(col, table) {
  const name = getColumnName(col).toLowerCase()
  return col.primaryKey || col.pk || name === 'id' || name === (table.name||'').toLowerCase()+'_id'
}
function isColumnFK(colId) {
  return Object.values(relationshipEntities).some(rel => {
    const endColId = rel.end?.columnId || rel.childColumnId || rel.targetColumnId
    return endColId === colId
  })
}

function escapeHtml(v) {
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

// ── CONTEXT MENU ──
function hideCtx() { ctxMenu.style.display = 'none' }

function showCtxMenu(x, y, items) {
  ctxMenu.innerHTML = ''
  items.forEach(item => {
    if (item === '---') {
      const sep = document.createElement('div'); sep.className = 'ctx-sep'; ctxMenu.appendChild(sep); return
    }
    if (item.label && item.section) {
      const lbl = document.createElement('div'); lbl.className = 'ctx-section-label'; lbl.textContent = item.label; ctxMenu.appendChild(lbl); return
    }
    const el = document.createElement('div')
    el.className = 'ctx-item' + (item.danger ? ' danger' : '')
    el.innerHTML = '<span class="ctx-icon">' + (item.icon||'') + '</span><span>' + item.label + '</span>' + (item.hint ? '<span class="ctx-shortcut">' + item.hint + '</span>' : '')
    el.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      hideCtx()
      item.action()
    })
    ctxMenu.appendChild(el)
  })

  ctxMenu.style.display = 'block'
  // Position, avoid overflow
  const mw = ctxMenu.offsetWidth || 200
  const mh = ctxMenu.offsetHeight || 160
  ctxMenu.style.left = (x + mw > window.innerWidth ? x - mw : x) + 'px'
  ctxMenu.style.top  = (y + mh > window.innerHeight ? y - mh : y) + 'px'
}

ctxMenu.addEventListener('mousedown', e => e.stopPropagation())
ctxMenu.addEventListener('click', e => e.stopPropagation())

// ── INLINE EDITOR HELPERS ──
function hideEditor() {
  editorOverlay.style.display = 'none'
  inlineEditor.innerHTML = ''
}

function showEditor(content) {
  inlineEditor.innerHTML = ''
  content(inlineEditor)
  editorOverlay.style.display = 'block'
  // Position near center
  const W = window.innerWidth, H = window.innerHeight
  const ew = 320
  inlineEditor.style.left = ((W - ew) / 2) + 'px'
  inlineEditor.style.top  = '120px'
  inlineEditor.style.width = ew + 'px'
}

// Type autocomplete widget
function makeTypeField(container, initialValue, label) {
  const wrap = document.createElement('div')
  wrap.className = 'inline-field'
  const lbl = document.createElement('label')
  lbl.textContent = label || 'Data Type'
  wrap.appendChild(lbl)

  const combo = document.createElement('div')
  combo.className = 'type-combo'

  const input = document.createElement('input')
  input.className = 'inline-input'
  input.value = initialValue
  input.placeholder = 'e.g. VARCHAR(255)'
  input.spellcheck = false

  const dropdown = document.createElement('div')
  dropdown.className = 'type-dropdown'
  dropdown.style.display = 'none'

  let activeIdx = -1

  function renderDropdown(q) {
    const filtered = filterTypes(q)
    dropdown.innerHTML = ''
    if (!filtered.length) { dropdown.style.display = 'none'; return }
    filtered.slice(0,12).forEach((item, i) => {
      const opt = document.createElement('div')
      opt.className = 'type-opt' + (i === activeIdx ? ' active' : '')
      opt.innerHTML = item.t + '<span class="type-cat">' + item.cat + '</span>'
      opt.addEventListener('mousedown', e => { e.preventDefault(); input.value = item.t; dropdown.style.display = 'none'; })
      dropdown.appendChild(opt)
    })
    dropdown.style.display = 'block'
  }

  input.addEventListener('focus', () => renderDropdown(input.value))
  input.addEventListener('input', () => { activeIdx = -1; renderDropdown(input.value) })
  input.addEventListener('blur', () => setTimeout(() => { dropdown.style.display = 'none' }, 150))
  input.addEventListener('keydown', e => {
    const opts = dropdown.querySelectorAll('.type-opt')
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx+1, opts.length-1); opts.forEach((o,i)=>o.classList.toggle('active',i===activeIdx)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); activeIdx = Math.max(activeIdx-1, 0); opts.forEach((o,i)=>o.classList.toggle('active',i===activeIdx)) }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); input.value = opts[activeIdx].textContent.replace(/[A-Z]+$/,'').trim(); dropdown.style.display = 'none' }
    if (e.key === 'Escape') dropdown.style.display = 'none'
  })

  combo.appendChild(input)
  combo.appendChild(dropdown)
  wrap.appendChild(combo)
  container.appendChild(wrap)
  return { getValue: () => input.value, input }
}

function makeTextField(container, label, value, placeholder) {
  const wrap = document.createElement('div'); wrap.className = 'inline-field'
  const lbl = document.createElement('label'); lbl.textContent = label; wrap.appendChild(lbl)
  const input = document.createElement('input')
  input.className = 'inline-input'; input.value = value||''; input.placeholder = placeholder||''
  wrap.appendChild(input); container.appendChild(wrap)
  return { getValue: () => input.value, input }
}

function makeSelectField(container, label, value, options) {
  const wrap = document.createElement('div'); wrap.className = 'inline-field'
  const lbl = document.createElement('label'); lbl.textContent = label; wrap.appendChild(lbl)
  const select = document.createElement('select')
  select.className = 'inline-input'
  select.style.fontFamily = 'var(--font-ui)'
  options.forEach(item => {
    const opt = document.createElement('option')
    opt.value = String(item.value)
    opt.textContent = item.label
    select.appendChild(opt)
  })
  select.value = String(value)
  wrap.appendChild(select); container.appendChild(wrap)
  return { getValue: () => Number(select.value), select }
}

// ── NEW: Nullable toggle field ──
function makeNullableField(container, initialValue) {
  const togId = 'nullableToggle_' + Math.random().toString(36).slice(2)
  const row = document.createElement('div'); row.className = 'nullable-toggle-row'
  const lbl = document.createElement('label'); lbl.textContent = 'Nullable'; lbl.htmlFor = togId
  const sw = document.createElement('label'); sw.className = 'toggle-switch'
  const inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = togId; inp.checked = initialValue
  const track = document.createElement('span'); track.className = 'toggle-track'
  sw.appendChild(inp); sw.appendChild(track)
  row.appendChild(lbl); row.appendChild(sw)
  container.appendChild(row)
  return { getValue: () => inp.checked, input: inp }
}

// ── NEW: Comment field ──
function makeCommentField(container, initialValue) {
  const wrap = document.createElement('div'); wrap.className = 'inline-field'
  const lbl = document.createElement('label'); lbl.textContent = 'Comment / Description'; wrap.appendChild(lbl)
  const input = document.createElement('input')
  input.className = 'inline-input'; input.value = initialValue||''; input.placeholder = 'Optional column comment…'
  wrap.appendChild(input); container.appendChild(wrap)
  return { getValue: () => input.value, input }
}

function openSettings() {
  showEditor(container => {
    const title = document.createElement('div'); title.className = 'inline-editor-title'; title.textContent = 'Mouse Settings'; container.appendChild(title)
    const dragField = makeSelectField(container, 'Move table', mouseSettings.dragButton, BUTTON_OPTIONS)
    const panField = makeSelectField(container, 'Pan canvas', mouseSettings.panButton, BUTTON_OPTIONS)
    const menuField = makeSelectField(container, 'Open action menu', mouseSettings.menuButton, BUTTON_OPTIONS)
    makeActions(container, () => {
      saveMouseSettings({
        dragButton: dragField.getValue(),
        panButton: panField.getValue(),
        menuButton: menuField.getValue(),
      })
    }, null, 'Apply')
    setTimeout(() => dragField.select.focus(), 50)
  })
}
window.openSettings = openSettings

function makeActions(container, onConfirm, onCancel, confirmLabel) {
  const wrap = document.createElement('div'); wrap.className = 'inline-actions'
  const cancel = document.createElement('button'); cancel.className = 'inline-btn'; cancel.textContent = 'Cancel'
  cancel.addEventListener('click', () => { hideEditor(); onCancel?.() })
  const confirm = document.createElement('button'); confirm.className = 'inline-btn primary'; confirm.textContent = confirmLabel || 'Save'
  confirm.addEventListener('click', () => { hideEditor(); onConfirm() })
  wrap.appendChild(cancel); wrap.appendChild(confirm)
  container.appendChild(wrap)
}

// ── SELECT ──
function selectTable(tableId, columnId = null) {
  selectedTableId = tableId; selectedColumnId = columnId
  tablesLayer.querySelectorAll('.table-group').forEach(g => g.classList.toggle('selected', g.dataset.id === tableId))
  tablesLayer.querySelectorAll('.field-row').forEach(r => r.classList.toggle('selected', r.dataset.columnId === columnId))
}
function getSelectedTable() { return selectedTableId ? tableEntities[selectedTableId] : null }
function getSelectedColumn() { return selectedColumnId ? columnEntities[selectedColumnId] : null }

function getTableEntityKey(tableId) {
  if (!tableId) return tableId
  if (tableEntities[tableId]) return tableId

  const found = Object.entries(tableEntities).find(([, table]) => table?.id === tableId)
  return found?.[0] || tableId
}

function getTableEntity(tableId) {
  return tableEntities[getTableEntityKey(tableId)]
}

// ── CRUD ──
function createTable(worldX, worldY) {
  showEditor(container => {
    const title = document.createElement('div'); title.className = 'inline-editor-title'; title.textContent = 'New Table'; container.appendChild(title)
    const nameField = makeTextField(container, 'Table Name', '', 'e.g. users')
    makeActions(container, () => {
      const name = nameField.getValue().trim()
      if (!name) return
      pushHistory()
      const id = makeId('table', tableEntities)
      tableEntities[id] = {
        id, name,
        ui: { x: Math.round(worldX - TW/2), y: Math.round(worldY - HEAD_H/2) },
        seqColumnIds: [], columnIds: []
      }
      selectTable(id)
      renderAll()
      scheduleSave()
    })
    setTimeout(() => nameField.input.focus(), 50)
  })
}

function renameTable(tableId) {
  const key = getTableEntityKey(tableId)
  const table = tableEntities[key]; if (!table) return
  showEditor(container => {
    const title = document.createElement('div'); title.className = 'inline-editor-title'; title.textContent = 'Rename Table'; container.appendChild(title)
    const nameField = makeTextField(container, 'Name', table.name || '', 'table name')
    makeActions(container, () => {
      const name = nameField.getValue().trim()
      if (!name) return
      pushHistory()
      table.name = name
      renderAll(); selectTable(tableId); scheduleSave()
    })
    setTimeout(() => { nameField.input.focus(); nameField.input.select() }, 50)
  })
}

function deleteTable(tableId) {
  const key = getTableEntityKey(tableId)
  const table = tableEntities[key]; if (!table) return
  pushHistory()
  const columnIds = [...getTableColumnIds(table)]
  columnIds.forEach(id => delete columnEntities[id])
  Object.entries(relationshipEntities).forEach(([rid, rel]) => {
    if (relationshipUses(key, columnIds, rel) || (table.id && relationshipUses(table.id, columnIds, rel))) delete relationshipEntities[rid]
  })
  delete tableEntities[key]
  if (selectedTableId === tableId || selectedTableId === key) { selectedTableId = null; selectedColumnId = null }
  renderAll(); saveFile()
}

function addField(tableId) {
  const key = getTableEntityKey(tableId)
  const table = tableEntities[key]; if (!table) return
  showEditor(container => {
    const title = document.createElement('div'); title.className = 'inline-editor-title'; title.textContent = 'Add Field'; container.appendChild(title)
    const nameField = makeTextField(container, 'Field Name', '', 'e.g. email')
    const typeField = makeTypeField(container, 'VARCHAR(255)')
    const nullableField = makeNullableField(container, true)
    const defaultField = makeTextField(container, 'Default Value', '', 'e.g. 0 or NULL or now()')
    const commentField = makeCommentField(container, '')
    makeActions(container, () => {
      const name = nameField.getValue().trim()
      if (!name) return
      pushHistory()
      const id = makeId('column', columnEntities)
      columnEntities[id] = {
        id, name,
        dataType: typeField.getValue().trim(),
        nullable: nullableField.getValue(),
        notNull: !nullableField.getValue(),
        default: defaultField.getValue().trim(),
        comment: commentField.getValue().trim()
      }
      getTableColumnIds(table).push(id)
      renderAll(); selectTable(key, id); scheduleSave()
    })
    setTimeout(() => nameField.input.focus(), 50)
  })
}

function editField(tableId, columnId) {
  const col = columnEntities[columnId]; if (!col) return
  showEditor(container => {
    const title = document.createElement('div'); title.className = 'inline-editor-title'; title.textContent = 'Edit Field'; container.appendChild(title)
    const nameField = makeTextField(container, 'Field Name', getColumnName(col), '')
    const typeField = makeTypeField(container, getColumnType(col))
    const nullableField = makeNullableField(container, isColumnNullable(col))
    const defaultField = makeTextField(container, 'Default Value', String(col.default ?? col.defaultValue ?? col.default_value ?? ''), 'e.g. 0 or NULL')
    const commentField = makeCommentField(container, getColumnComment(col))
    makeActions(container, () => {
      pushHistory()
      col.name = nameField.getValue().trim()
      col.dataType = typeField.getValue().trim()
      col.nullable = nullableField.getValue()
      col.notNull = !nullableField.getValue()
      col.default = defaultField.getValue().trim()
      col.comment = commentField.getValue().trim()
      renderAll(); selectTable(tableId, columnId); scheduleSave()
    })
    setTimeout(() => { nameField.input.focus(); nameField.input.select() }, 50)
  })
}

function deleteField(tableId, columnId) {
  const key = getTableEntityKey(tableId)
  const table = tableEntities[key]; const col = columnEntities[columnId]; if (!table || !col) return
  pushHistory()
  const ids = getTableColumnIds(table).filter(id => id !== columnId)
  table.seqColumnIds = ids; table.columnIds = ids
  Object.entries(relationshipEntities).forEach(([rid, rel]) => {
    if (relationshipUses(key, [columnId], rel) || (table.id && relationshipUses(table.id, [columnId], rel))) delete relationshipEntities[rid]
  })
  delete columnEntities[columnId]
  if (selectedColumnId === columnId) selectedColumnId = null
  renderAll(); selectTable(key); saveFile()
}

function addRelationship(fromTableId) {
  const tableList = Object.entries(tableEntities)
    .filter(([key]) => key !== getTableEntityKey(fromTableId))
    .map(([key, table]) => ({ key, table }))
  if (!tableList.length) { alert('Need at least 2 tables to create a relationship.'); return }

  let selectedType = '1-m', selectedToId = tableList[0].key

  showEditor(container => {
    const title = document.createElement('div'); title.className = 'inline-editor-title'; title.textContent = 'Add Relationship'; container.appendChild(title)

    // From info
    const fromTable = tableEntities[fromTableId]
    const fromLbl = document.createElement('div'); fromLbl.className = 'inline-field'
    fromLbl.innerHTML = '<label>From Table</label><div style="padding:4px 8px;font-size:12px;color:var(--text0)">' + escapeHtml(fromTable?.name||fromTableId) + '</div>'
    container.appendChild(fromLbl)

    // Target table
    const toWrap = document.createElement('div'); toWrap.className = 'inline-field'
    const toLbl = document.createElement('label'); toLbl.textContent = 'To Table'; toWrap.appendChild(toLbl)
    const toSel = document.createElement('select'); toSel.className = 'inline-input'
    toSel.style.fontFamily = 'var(--font-ui)'
    tableList.forEach(({ key, table }) => {
      const opt = document.createElement('option'); opt.value = key; opt.textContent = table.name||key; toSel.appendChild(opt)
    })
    toSel.addEventListener('change', () => selectedToId = toSel.value)
    toWrap.appendChild(toSel); container.appendChild(toWrap)

    // Relation type
    const relLbl = document.createElement('div'); relLbl.className = 'inline-field'
    const relLabel = document.createElement('label'); relLabel.textContent = 'Relationship Type'; relLbl.appendChild(relLabel)
    container.appendChild(relLbl)

    const picker = document.createElement('div'); picker.className = 'rel-picker'
    const relTypes = [
      { type:'1-1', icon:'⬤—⬤', label:'1 : 1' },
      { type:'1-m', icon:'⬤—‹', label:'1 : N' },
      { type:'m-m', icon:'›—‹', label:'N : N' },
    ]
    relTypes.forEach(rt => {
      const btn = document.createElement('div')
      btn.className = 'rel-opt' + (rt.type === selectedType ? ' selected' : '')
      btn.innerHTML = '<span class="rel-icon">' + rt.icon + '</span>' + rt.label
      btn.addEventListener('click', () => {
        selectedType = rt.type
        picker.querySelectorAll('.rel-opt').forEach(b => b.classList.remove('selected'))
        btn.classList.add('selected')
      })
      picker.appendChild(btn)
    })
    container.appendChild(picker)

    makeActions(container, () => {
      pushHistory()
      const typeMap = { '1-1': 'OneToOne', '1-m': 'OneToMany', 'm-m': 'ManyToMany' }
      const id = makeId('rel', relationshipEntities)
      relationshipEntities[id] = {
        id,
        startTableId: fromTableId,
        endTableId: selectedToId,
        start: { tableId: fromTableId },
        end: { tableId: selectedToId },
        relationshipType: typeMap[selectedType]
      }
      renderAll(); scheduleSave()
    }, null, 'Add Relation')
    setTimeout(() => toSel.focus(), 50)
  })
}

// ── RENDER ALL ──
function renderAll() {
  refreshStats(); renderTables(); renderRelations()
}

// ── SVG helpers ──
function ns(tag, attrs={}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, String(v)))
  return el
}
function svgText(x, y, cls, content, extra={}) {
  const el = ns('text', {x, y, class: cls, ...extra})
  el.textContent = content; return el
}

function showFieldMenu(x, y, tableId, columnId) {
  showCtxMenu(x, y, [
    { label: 'Field', section: true },
    { icon:'Edit', label:'Edit Field', action: () => editField(tableId, columnId) },
    { icon:'Del', label:'Delete Field', danger: true, action: () => deleteField(tableId, columnId) },
  ])
}

function showTableMenu(x, y, tableId) {
  showCtxMenu(x, y, [
    { label: 'Table', section: true },
    { icon:'Name', label:'Rename Table', action: () => renameTable(tableId) },
    { icon:'Link', label:'Add Relationship', action: () => addRelationship(tableId) },
    '---',
    { label: 'Fields', section: true },
    { icon:'+', label:'Add Field', action: () => addField(tableId) },
    { icon:'Edit', label:'Edit Selected Field', action: () => { if (selectedColumnId) editField(tableId, selectedColumnId); else alert('Click a field first.') } },
    { icon:'Del', label:'Delete Selected Field', danger: true, action: () => { if (selectedColumnId) deleteField(tableId, selectedColumnId); else alert('Click a field first.') } },
    '---',
    { icon:'Del', label:'Delete Table', danger: true, action: () => deleteTable(tableId) },
  ])
}

function showCanvasMenu(x, y, world) {
  showCtxMenu(x, y, [
    { icon:'+', label:'Create New Table', hint:'here', action: () => createTable(world.x, world.y) },
    '---',
    { icon:'Fit', label:'Fit All', action: fitAll },
    { icon:'View', label:'Reset View', action: resetView },
    '---',
    { icon:'SQL', label:'Export SQL', action: exportSql },
    { icon:'', label:'Save', action: saveFile },
  ])
}

function showMenuForEvent(e) {
  const tableGroup = e.target.closest?.('.table-group')
  const row = e.target.closest?.('.field-row')
  if (row && tableGroup) {
    const tableId = tableGroup.dataset.id
    const columnId = row.dataset.columnId
    selectTable(tableId, columnId)
    showFieldMenu(e.clientX, e.clientY, tableId, columnId)
    return
  }
  if (tableGroup) {
    const tableId = tableGroup.dataset.id
    selectTable(tableId)
    showTableMenu(e.clientX, e.clientY, tableId)
    return
  }
  showCanvasMenu(e.clientX, e.clientY, screenToWorld(e.clientX, e.clientY))
}

// ── RENDER TABLES ──
function renderTables() {
  tablesLayer.innerHTML = ''
  tablePositions = {}
  const COLS_PER_ROW = Math.ceil(Math.sqrt(Math.max(tables.length, 1)))

  Object.entries(tableEntities).forEach(([id, table], index) => {
    const columns = getColumns(table)
    const width = tableWidth(), height = tableHeight(columns)
    const headerHeight = tableHeaderHeight()

    const defaultX = 40 + (index % COLS_PER_ROW) * (tableWidth() + 60)
    const defaultY = 40 + Math.floor(index / COLS_PER_ROW) * (height + 60)
    const x = table.ui?.x ?? table.x ?? defaultX
    const y = table.ui?.y ?? table.y ?? defaultY

    tablePositions[id] = {
      x, y, width, height, table,
      searchText: [table.name, ...columns.map(c => getColumnName(c)+' '+getColumnType(c)+' '+getColumnComment(c))].filter(Boolean).join(' ').toLowerCase()
    }

    const groupClasses = ['table-group', ...(compactMode ? ['compact'] : []), ...(selectedTableId === id ? ['selected'] : [])]
    const group = ns('g', {class: groupClasses.join(' '), 'data-id': id, transform: 'translate('+x+','+y+')'})

    // Shadow
    group.appendChild(ns('rect', {x:2, y:4, width, height, rx:10, fill:'rgba(0,0,0,0.4)'}))
    // Body
    group.appendChild(ns('rect', {width, height, rx:10, class:'table-bg'}))
    // Header
    group.appendChild(ns('rect', {width, height:headerHeight, rx:10, class:'table-header-bg'}))
    group.appendChild(ns('rect', {y:headerHeight-10, width, height:10, class:'table-header-bg'}))
    group.appendChild(ns('line', {x1:0, y1:headerHeight, x2:width, y2:headerHeight, stroke:'var(--border-light)', 'stroke-width':0.5}))

    // Table name (double-click to rename)
    const titleSize = compactMode ? compactTitleSize() : 13
    const titleEl = svgText(compactMode ? 24 : 14, compactMode ? Math.round(headerHeight / 2 + titleSize / 3) : 22, 'table-title', table.name || 'table')
    titleEl.style.fontSize = titleSize + 'px'
    titleEl.style.cursor = 'text'
    titleEl.addEventListener('dblclick', e => { e.stopPropagation(); renameTable(id) })
    group.appendChild(titleEl)
    if (!compactMode) group.appendChild(svgText(14, 38, 'table-subtitle', columns.length + ' columns'))

    // "+" add field hint on header (right side)
    if (!compactMode) {
      const addBtn = ns('text', {x: width - 14, y: 22, 'text-anchor': 'middle', fill: 'var(--text2)', 'font-size': '14', style: 'cursor:pointer', 'font-family': 'var(--font-ui)'})
      addBtn.textContent = '+'
      addBtn.addEventListener('click', e => { e.stopPropagation(); selectTable(id); addField(id) })
      addBtn.addEventListener('mouseenter', () => addBtn.setAttribute('fill', 'var(--accent2)'))
      addBtn.addEventListener('mouseleave', () => addBtn.setAttribute('fill', 'var(--text2)'))
      group.appendChild(addBtn)
    }

    // ── Spreadsheet-style column layout (only when not compact) ──
    if (!compactMode) {
      // ── Column header bar ──
      const hdrY = HEAD_H
      group.appendChild(ns('rect', {x:0, y:hdrY, width, height:COL_HDR_H, fill:'rgba(9,14,26,0.85)'}))
      group.appendChild(ns('line', {x1:0, y1:hdrY+COL_HDR_H, x2:width, y2:hdrY+COL_HDR_H, stroke:'var(--border)', 'stroke-width':0.5}))

      // Header labels
      const hdrTextY = hdrY + 13
      const hdrStyle = {'font-size':'9', 'font-weight':'700', 'letter-spacing':'0.08em', 'text-transform':'uppercase', 'font-family':'var(--font-ui)'}

      // Vertical column dividers in header
      const dividerCols = [CX_TYPE, CX_NULL, CX_DFLT, CX_CMT]
      dividerCols.forEach(cx => {
        group.appendChild(ns('line', {x1:cx, y1:hdrY+2, x2:cx, y2:hdrY+COL_HDR_H-2, stroke:'var(--border)', 'stroke-width':0.5}))
      })

      // Header text labels
      group.appendChild(svgText(CX_NAME + 4, hdrTextY, 'table-subtitle', 'column', hdrStyle))
      group.appendChild(svgText(CX_TYPE + 4, hdrTextY, 'table-subtitle', 'dataType', hdrStyle))
      group.appendChild(svgText(CX_NULL + 4, hdrTextY, 'table-subtitle', 'null', hdrStyle))
      group.appendChild(svgText(CX_DFLT + 4, hdrTextY, 'table-subtitle', 'default', hdrStyle))
      group.appendChild(svgText(CX_CMT  + 4, hdrTextY, 'table-subtitle', 'comment', hdrStyle))

      // ── Data rows ──
      const rowsStartY = HEAD_H + COL_HDR_H

      columns.forEach((col, i) => {
        const cy = rowsStartY + i * ROW_H
        const colId = (table.seqColumnIds || table.columnIds || [])[i]
        const isPK = isColumnPK(col, table)
        const isFK = !isPK && isColumnFK(colId)
        const nullable = isColumnNullable(col)
        const comment = getColumnComment(col)
        const defaultVal = col.default ?? col.defaultValue ?? col.default_value ?? ''
        const textY = cy + ROW_H - 7   // baseline inside 22px row

        const rowGroup = ns('g', {
          class: selectedColumnId === colId ? 'field-row selected' : 'field-row',
          'data-column-id': colId
        })

        // Row bg (alternating)
        rowGroup.appendChild(ns('rect', {
          class:'field-row-bg', x:0, y:cy, width, height:ROW_H,
          fill: i%2===0 ? 'rgba(26,34,54,0)' : 'rgba(10,15,28,0.55)'
        }))

        // Row separator line
        rowGroup.appendChild(ns('line', {
          x1:0, y1:cy+ROW_H, x2:width, y2:cy+ROW_H,
          stroke:'var(--border)', 'stroke-width':0.3, opacity:'0.4'
        }))

        // Vertical column dividers (matching header)
        dividerCols.forEach(cx => {
          rowGroup.appendChild(ns('line', {
            x1:cx, y1:cy+3, x2:cx, y2:cy+ROW_H-3,
            stroke:'var(--border)', 'stroke-width':0.35, opacity:'0.5'
          }))
        })

        // ── Badge column (PK key icon or FK or dot) ──
        if (isPK) {
          // Key icon — small 🔑 substitute using SVG rect+line
          const bx = 8, by = cy + 5
          // key ring
          rowGroup.appendChild(ns('circle', {cx: bx+5, cy: by+5, r:'4', fill:'none', stroke:'var(--pk)', 'stroke-width':'1.5'}))
          // key shaft
          rowGroup.appendChild(ns('rect', {x:bx+7, y:by+5, width:10, height:2, rx:1, fill:'var(--pk)'}))
          rowGroup.appendChild(ns('rect', {x:bx+13, y:by+7, width:2, height:3, rx:1, fill:'var(--pk)'}))
          rowGroup.appendChild(ns('rect', {x:bx+16, y:by+7, width:2, height:3, rx:1, fill:'var(--pk)'}))
        } else if (isFK) {
          rowGroup.appendChild(ns('rect', {x:8, y:cy+5, width:16, height:12, rx:2, fill:'rgba(96,165,250,0.1)', stroke:'rgba(96,165,250,0.3)', 'stroke-width':'1'}))
          rowGroup.appendChild(svgText(16, cy+14, 'col-fk-text', 'FK', {'text-anchor':'middle'}))
        } else {
          rowGroup.appendChild(ns('circle', {cx:16, cy:cy+11, r:2, fill:'var(--border-light)'}))
        }

        // ── column name ──
        rowGroup.appendChild(svgText(CX_NAME + 4, textY, 'col-name', getColumnName(col), {'clip-path': null}))

        // ── data type ──
        const typeStr = getColumnType(col) || ''
        rowGroup.appendChild(svgText(CX_TYPE + 4, textY, 'col-type-text', typeStr))

        // ── nullable — clickable toggle ──
        const nullLabel = nullable ? 'NULL' : 'N-N'
        const nullCls   = nullable ? 'col-nullable-text' : 'col-notnull-text'
        const nullEl = svgText(CX_NULL + 4, textY, nullCls, nullLabel)
        nullEl.style.cursor = 'pointer'
        nullEl.setAttribute('title', nullable ? 'Click to set NOT NULL' : 'Click to set NULL')
        nullEl.addEventListener('click', e => {
          e.stopPropagation()
          pushHistory()
          col.nullable = !nullable
          col.notNull = nullable
          renderAll(); selectTable(id, colId); scheduleSave()
        })
        nullEl.addEventListener('mouseenter', () => nullEl.setAttribute('opacity','0.65'))
        nullEl.addEventListener('mouseleave', () => nullEl.setAttribute('opacity','1'))
        rowGroup.appendChild(nullEl)

        // ── default value ──
        const dfltStr = String(defaultVal ?? '').trim()
        if (dfltStr) {
          rowGroup.appendChild(svgText(CX_DFLT + 4, textY, 'col-type-text', dfltStr))
        } else {
          rowGroup.appendChild(svgText(CX_DFLT + 4, textY, 'col-comment-text', 'default'))
        }

        // ── comment (stretches to end, truncated) ──
        if (comment) {
          const maxChars = Math.floor((width - CX_CMT - 8) / 6.2)
          const cmtTrunc = comment.length > maxChars ? comment.slice(0, maxChars - 1) + '…' : comment
          rowGroup.appendChild(svgText(CX_CMT + 4, textY, 'col-comment-text', cmtTrunc))
        }

        // ── mouse events ──
        rowGroup.addEventListener('mousedown', e => { e.stopPropagation(); selectTable(id, colId) })
        rowGroup.addEventListener('dblclick', e => { e.stopPropagation(); selectTable(id, colId); editField(id, colId) })
        rowGroup.addEventListener('contextmenu', e => {
          e.preventDefault(); e.stopPropagation()
          if (mouseSettings.menuButton !== 2) return
          selectTable(id, colId)
          showCtxMenu(e.clientX, e.clientY, [
            { label: 'Field', section: true },
            { icon:'✎', label:'Edit Field', action: () => editField(id, colId) },
            { icon:'✕', label:'Delete Field', danger: true, action: () => deleteField(id, colId) },
          ])
        })

        group.appendChild(rowGroup)
      })

      // Double-click on empty zone at bottom → add field
      const emptyZoneY = rowsStartY + columns.length * ROW_H
      const emptyZone = ns('rect', {x:0, y:emptyZoneY, width, height:10, fill:'transparent', style:'cursor:copy'})
      emptyZone.addEventListener('dblclick', e => { e.stopPropagation(); selectTable(id); addField(id) })
      group.appendChild(emptyZone)
    }

    // Right-click on table
    group.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation()
      if (mouseSettings.menuButton !== 2) return
      selectTable(id)
      showCtxMenu(e.clientX, e.clientY, [
        { label: 'Table', section: true },
        { icon:'✏️', label:'Rename Table', action: () => renameTable(id) },
        { icon:'🔗', label:'Add Relationship', action: () => addRelationship(id) },
        '---',
        { label: 'Fields', section: true },
        { icon:'＋', label:'Add Field', action: () => addField(id) },
        { icon:'✎', label:'Edit Selected Field', action: () => { if (selectedColumnId) editField(id, selectedColumnId); else alert('Click a field first.') } },
        { icon:'✕', label:'Delete Selected Field', danger: true, action: () => { if (selectedColumnId) deleteField(id, selectedColumnId); else alert('Click a field first.') } },
        '---',
        { icon:'🗑', label:'Delete Table', danger: true, action: () => deleteTable(id) },
      ])
    })

    // Click to select
    group.addEventListener('mousedown', e => { if (!spaceDown && e.button===0) selectTable(id) })

    tablesLayer.appendChild(group)
  })

  renderSidebar()
  updateSearch()
}

// ── CANVAS RIGHT-CLICK (empty area) ──
canvasWrap.addEventListener('contextmenu', e => {
  // If we clicked on a table group, the table handler fires; here we handle canvas
  if (e.target.closest('.table-group')) return
  e.preventDefault()
  if (mouseSettings.menuButton !== 2) return
  const world = screenToWorld(e.clientX, e.clientY)
  showCtxMenu(e.clientX, e.clientY, [
    { icon:'＋', label:'Create New Table', hint:'here', action: () => createTable(world.x, world.y) },
    '---',
    { icon:'⊞', label:'Fit All', action: fitAll },
    { icon:'⟳', label:'Reset View', action: resetView },
    '---',
    { icon:'', label:'Save', action: saveFile },
  ])
})

document.addEventListener('mousedown', e => {
  if (mouseSettings.menuButton === 2 || e.button !== mouseSettings.menuButton) return
  if (!canvasWrap.contains(e.target)) return
  e.preventDefault()
  e.stopPropagation()
  showMenuForEvent(e)
}, true)

// Close menus on outside click
document.addEventListener('click', e => {
  if (ctxMenu.contains(e.target)) return
  if (!ctxMenu.contains(e.target)) hideCtx()
  if (e.target.closest('.toolbar')) return
  if (editorOverlay.style.display !== 'none' && !inlineEditor.contains(e.target) && !e.target.closest('.table-group')) hideEditor()
})
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideCtx(); hideEditor() }
})

// ── SIDEBAR ──
function renderSidebar() {
  sidebarBody.innerHTML = ''
  Object.entries(tableEntities).forEach(([tableId, table]) => {
    const columns = getColumns(table)
    const tableDiv = document.createElement('div'); tableDiv.className = 'sb-table'
    const head = document.createElement('div')
    head.className = 'sb-table-head' + (selectedTableId === tableId ? ' active' : '')
    head.innerHTML = '<div class="sb-table-icon">T</div><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(table.name||'table') + '</span><span class="sb-arrow">▶</span>'

    const cols = document.createElement('div'); cols.className = 'sb-columns'

    columns.forEach((col, i) => {
      const colId = (table.seqColumnIds || table.columnIds || [])[i]
      const isPK = isColumnPK(col, table)
      const isFK = !isPK && isColumnFK(colId)
      const div = document.createElement('div'); div.className = 'sb-col'
      const type = isPK ? 'pk' : isFK ? 'fk' : 'col'
      const label = isPK ? 'PK' : isFK ? 'FK' : '·'
      if (selectedColumnId === colId) div.style.color = 'var(--accent2)'
      const nullTag = isColumnNullable(col) ? '<span style="color:var(--purple);font-size:9px;margin-left:2px">NULL</span>' : '<span style="color:var(--rose);font-size:9px;margin-left:2px">NN</span>'
      div.innerHTML = '<span class="col-badge '+type+'">'+label+'</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escapeHtml(getColumnName(col))+'</span>' + nullTag + '<span class="col-type">'+escapeHtml(getColumnType(col))+'</span>'
      div.addEventListener('click', e => { e.stopPropagation(); selectTable(tableId, colId); focusTable(tableId) })
      cols.appendChild(div)
    })

    head.addEventListener('click', () => {
      const isOpen = head.classList.toggle('open')
      cols.classList.toggle('open', isOpen)
      if (isOpen) { selectTable(tableId); focusTable(tableId) }
    })

    tableDiv.appendChild(head); tableDiv.appendChild(cols); sidebarBody.appendChild(tableDiv)
  })
}

// ── SEARCH ──
function getTableGroup(id) { return Array.from(tablesLayer.querySelectorAll('.table-group')).find(g => g.dataset.id === id) }
function clearSearchClasses() { tablesLayer.querySelectorAll('.table-group').forEach(g => g.classList.remove('search-hit','search-active')) }
function updateSearchStatus() { searchStatus.textContent = searchMatches.length ? (activeSearchIndex+1)+'/'+searchMatches.length : '0/0' }

function focusTable(id) {
  const pos = tablePositions[id]; if (!pos) return
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
  const q = searchInput.value.trim().toLowerCase(); clearSearchClasses()
  if (!q) { searchMatches=[]; activeSearchIndex=-1; updateSearchStatus(); return }
  searchMatches = Object.entries(tablePositions).filter(([,p])=>p.searchText.includes(q)).map(([id])=>id)
  activateSearchMatch(0)
}

function nextSearchMatch(delta) {
  if (!searchMatches.length) { updateSearch(); return }
  activateSearchMatch(activeSearchIndex+delta)
}

searchInput.addEventListener('input', updateSearch)
searchInput.addEventListener('keydown', e => {
  if (e.key==='Enter') { e.preventDefault(); nextSearchMatch(e.shiftKey?-1:1) }
  if (e.key==='Escape') { searchInput.value=''; updateSearch() }
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
  return {
    startTableId: getTableEntityKey(startTableId),
    endTableId: getTableEntityKey(endTableId)
  }
}

function relationshipUses(tableId, columnIds, rel) {
  const key = getTableEntityKey(tableId)
  const table = tableEntities[key]
  const possibleTableIds = [key, tableId, table?.id].filter(Boolean)
  const ep = getRelationEndpoints(rel)
  if (possibleTableIds.includes(ep.startTableId) || possibleTableIds.includes(ep.endTableId)) return true
  const relCols = [rel.start?.columnId, rel.end?.columnId, rel.parentColumnId, rel.sourceColumnId,
    rel.fromColumnId, rel.childColumnId, rel.targetColumnId, rel.toColumnId].filter(Boolean)
  return relCols.some(id => columnIds.includes(id))
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
function getFallbackDirections(from, to) {
  const fc={x:from.x+from.width/2, y:from.y+from.height/2}, tc={x:to.x+to.width/2, y:to.y+to.height/2}
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
  const px=asNumber(rp?.x), py=asNumber(rp?.y)
  let x=pos.x+pos.width/2, y=pos.y+pos.height/2
  if (dir==='left'||dir==='right') {
    x = dir==='left' ? pos.x : pos.x+pos.width
    if(py!==null) y=pos.y+clamp(py-origin.y, 20, pos.height-16)
  } else {
    y = dir==='top' ? pos.y : pos.y+pos.height
    if(px!==null) x=pos.x+clamp(px-origin.x, 20, pos.width-20)
  }
  return {x,y,direction:dir,vector:vec}
}
function addVec(pt, dist) { return {x:pt.x+pt.vector.x*dist, y:pt.y+pt.vector.y*dist} }

function getRelationCardinalities(rel) {
  const rt = typeof rel.relationshipType==='string' ? rel.relationshipType.toLowerCase().replace(/[^a-z0-9*]+/g,'') : ''
  if (rt==='manytomany'||rt==='nn'||rt==='**') return {type:'m-m',start:{optional:true,many:true},end:{optional:true,many:true}}
  if (rt==='onetomany'||rt==='1n'||rt==='1*') return {type:'1-m',start:{optional:false,many:false},end:{optional:true,many:true}}
  if (rt==='onetoone'||rt==='11') return {type:'1-1',start:{optional:false,many:false},end:{optional:false,many:false}}
  const endV=asNumber(rel.relationshipType??rel.endRelationshipType??rel.endCardinality)
  if (endV===16) return {type:'1-m',start:{optional:false,many:false},end:{optional:false,many:true}}
  if (endV===4)  return {type:'1-m',start:{optional:false,many:false},end:{optional:true,many:true}}
  if (endV===8)  return {type:'1-1',start:{optional:false,many:false},end:{optional:false,many:false}}
  return {type:'1-m',start:{optional:false,many:false},end:{optional:true,many:true}}
}

function getRelationPath(sa, ea) {
  const s=addVec(sa,28), e=addVec(ea,28)
  const sh=sa.direction==='left'||sa.direction==='right'
  const eh=ea.direction==='left'||ea.direction==='right'
  if(sh&&eh) { const mx=(s.x+e.x)/2; return 'M'+s.x+' '+s.y+' L'+mx+' '+s.y+' L'+mx+' '+e.y+' L'+e.x+' '+e.y }
  if(!sh&&!eh) { const my=(s.y+e.y)/2; return 'M'+s.x+' '+s.y+' L'+s.x+' '+my+' L'+e.x+' '+my+' L'+e.x+' '+e.y }
  return 'M'+s.x+' '+s.y+' L'+e.x+' '+s.y+' L'+e.x+' '+e.y
}

function drawMarker(anchor, cardinality, color) {
  const g = ns('g', {class:'rel-marker', stroke:color})
  const v=anchor.vector, perp={x:-v.y, y:v.x}

  if (cardinality.optional) {
    const center=addVec(anchor,9)
    g.appendChild(ns('circle', {class:'rel-ring', cx:String(center.x), cy:String(center.y), r:'4', stroke:color, 'stroke-width':'1.5', fill:'var(--bg0)'}))
  } else {
    const center=addVec(anchor,8)
    g.appendChild(ns('line', {x1:String(center.x-perp.x*6),y1:String(center.y-perp.y*6),x2:String(center.x+perp.x*6),y2:String(center.y+perp.y*6),stroke:color,'stroke-width':'1.8','stroke-linecap':'round'}))
  }

  if (cardinality.many) {
    const base=addVec(anchor,16), tip=addVec(anchor,28)
    g.appendChild(ns('line',{x1:String(base.x),y1:String(base.y),x2:String(tip.x),y2:String(tip.y),stroke:color,'stroke-width':'1.5','stroke-linecap':'round'}))
    g.appendChild(ns('line',{x1:String(base.x),y1:String(base.y),x2:String(tip.x+perp.x*8),y2:String(tip.y+perp.y*8),stroke:color,'stroke-width':'1.5','stroke-linecap':'round'}))
    g.appendChild(ns('line',{x1:String(base.x),y1:String(base.y),x2:String(tip.x-perp.x*8),y2:String(tip.y-perp.y*8),stroke:color,'stroke-width':'1.5','stroke-linecap':'round'}))
  } else {
    const center=addVec(anchor,20)
    g.appendChild(ns('line',{x1:String(center.x-perp.x*6),y1:String(center.y-perp.y*6),x2:String(center.x+perp.x*6),y2:String(center.y+perp.y*6),stroke:color,'stroke-width':'1.8','stroke-linecap':'round'}))
  }

  return g
}

function renderRelations() {
  relationsLayer.innerHTML = ''
  Object.values(relationshipEntities).forEach(rel => {
    const {startTableId,endTableId} = getRelationEndpoints(rel)
    const from=tablePositions[startTableId], to=tablePositions[endTableId]
    if (!from||!to) return
    const fd=getFallbackDirections(from,to)
    const sa=getAnchor(from,rel.start,fd.start), ea=getAnchor(to,rel.end,fd.end)
    const car=getRelationCardinalities(rel)
    const colorMap={'1-1':'var(--rel-1-1)','1-m':'var(--rel-1-m)','m-m':'var(--rel-m-m)'}
    const color=colorMap[car.type]||'var(--rel-1-m)'
    relationsLayer.appendChild(ns('path',{d:getRelationPath(sa,ea),stroke:color,'stroke-width':'1.5',fill:'none',opacity:'0.75'}))
    relationsLayer.appendChild(drawMarker(sa,car.start,color))
    relationsLayer.appendChild(drawMarker(ea,car.end,color))
  })
}

// ── PAN/DRAG ──
svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX,e.clientY,e.deltaY<0?1.1:0.91) }, {passive:false})

window.addEventListener('keydown', e => {
  const typingTarget = ['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z' && !typingTarget) {
    e.preventDefault()
    if (e.shiftKey) redoChange()
    else undoChange()
    return
  }
  if ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f') { e.preventDefault(); searchInput.focus(); searchInput.select(); return }
  if (e.target===searchInput) return
  if (e.code==='Space') { spaceDown=true; e.preventDefault() }
})
window.addEventListener('keyup', e => { if(e.code==='Space') spaceDown=false })

svg.addEventListener('mousedown', e => {
  const tg = e.target.closest?.('.table-group')
  if (tg && !spaceDown && e.button===mouseSettings.dragButton) {
    dragTable=tg; didMoveTable=false
    pushHistory(); dragHistoryStarted=true
    const id=tg.dataset.id
    const w=screenToWorld(e.clientX,e.clientY)
    startMouse=w; startPan={x:tablePositions[id].x,y:tablePositions[id].y}; return
  }
  if (e.button===mouseSettings.panButton || (spaceDown && e.button===0)) {
    isPanning=true; canvasWrap.classList.add('panning')
    startMouse={x:e.clientX,y:e.clientY}; startPan={x:panX,y:panY}; e.preventDefault()
  }
})

window.addEventListener('mousemove', e => {
  if (dragTable) {
    const id=dragTable.dataset.id, w=screenToWorld(e.clientX,e.clientY)
    tablePositions[id].x=startPan.x+w.x-startMouse.x
    tablePositions[id].y=startPan.y+w.y-startMouse.y
    didMoveTable=true
    const table=tablePositions[id].table
    table.ui=table.ui||{}
    table.ui.x=Math.round(tablePositions[id].x)
    table.ui.y=Math.round(tablePositions[id].y)
    dragTable.setAttribute('transform','translate('+tablePositions[id].x+','+tablePositions[id].y+')')
    renderRelations(); return
  }
  if (isPanning) {
    panX=startPan.x+(e.clientX-startMouse.x)
    panY=startPan.y+(e.clientY-startMouse.y)
    updateTransform()
  }
})

window.addEventListener('mouseup', () => {
  if (dragTable && didMoveTable) scheduleSave()
  if (dragTable && !didMoveTable && dragHistoryStarted) { undoStack.pop(); updateHistoryButtons() }
  isPanning=false; dragTable=null; didMoveTable=false
  dragHistoryStarted=false
  canvasWrap.classList.remove('panning')
})

svg.addEventListener('auxclick', e => e.preventDefault())

// ── INIT ──
refreshStats()
updateHint()
updateHistoryButtons()
renderTables()
renderRelations()
setTimeout(fitAll, 50)
</script>
</body>
</html>`;
}