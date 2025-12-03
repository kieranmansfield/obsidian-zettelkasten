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
└── openBoxPalette.ts            # Command: Open box selection palette
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

Add your command to `src/commands/index.ts`:

```typescript
export { myNewCommand } from './myNewCommand'
```

### Step 3: Register in main.ts

Add your command to the registry in `src/main.ts`:

```typescript
private registerCommands(): void {
  // ... existing code ...

  this.commandRegistry
    .add(commands.createZettelNoteCommand)
    .add(commands.myNewCommand)  // Add here
    .registerAll()
}
```

That's it! Your command is now registered and available in Obsidian's command palette.

## Command Context

Commands receive a `CommandContext` object with access to:

- `app`: Obsidian App instance
- `fileService`: File operations service
- `boxService`: Box management service
- `boxManager`: High-level box orchestration
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

/**
 * Command: Create Child Zettel
 *
 * Creates a new zettel as a child of the currently active zettel
 */
export const createChildZettelCommand: CommandFactory = (context) => {
  return {
    id: 'create-child-zettel',
    name: 'Create Child Zettel',
    icon: 'file-plus-2',

    editorCallback: async (editor, view) => {
      const { zettelNote } = context

      // Get current file
      const file = view.file
      if (!file) return

      // Extract parent ZettelId from filename
      const [parentId] = file.basename.split(' ')

      // Create child zettel
      const result = await zettelNote.createChild(
        ZettelId.parse(parentId),
        {
          title: 'Child Note',
          content: `# Child Note\n\nParent: [[${file.basename}]]\n\n`,
        }
      )

      console.log('Created child zettel:', result)
    },
  }
}
```

## Dynamic Command Management

Commands can be enabled/disabled dynamically based on settings:

### Command Metadata

Each command includes metadata for settings integration:

```typescript
metadata: {
  category: 'note-creation',           // Groups commands in settings UI
  description: 'Create a new zettel',  // Shown in settings
  canBeDisabled: true,                 // Can users disable this?
  enabledByDefault: true,              // Initial state
}
```

### Enabling/Disabling Commands

```typescript
// In settings or plugin code
plugin.enableCommand('create-zettel-note')
plugin.disableCommand('create-fleeting-note')

// Access the registry
const registry = plugin.getCommandRegistry()

// Check command state
if (registry.isCommandEnabled('create-zettel-note')) {
  // Command is active
}

// Get commands by category
const creationCommands = registry.getCommandsByCategory()
  .get('note-creation')
```

### Settings Integration

When implementing settings:

1. **Read enabled state on load:**

```typescript
private getEnabledCommandsFromSettings(): Map<string, boolean> {
  return new Map(Object.entries(this.settings.enabledCommands))
}
```

2. **Save when changed:**

```typescript
public enableCommand(commandId: string): void {
  this.commandRegistry.enableCommand(commandId)
  this.settings.enabledCommands[commandId] = true
  await this.saveSettings()
}
```

3. **Settings UI can use:**

```typescript
const registry = plugin.getCommandRegistry()
const categories = registry.getCommandsByCategory()

// Display toggles for each command
for (const [category, commands] of categories) {
  // Render category header
  for (const command of commands) {
    if (command.metadata?.canBeDisabled) {
      // Render toggle for command
    }
  }
}
```

### Command Categories

Commands are organized by category:

- **`note-creation`**: Commands for creating notes (zettel, fleeting, index, literature)
- **`box-management`**: Commands for managing boxes (open palette, create box, etc.)
- **`navigation`**: Commands for navigating between notes
- **`uncategorized`**: Commands without a category

### Important Notes

⚠️ **Obsidian Limitation**: Obsidian doesn't provide a way to unregister commands at runtime. When you disable a command, it's marked as disabled but requires a plugin reload to fully remove it from the command palette.

The CommandRegistry handles this gracefully:

- Disabled commands are tracked
- On next plugin load, disabled commands won't be registered
- Settings persist across reloads

## Future Enhancements

Potential improvements to the command system:

- **Command Groups**: Organize commands by feature area ✅ (Implemented via categories)
- **Middleware**: Add hooks for logging, analytics, etc.
- **Dynamic Commands**: Generate commands based on data
- **Command Palette Filters**: Custom filtering logic
- **Undo/Redo**: Command pattern for undo support
- **Hot Reload**: Reload commands without full plugin restart (when Obsidian API supports it)
