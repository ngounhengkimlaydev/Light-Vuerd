# Light Vuerd

Light Vuerd is a lightweight VS Code extension for viewing and editing Vuerd ERD JSON files directly inside VS Code.

It opens `.json` / `.vuerd.json` files in an interactive ERD panel with draggable tables, dashed relationship lines, SQL type suggestions, search, zoom, pan, and simple CRUD actions for tables and fields.

## Preview

![Light Vuerd ERD panel](images/screenshot.png)

> You can replace `images/screenshot.png` with your own screen image before publishing. Keep the image inside the repository so it shows correctly on the VS Code Marketplace.

## Features

- Open Vuerd ERD JSON files from the VS Code Explorer context menu.
- View tables, columns, primary keys, foreign keys, and relationships in a dark ERD canvas.
- Create, rename, move, and delete tables.
- Add, edit, and delete fields.
- Double-click to edit table and field names quickly.
- Auto-save edits when the inline editor loses focus.
- Use SQL type suggestions for MySQL, MariaDB, PostgreSQL, SQLite, and SQL Server.
- Create one-to-one, one-to-many, and many-to-many relationships.
- Display relationships with dashed lines and cardinality markers.
- Search tables and fields with `Ctrl+F`.
- Zoom, pan, fit all tables, and reset the view.
- Show table names only when zoomed out to 50% or below for easier overview.

## Requirements

- VS Code `1.90.0` or newer.
- A Vuerd-compatible ERD JSON file, usually `.vuerd.json` or `.json`.

## How To Use

### Open An ERD File

1. Open your project in VS Code.
2. In the Explorer, right-click a `.json` or `.vuerd.json` file.
3. Select `Light Vuerd: Open ERD`.
4. The ERD opens in a new interactive panel.

### Move Around The Diagram

| Action | How to use |
| --- | --- |
| Zoom in or out | Mouse wheel or toolbar zoom buttons |
| Pan canvas | Middle mouse drag or hold `Space` and drag |
| Move a table | Left-click and drag the table |
| Fit all tables | Click `Fit` in the toolbar |
| Reset view | Click the reset button in the toolbar |
| Compact overview | Zoom out to `50%` or lower |

### Create And Edit Tables

| Action | How to use |
| --- | --- |
| Create table | Right-click empty canvas space, then choose `Create New Table` |
| Rename table | Double-click the table name |
| Add field to table | Double-click the empty body area of a table |
| Open table actions | Right-click a table |
| Delete table | Right-click a table, then choose `Delete Table` |

When creating or renaming a table, type the name in the inline editor. The change saves automatically when you finish editing.

### Create And Edit Fields

| Action | How to use |
| --- | --- |
| Add field | Double-click the table body, or right-click a table and choose `Add Field` |
| Edit field | Double-click a field row |
| Open field actions | Right-click a field row |
| Delete field | Right-click a field row, then choose `Delete Field` |
| Choose field type | Use the SQL type suggestion list in the inline editor |

The SQL type list changes based on the selected database dialect in the toolbar.

### Choose SQL Dialect

Use the database selector in the toolbar to choose:

- MySQL
- MariaDB
- PostgreSQL
- SQLite
- SQL Server

The selected dialect controls the field type suggestions when adding or editing a field.

### Create Relationships

1. Right-click a table.
2. Choose `Add Relationship`.
3. Select the target table.
4. Pick the relationship type:
   - `1 : 1` for one-to-one
   - `1 : N` for one-to-many
   - `N : N` for many-to-many
5. Confirm to create the relationship.

Relationships are shown as dashed lines with markers so the relationship type is easier to read.

### Search Tables And Fields

Press `Ctrl+F` inside the ERD panel and type a table name, field name, or field type.

| Action | Shortcut |
| --- | --- |
| Search | `Ctrl+F` |
| Next result | `Enter` |
| Previous result | `Shift+Enter` |
| Clear search / close editor | `Esc` |

Search results are highlighted on the canvas and the active result is focused automatically.

## Saving

Light Vuerd saves changes back to the opened ERD JSON file.

- Table and field edits auto-save after editing.
- Delete table and delete field actions save immediately.
- You can also click `Save` in the toolbar.

