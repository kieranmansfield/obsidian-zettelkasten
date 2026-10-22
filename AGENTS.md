# Obsidian Zettelkasten Plugin

The Obsidian Zettelkasten plugin provides a powerful system for managing and creating atomic notes ("zettels") within Obsidian, leveraging a unique ZettelId engine for note identification, TypeScript for type safety (`strict: true` enabled), and a modular command system. This document outlines the core architecture, key components, and best practices for interacting with and extending the plugin, including guidance for autonomous agents.

## Key Directories

The project is structured primarily under `src/` for all source code, organized as follows:

```
src/
├─ base/           # This is where interfaces and types are defined. Also any helper functions that cannot fit into a class or a service file can live here.
├─ core/           # NoteCore: the kinds of note and how they are created
├─ service/        # Services for managing files, note sequences, etc.
├─ ui/             # Modals, palettes, and other UI components
├─ commands/       # Modular command definitions
├─ settings/       # Plugin settings and settings tab
├─ main.ts         # Plugin entry point and initialization
```

## Standards - TypeScript and Strict Typing

- The project uses **TypeScript** with `"strict": true` enabled.
- All classes, services, and utilities are fully typed.
- This ensures type safety, predictable behavior, and minimizes runtime errors.
- Interfaces and types are used extensively for Notes, ZettelIds and Files.
- The `obsidian` type definitions track `latest`: `pnpm dev`, `pnpm build` and `pnpm test` run `pnpm types` (`pnpm update obsidian`) first. Check new APIs against `minAppVersion` in `manifest.json`.

## ZettelId Engine

At the heart of the plugin is the **ZettelId system**, which generates unique identifiers for zettels based on a timestamp combined with alternating letter and number segments. This scheme provides both chronological ordering and human-readable uniqueness.

- **Format:** a 17-digit timestamp `YYYYMMDDHHmmssSSS` followed by segments alternating between letters (`a-z`) and numbers (`0-9`), starting with letters, for example:  
  `20240612153000123a1b2`
- **Hierarchy:** the parent has the same timestamp and one segment fewer (`…123a1` → `…123a`); a child has exactly one more segment.
- **Order:** segment by segment, numbers by value and letters in bijective base 26 (`a`…`z`, `aa`). Never compare IDs as strings: `a10` is a sibling of `a1` and sorts after `a9`. Use `src/base/zettelIdOrder.ts`.
- **Unique per vault:** new IDs and sequence moves check every zettel in the vault, not just one folder.
- **Vault config for the zettelkasten skill:** `"id_regex": "\\d{17}(?:[a-z]+|\\d+)*"`, `"sequence": "folgezettel"`, `"areas": {"slipbox": "slipbox"}`.

- **Purpose:**
  - Ensures unique and sortable IDs for each zettel.
  - Supports easy parsing and validation within the system.
  - Enables child and sibling zettel relationships.

---

## Core Architecture

### Core Layer (`core/`)

- `NoteCore`: one class for every kind of note. `noteKinds()` builds the zettel, fleeting, structure and literature kinds; each differs in its filename, content and settings. `create(title)` loads the template, creates the file, stamps the detection marker and opens it.
- Sequence trees (`buildSequence`, `findChildren`, `findRoots`) are pure functions in `src/base/noteSequence.ts`.
- ID parsing, generation and ordering live in `src/base/zettelIdOrder.ts`.

### Service Layer (`service/`)

- Handles interactions with Obsidian’s vault:
  - `FileService` (creating, renaming, reading notes, loading templates)
  - `NoteSequenceService`: parent, children, siblings, adjacent sibling or sequence, and whole sequences. A sequence lives in the zettel's folder (and below), so timestamped notes in other areas never join it.
- Services encapsulate business logic and vault operations.

### UI Layer (`ui/`)

- Contains all modals, palettes, and suggesters:
  - Create note modals
  - Bookmark modals
- Provides user interaction while relying on services for data operations.

### Commands Layer (`commands/`)

- Modular commands are registered centrally in `main.ts`.
- Commands are small, stable entry points to invoke actions:
  - `Create Zettel Note`
  - `Create Fleeting Note`
  - `Create Structure Note` (id `create-index-note`)
  - `Open Index`
- Commands allow both user and agent interaction.

### Settings Layer (`settings/`)

- `PluginSettings` defines configuration options.
- `SettingsTab` exposes them in Obsidian’s UI.
- Includes configurable defaults for the areas: `inbox`, `reference`, `slipbox`, `projects`.

---

## File Management

- **File creation helpers** ensure consistent filenames, frontmatter, and default tags.
- **FileService** manages vault operations using Obsidian APIs (`TFile`, `TFolder`, `Vault`).
- **Create Zettel** always files zettels into the one flat slip-box folder (`zettel.defaultFolder`).
- Folder names do **not** use underscores; default folder is configurable.

---

## Zettelkasten Structure

The plugin enforces the strict Zettelkasten layout (see the `obsidian-zettelkasten` skill):

- **Areas**: `inbox/` (fleeting, one capture place), `reference/` (literature notes), `slipbox/` (flat: permanent notes, structure notes, `Index.md`), `projects/<project>/`.
- **No boxes**: topic folders inside the slip-box and category tags are not supported (removed in favour of one flat slip-box).
- **No type tags on permanent notes**: zettel detection is folder or property only; legacy tag/link settings migrate to folder.
- **Structure notes** (settings key `index`, command `create-index-note`) are `<ID> <topic>` notes marked `type: structure` in the slip-box.
- **Index**: a single `Index.md` in the slip-box, opened or created by `open-index`.
- **Templates** follow the skill's note formats; `{{title}}` and `{{date}}` are filled on creation.

---

## Agent Interaction Guidelines

Agents (automated scripts or AI assistants) interacting with this plugin should follow these principles:

- **Use Stable Command IDs:** Invoke commands by registered IDs to ensure compatibility across plugin versions.
- **Respect ZettelId Format:** Always conform to the timestamp + segment format.
- **Leverage File Helpers:** Use service methods instead of directly manipulating the vault.
- **Avoid Side Effects:** Do not delete or overwrite files without explicit user confirmation.
- **Work Within Vault Boundaries:** All operations are confined to the user’s vault.

---

## Extending the Plugin

Developers and agents can extend functionality:

- **Add Commands:** Create new commands under `commands/` and register them in `main.ts`.
- **Custom UI:** Add modals or views in `ui/`.
- **Enhance Metadata:** Extend `Zettel` interface and frontmatter for additional fields.
- **Utility Functions:** Place reusable helpers in a `utils/` directory.
- **Maintain Type Safety:** Update TypeScript interfaces and types as needed.

---

## Summary

The plugin is designed around a **strictly typed TypeScript architecture**, modular services, and a clear separation of concerns:

- Core classes define notes and IDs.
- Services manage files and note sequences.
- UI and commands provide user interaction.
- Agents should interact via stable, typed APIs to ensure reliability.

This structure ensures a maintainable, extensible, and agent-friendly Zettelkasten workflow within Obsidian.
