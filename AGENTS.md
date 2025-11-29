# Obsidian Zettelkasten Plugin - Architecture & Development Guide

## 1. Project Overview

- **Target:** Obsidian Community Plugin (TypeScript → bundled JavaScript)
- **Entry point:** `main.ts` → compiled to `main.js` and loaded by Obsidian
- **Release artifacts:** `main.js`, `manifest.json`, optional `styles.css`
- **Purpose:** Provide a clean, modular Zettelkasten plugin with fully testable core logic, service orchestration, and UI components
- **Layers:** Core, Services, UI, Commands (see Architecture section)

---

## 2. Environment & Tooling

- **Node.js:** LTS recommended (18+)
- **Package manager:** npm (defined in `package.json`)
- **Bundler:** esbuild (Rollup/webpack alternatives acceptable)
- **Types:** Obsidian type definitions
- **Linting:** ESLint recommended, e.g., `eslint ./src/`

**Scripts:**

```bash
npm install
npm run dev       # Watch mode
npm run build     # Production build
```

---

## 3. File & Folder Conventions

- Source in `src/`, main plugin logic minimal in `main.ts`
- Organize code across multiple files:

```
src/
  main.ts           # Plugin entry point, lifecycle management
  settings/         # Settings interfaces, defaults, tab UI
  commands/         # Command implementations
  ui/               # Modals, views, panels
  services/         # Orchestration layer (bridge core → Obsidian)
  core/             # Pure domain logic (Zettel nodes, navigation, reorder, logging)
  types/            # TypeScript interfaces/types
  utils/            # Helpers/constants
```

- Avoid committing build artifacts (`node_modules/`, `main.js`, `dist/`)

---

## 4. Manifest Rules (`manifest.json`)

