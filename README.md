# Light Vuerd

Light Vuerd is a lightweight VS Code extension for viewing Vuerd ERD JSON files directly inside VS Code.

It opens `.json` / `.vuerd.json` files in an interactive ERD panel with draggable tables, zooming, panning, table search, and dashed relationship lines with cardinality markers.

## Features

- Open ERD JSON files from the VS Code Explorer context menu.
- View tables and columns in a dark interactive canvas.
- Drag tables to adjust the layout.
- Right-click empty canvas space to create a new table.
- Right-click tables or fields to open edit actions.
- Double-click a table name to rename it.
- Double-click a table body to add a field.
- Double-click a field to edit it with SQL type suggestions.
- Auto-save table and field edits when the editor loses focus.
- Pick SQL type suggestions for MySQL, MariaDB, PostgreSQL, SQLite, or SQL Server.
- Create relationships as one-to-one, one-to-many, or many-to-many.
- Zoom with the mouse wheel or toolbar buttons.
- Show table names only when zoomed out to 50% or below.
- Pan with middle mouse or Space + drag.
- Search tables and columns with `Ctrl+F`.
- Navigate search results with `Enter` and `Shift+Enter`.
- Render relationship cardinality using one, optional, and many markers.
- Use dashed relationship lines for clearer visual separation.

## Image

![Light Vuerd](images/screenshot.png)

## Usage

1. Open a workspace in VS Code.
2. Right-click a Vuerd JSON file in the Explorer.
3. Select `Light Vuerd: Open ERD`.
4. Use the toolbar or mouse controls to inspect the diagram.

## Keyboard And Mouse Controls

| Action | Control |
| --- | --- |
| Search table or column | `Ctrl+F` |
| Next search result | `Enter` |
| Previous search result | `Shift+Enter` |
| Clear search | `Esc` |
| Create table | Right-click empty canvas |
| Rename table | Double-click table name |
| Add field | Double-click table body |
| Edit field | Double-click field |
| More table/field actions | Right-click table or field |
| Zoom | Mouse wheel |
| Compact table-name view | Zoom to 50% or below |
| Pan | Middle mouse drag or Space + drag |
| Move table | Left mouse drag |
| Reset view | Toolbar `Reset` button |
| Save edited ERD JSON | Auto-save on edit blur or toolbar `Save` button |
