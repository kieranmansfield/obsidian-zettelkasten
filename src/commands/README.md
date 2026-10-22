# Command Architecture

This directory contains the modular command system for the Obsidian Zettelkasten plugin.

## Architecture Overview

The command system follows these principles:

1. **Single Responsibility**: Each command lives in its own file
2. **Type Safety**: All commands use TypeScript interfaces
3. **Dependency Injection**: Commands receive dependencies via `CommandContext`
4. **Registry Pattern**: Commands are registered centrally via `CommandRegistry`
5. **Scalability**: Adding new commands is as simple as creating a new file

## File Structure

```
src/commands/
├── README.md                    # This file
├── CommandRegistry.ts           # Central registry for all commands
├── index.ts                     # Exports all commands
├── createZettelNote.ts          # Command: Create new zettel
├── createFleetingNote.ts        # Command: Create fleeting note
├── createIndexNote.ts           # Command: Create index note
├── createLiteratureNote.ts      # Command: Create literature note
```

## How to Add a New Command

### Step 1: Create the Command File

Create a new file in `src/commands/` (e.g., `myNewCommand.ts`):

```typescript
import type { CommandFactory } from '../base/command'

export const myNewCommand: CommandFactory = (context) => {
  return {
    id: 'my-new-command',
    name: 'My New Command',
    icon: 'star', // Obsidian icon name

    execute: async () => {
      // Access services from context
      const { zettelNote, app } = context

      // Your command logic here
      console.log('Executing my new command!')
    },
  }
}
```

### Step 2: Export from index.ts

Add your command to `allCommands` in `src/commands/index.ts`; `main.ts` registers that list:

```typescript
import { myNewCommand } from './myNewCommand'

export const allCommands: CommandFactory[] = [
  // ... existing commands ...
  myNewCommand,
]
```

That's it! Your command is now registered and available in Obsidian's command palette.

## Command Context

Commands receive a `CommandContext` object with access to:

- `app`: Obsidian App instance
- `fileService`: File operations service
- `zettelNote`: Zettel note handler
- `fleetingNote`: Fleeting note handler
- `indexNote`: Index note handler
- `literatureNote`: Literature note handler

To add new services to the context, update:

1. `src/base/command.ts` - Add to `CommandContext` interface
2. `src/main.ts` - Add to context object in `registerCommands()`

## Command Options

Commands can use all Obsidian command options:

```typescript
return {
  id: 'unique-command-id',
  name: 'Display Name',
  icon: 'lucide-icon-name',

  // Optional: Keyboard shortcuts
  hotkeys: [{ modifiers: ['Mod'], key: 'k' }],

  // Optional: Editor-specific callback
  editorCallback: (editor, view) => {
    // Called with active editor
  },

  // Optional: Conditional execution
  checkCallback: (checking) => {
    if (checking) return true // Can execute?
    // Execute logic
  },

  execute: async () => {
    // Standard execution
  },
}
```

## Benefits of This Architecture

### ✅ Maintainability

- Each command is isolated and easy to understand
- Changes to one command don't affect others
- Clear separation of concerns

### ✅ Testability

- Commands are pure functions that can be unit tested
- Dependencies are injected, making mocking easy
- No hidden global state

### ✅ Scalability

- Adding commands doesn't bloat `main.ts`
- Commands can be organized by feature
- Easy to refactor or remove commands

### ✅ Type Safety

- Full TypeScript support with strict mode
- CommandContext ensures correct dependencies
- Compile-time error checking

## Example: Complete Command

```typescript
import type { CommandFactory } from '../base/command'
import { activeZettel, openZettel } from '../base/sequenceEdit'

/**
 * Command: Previous Sibling
 *
 * Opens the previous sibling of the active zettel
 */
export const previousSiblingCommand: CommandFactory = (context) => {
  return {
    id: 'previous-sibling',
    name: 'Previous Sibling',
    icon: 'arrow-left',

    execute: async () => {
      const active = activeZettel(context) // tells the user when there is none
      if (!active) return
      const prev = context.noteSequenceService.adjacent(active.file, -1)
      await openZettel(context, prev, 'Navigated to previous sibling', 'Already at first sibling')
    },
  }
}
```

Every service in `CommandContext` is always present; commands need no null checks. Commands default to enabled; users switch them off in Settings → Manage commands. A thrown error or rejected promise from `execute` is logged by the registry.

## Dynamic Command Management

Commands can be enabled/disabled dynamically based on settings:

### Command Metadata

Each command includes metadata for settings integration:

```typescript
metadata: {
  category: 'note-creation',           // Groups commands in settings UI
  description: 'Create a new zettel',  // Shown in settings
}
```

### Enabling/Disabling Commands

```typescript
// In settings or plugin code
plugin.enableCommand('create-zettel-note')
plugin.disableCommand('create-fleeting-note')

// Every registered command, by ID
const commands = plugin.getCommandRegistry().getAllCommands()
```

### Settings Integration

Enabled state lives in `settings.commands.enabledCommands` and is managed by `SettingsManager`:

- On load, `main.ts` passes `settingsManager.getEnabledCommandsMap()` to `registry.registerAll()`.
- `plugin.enableCommand(id)` / `plugin.disableCommand(id)` update the registry and save the setting.
- Settings → Manage commands (`CommandsModal`) shows a toggle per command, grouped by category.

### Command Categories

Commands are organized by category:

- **`note-creation`**: Commands for creating notes (zettel, fleeting, index, literature)
- **`navigation`**: Commands for navigating between notes
- **`uncategorized`**: Commands without a category

### Important Notes

Disabling a command calls `Plugin.removeCommand()` (Obsidian 1.7.2+), so it leaves the command palette straight away; enabling adds it back. No reload needed.

## Future Enhancements

Potential improvements to the command system:

- **Command Groups**: Organize commands by feature area ✅ (Implemented via categories)
- **Middleware**: Add hooks for logging, analytics, etc.
- **Dynamic Commands**: Generate commands based on data
- **Command Palette Filters**: Custom filtering logic
- **Undo/Redo**: Command pattern for undo support