- Must include: `id`, `name`, `version` (SemVer), `minAppVersion`, `description`, `isDesktopOnly`
- Optional: `author`, `authorUrl`, `fundingUrl`
- Do **not change `id`** after release
- Keep `minAppVersion` accurate
- Canonical validation: [Obsidian validate-plugin-entry.yml](https://github.com/obsidianmd/obsidian-releases/blob/master/.github/workflows/validate-plugin-entry.yml)

---

## 5. Testing & Deployment

- Manual install for testing: copy `main.js`, `manifest.json`, `styles.css` (if any) to:

```
<Vault>/.obsidian/plugins/<plugin-id>/
```

- Reload Obsidian and enable plugin in **Settings → Community plugins**
- Verify commands appear and settings persist
- Mobile considerations: avoid desktop-only APIs unless `isDesktopOnly` is true

---

## 6. Commands & Settings

- Commands registered via `this.addCommand(...)`
- Provide a settings tab with sensible defaults
- Persist settings using `this.loadData()` / `this.saveData()`
- Use stable IDs; avoid renaming once released

**Common tasks:**

```ts
this.addCommand({
  id: 'your-command-id',
  name: 'Do the thing',
  callback: () => this.doTheThing(),
})
```

```ts
async onload() {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  await this.saveData(this.settings);
}
```

```ts
this.registerEvent(
  this.app.workspace.on('file-open', (f) => {
    /* ... */
  })
)
this.registerDomEvent(window, 'resize', () => {
  /* ... */
})
this.registerInterval(
  window.setInterval(() => {
    /* ... */
  }, 1000)
)
```

---

## 7. Security, Privacy & Compliance

- Default to local/offline operation
- Explicit opt-in for analytics or network calls
- Do not transmit vault contents without consent
- No hidden telemetry
- Avoid deceptive UI patterns, ads, or spam
- Clean up DOM, app, interval listeners on unload

---

## 8. Performance

- Keep startup light; defer heavy work
- Batch disk access; debounce expensive operations
- Avoid large in-memory structures
- Test memory and storage on mobile

---

## 9. Coding Conventions

- TypeScript `"strict": true`
- Keep `main.ts` minimal (plugin lifecycle only)
- Split files >200-300 lines
- Each file: single responsibility
- Prefer `async/await`; handle errors gracefully
- Use clear module boundaries
- Avoid Node/Electron APIs for mobile compatibility

---

## 10. Plugin Architecture

### 10.1 Layers Overview

| Layer    | Responsibility                                                        |
| -------- | --------------------------------------------------------------------- |
| Core     | Pure domain logic (ZettelNode, ZettelId, Reorder, Navigation, Logger) |
| Services | Orchestrates core logic, interacts with vault/plugin APIs             |
| UI       | Modals, views, panels; delegates logic to services                    |
| Commands | Registers commands, calls services, minimal logic                     |

### 10.2 Core Layer (`src/core/`)

- **Zettel** (`src/core/zettel/`):
  - `ZettelId.ts` – Immutable note IDs
  - `ZettelNode.ts` – Tree node
  - `ZettelTree.ts` – Tree build/compaction
  - `ZettelLogManager.ts` – pure logging
  - `ReorderEngine.ts` – pure immutable reorder engine
- **Navigation** (`src/core/navigation/`):
  - `ContextNavigator.ts` – tree traversal (parent, children, siblings, root, ancestry)
- **Logger** (`src/core/logger/`):
  - `UndoManager.ts` – undo/redo management

**Principles:** Pure functions, no Obsidian API, immutable where possible

### 10.3 Services Layer (`src/services/`)

- **Orchestration & API layer**
- Services:
  - `ZettelService.ts` – core operations on notes
  - `FileCreator.ts` – create files in vault
  - `BoxManager.ts` – manage box definitions
  - `PersistentLoggerService.ts` – persistence + logging
  - `ReorderService.ts` – integrates ReorderEngine with UndoManager
  - `NavigationService.ts` – integrates ContextNavigator with Obsidian file operations

**Responsibilities:** Core logic orchestration, vault access, service API for commands/UI

### 10.4 UI Layer (`src/ui/`)

- **Modals & Panels**
  - `LogViewerModal.ts` – view logs
  - `BookmarkModal.ts` – bookmark creation (depends on BookmarkService)
  - `BoxCommandPaletteModal.ts` – search box commands
  - Suggesters: `FileSuggest.ts`, `FolderSuggest.ts`, `TagSuggest.ts`

**Principles:** UI only, delegates to services, no core logic

### 10.5 Commands Layer (`src/commands/`)

- Thin wrappers for Obsidian commands
- Examples:
  - `CreateZettelCommand.ts`
  - `CreateChildCommand.ts`
  - `CreateSiblingCommand.ts`
  - `NavigateCommand.ts`
  - `InspectCommand.ts`

**Principle:** Commands call services, contain minimal logic

---

## 11. Clean Architecture Principles

1. **Separation of Concerns**
   - Core: domain only
   - Services: orchestration + API
   - UI: presentation
   - Commands: user triggers
2. **Dependency Flow**
   - Core ← Services ← Commands/UI
3. **Testability**
   - Core: pure, testable independently
   - Services: mockable vault/app
4. **Immutability**
   - Core objects immutable where feasible
   - ReorderEngine pure
5. **Extensibility**
   - Core logic reusable
   - UI/services decoupled
   - New commands/services plug in cleanly

---

## 12. Common Tasks & Examples

- Organize code across multiple files
- Create commands with unique IDs
- Persist settings with `loadData`/`saveData`
- Register DOM/events safely
- Use async/await with proper error handling

---

## 13. Additional Notes from Obsidian Sample Plugin

- Keep plugin lifecycle methods (`onload`, `onunload`) clean and minimal
- Use `this.registerView()` to register custom views and panels
- Use `this.addSettingTab()` to add plugin settings UI
- Use `this.registerDomEvent()` and `this.registerInterval()` to manage event listeners and timers safely
- Always clean up resources on unload to prevent memory leaks or dangling listeners
- Use `this.app.workspace` API to interact with Obsidian workspace and leaves
- Use `this.app.vault` API for file system operations
- Use stable command IDs and names for user discoverability and consistency
- Follow Obsidian plugin guidelines and developer policies strictly to ensure compatibility and user trust

---

## 14. References

- Obsidian sample plugin: [GitHub](https://github.com/obsidianmd/obsidian-sample-plugin)
- API documentation: [Docs](https://docs.obsidian.md)
- Developer policies: [Policies](https://docs.obsidian.md/Developer+policies)
- Plugin guidelines: [Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- Style guide: [Style](https://help.obsidian.md/style-guide)
