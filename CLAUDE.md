# Obsidian Zettelaksten Plugin

The Obsidian Zettelkasten plugin provides a powerful system for managing and creating atomic notes ("zettels") within Obsidian, leveraging a unique ZettelId engine for note identification, TypeScript for type safety (`strict: true` enabled), and a modular command system. This document outlines the core architecture, key components, and best practices for interacting with and extending the plugin, including guidance for autonomous agents.

## Key Directories

The project is structured primarily under `src/` for all source code, organized as follows:

```
src/
├─ base/           # This is where interfaces and types are definied. Also any helper functions that cannot fit into a class or a service file can live here.
├─ core/           # Core logic and abstract/base classes (e.g., NoteCore, ZettelNote, ZettelId)
├─ service/        # Services for managing files, boxes, indexing, etc.
├─ ui/             # Modals, palettes, and other UI components
├─ commands/       # Modular command definitions
├─ settings/       # Plugin settings and settings tab
├─ main.ts         # Plugin entry point and initialization
```

## Standards - TypeScript and Strict Typing

- The project uses **TypeScript** with `"strict": true` enabled.
- All classes, services, and utilities are fully typed.
- This ensures type safety, predictable behavior, and minimizes runtime errors.
- Interfaces and types are used extensively for Notes, ZettelIds, Files, and Boxes.

## ZettelId Engine

At the heart of the plugin is the **ZettelId system**, which generates unique identifiers for zettels based on a timestamp combined with alternating letter and number segments. This scheme provides both chronological ordering and human-readable uniqueness.

- **Format:** The ZettelId consists of a timestamp portion (e.g., `20240612T1530`) followed by segments alternating between letters (`a-z`) and numbers (`0-9`), for example:  
  `20240612T1530a1b2`

- **Purpose:**
  - Ensures unique and sortable IDs for each zettel.
  - Supports easy parsing and validation within the system.
  - Enables child and sibling zettel relationships.

---

## Core Architecture

### Core Layer (`core/`)

- Contains base and concrete classes:
  - `NoteCore` (abstract base for all notes)
  - `ZettelNote`, `FleetingNote`, `IndexNote` (concrete note classes)
  - `ZettelId` (ID generation and parsing)
  - `BoxManager` (high-level box orchestration)
- Core classes define building blocks that services and UI components can leverage.

### Service Layer (`service/`)

- Handles interactions with Obsidian’s vault:
  - `FileService` (creating, renaming, reading, deleting notes)
  - `BoxService` (managing folders/tags for boxes)
  - Additional services like indexing or fleeting notes are included here.
- Services encapsulate business logic and vault operations.

### UI Layer (`ui/`)

- Contains all modals, palettes, and suggesters:
  - Create note modals
  - Box selection modals
  - Bookmark modals
- Provides user interaction while relying on services for data operations.

### Commands Layer (`commands/`)

- Modular commands are registered centrally in `main.ts`.
- Commands are small, stable entry points to invoke actions:
  - `Create Zettel Note`
  - `Create Fleeting Note`
  - `Create Index Note`
  - `Open Box Palette`
- Commands allow both user and agent interaction.

### Settings Layer (`settings/`)

- `PluginSettings` defines configuration options.
- `SettingsTab` exposes them in Obsidian’s UI.
- Includes configurable defaults such as the root folder for boxes (`zettels` by default).

---

## File Management

- **File creation helpers** ensure consistent filenames, frontmatter, and default tags.
- **FileService** manages vault operations using Obsidian APIs (`TFile`, `TFolder`, `Vault`).
- **ZettelNote** integrates with `BoxManager` to resolve folder paths for notes automatically.
- Folder names do **not** use underscores; default folder is configurable.

---

## Box Management

- Boxes represent organizational units for zettels and can be **folders** or **tags**.
- `BoxService` handles creation, listing, and folder/tag normalization.
- `BoxManager` orchestrates boxes, delegates folder creation to `BoxService`, and provides default folder fallback.

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
- Services manage files and boxes.
- UI and commands provide user interaction.
- Agents should interact via stable, typed APIs to ensure reliability.

This structure ensures a maintainable, extensible, and agent-friendly Zettelkasten workflow within Obsidian.
