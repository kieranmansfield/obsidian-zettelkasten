# Settings Architecture

This directory contains the settings system for the Obsidian Zettelkasten plugin.

## Overview

The settings system follows a clean, modular architecture:

1. **PluginSettings.ts** - Type definitions and defaults
2. **SettingsManager.ts** - Settings business logic
3. **SettingsTab.ts** - UI layer (to be implemented)

## Architecture Principles

- **Type Safety**: All settings are fully typed with TypeScript interfaces
- **Deep Merge**: Settings are merged with defaults to handle missing values
- **Migration Support**: Built-in version-based migration system
- **Separation of Concerns**: Settings logic separate from UI
- **Immutability**: Getters return copies, not references

## File Structure

```
src/settings/
├── README.md                # This file
├── PluginSettings.ts        # Settings interfaces and defaults
├── SettingsManager.ts       # Settings management logic
└── SettingsTab.ts           # Settings UI (to be implemented)
```

## Settings Structure

The plugin settings are organized into logical sections:

### 1. Command Settings

```typescript
commands: {
  enabledCommands: Record<string, boolean>
}
```

Controls which commands are available in the command palette.

### 2. Box Settings

```typescript
boxes: {
  rootFolder: string          // Root folder for all boxes (default: "zettels")
  defaultBox: string          // Default box for new zettels
  autoCreateBoxes: boolean    // Auto-create boxes when referenced
}
```

Configures box/folder management.

### 3. Note Type Settings

Each note type (zettel, fleeting, index, literature) has its own settings:

```typescript
zettel: {
  defaultFolder: string         // Folder for zettel notes
  template: string              // Template content
  filenameFormat: FilenameFormat // Filename format mode
  separator: string             // Separator between ID and title
  autoLinkToParent: boolean     // Auto-link child to parent
  openOnCreate: boolean         // Open in editor after creation
}
```

**Filename Format Modes:**

- `FilenameFormat.ID_ONLY` - Pure ZettelId (e.g., `20240612153000000a1b2.md`)
- `FilenameFormat.ID_TITLE` - ZettelId + separator + title (e.g., `20240612153000000a1b2 ⁝ My Note.md`)

**Custom Separator:**

- Default: `⁝` (tricolon character)
- Can be customized to any string (e.g., ` - `, ` | `, etc.)

Similar structure for `fleeting`, `index`, and `literature` (except they don't have filename format options).

## Using SettingsManager

### In main.ts

```typescript
export default class ZettelkastenPlugin extends Plugin {
  private settingsManager!: SettingsManager

  async onload() {
    // Load settings
    await this.loadSettings()

    // Use settings
    const boxSettings = this.settingsManager.getBoxes()
    console.log('Root folder:', boxSettings.rootFolder)
  }

  private async loadSettings(): Promise<void> {
    this.settingsManager = new SettingsManager(this)
    await this.settingsManager.load()
  }
}
```

### Reading Settings

```typescript
// Get all settings
const allSettings = settingsManager.getAll()

// Get specific section
const boxSettings = settingsManager.getBoxes()
const zettelSettings = settingsManager.getZettel()
const commandSettings = settingsManager.getCommands()

// Check command enabled state
const isEnabled = settingsManager.isCommandEnabled('create-zettel-note')
```

### Updating Settings

```typescript
// Update entire section
await settingsManager.updateBoxes({
  rootFolder: 'my-zettels',
  defaultBox: 'inbox',
})

// Update single command
await settingsManager.enableCommand('create-zettel-note')
await settingsManager.disableCommand('create-fleeting-note')

// Update zettel settings
await settingsManager.updateZettel({
  template: '# {{title}}\n\nTags: \n\n',
  openOnCreate: false,
  filenameFormat: FilenameFormat.ID_ONLY, // Pure ID mode
  separator: ' - ', // Custom separator
})
```

### Resetting Settings

```typescript
// Reset all settings to defaults
await settingsManager.resetToDefaults()

// Reset specific section
await settingsManager.resetSection('commands')
await settingsManager.resetSection('boxes')
```

### Import/Export

```typescript
// Export settings as JSON
const json = settingsManager.export()

// Import settings from JSON
await settingsManager.import(jsonString)
```

## Default Settings

All default values are defined in `DEFAULT_SETTINGS`:

```typescript
export const DEFAULT_SETTINGS: PluginSettings = {
  version: '0.1.4',

  commands: {
    enabledCommands: {},
  },

  boxes: {
    rootFolder: 'zettels',
    defaultBox: '',
    autoCreateBoxes: true,
  },

  zettel: {
    defaultFolder: '',
    template: '# {{title}}\n\n',
    autoLinkToParent: true,
    openOnCreate: true,
  },

  // ... etc
}
```

## Settings Migration

The SettingsManager automatically handles migrations between versions:

```typescript
private async migrate(): Promise<void> {
  const currentVersion = this.settings.version

  // Example migration from v0.1.3 to v0.1.4
  if (currentVersion < '0.1.4') {
    console.log('Migrating settings to v0.1.4')

    // Perform migration
    // e.g., rename fields, transform data, etc.

    this.settings.version = '0.1.4'
    await this.save()
  }

  // Add more migrations as needed
}
```

### Adding New Migrations

When you release a new version with breaking changes:

1. Update `DEFAULT_SETTINGS.version`
2. Add migration logic in `migrate()` method
3. Test with old settings data

Example:

```typescript
if (currentVersion < '0.2.0') {
  // Rename field
  if (this.settings.boxes.folder) {
    this.settings.boxes.rootFolder = this.settings.boxes.folder
    delete (this.settings.boxes as any).folder
  }

  this.settings.version = '0.2.0'
  needsSave = true
}
```

## Settings Tab Implementation (To Do)

When implementing the settings UI, follow this pattern:

```typescript
import { App, PluginSettingTab, Setting } from 'obsidian'
import type ZettelkastenPlugin from '../main'

export class SettingsTab extends PluginSettingTab {
  plugin: ZettelkastenPlugin

  constructor(app: App, plugin: ZettelkastenPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    const settings = this.plugin.getSettingsManager()

    // Box Settings Section
    containerEl.createEl('h2', { text: 'Box Settings' })

    new Setting(containerEl)
      .setName('Root Folder')
      .setDesc('Root folder for all boxes')
      .addText((text) => {
        text
          .setValue(settings.getBoxes().rootFolder)
          .onChange(async (value) => {
            await settings.updateBoxes({ rootFolder: value })
          })
      })

    // Add more settings...
  }
}
```

## Best Practices

### 1. Always Use Getters

```typescript
// ✅ Good - returns copy
const boxes = settingsManager.getBoxes()

// ❌ Bad - direct access
const boxes = settingsManager['settings'].boxes
```

### 2. Update Then Save

```typescript
// ✅ Good - update methods auto-save
await settingsManager.updateBoxes({ rootFolder: 'new-folder' })

// ❌ Bad - manual modification
settingsManager.settings.boxes.rootFolder = 'new-folder'
```

### 3. Use Type-Safe Methods

```typescript
// ✅ Good - type-safe
await settingsManager.updateZettel({
  template: '# {{title}}\n\n',
  openOnCreate: true,
})

// ❌ Bad - bypasses type safety
await settingsManager['settings'].zettel = { ... }
```

### 4. Handle Migrations

```typescript
// ✅ Good - version-based migration
if (currentVersion < '0.2.0') {
  // Migrate data
  this.settings.version = '0.2.0'
}

// ❌ Bad - no version check
this.settings.newField = 'value'
```

## Filename Formats

Zettel notes support two filename format modes:

### ID Only Mode (`FilenameFormat.ID_ONLY`)

Filenames contain only the ZettelId:

- Example: `20240612153000000a1b2.md`
- Title is stored in frontmatter/content, not filename
- Cleaner file tree
- Prevents filename length issues
- Better for automatic processing

### ID + Title Mode (`FilenameFormat.ID_TITLE`)

Filenames contain ZettelId + separator + title:

- Example: `20240612153000000a1b2 ⁝ My Note Title.md`
- Default separator: `⁝` (tricolon)
- Title visible in file explorer
- Better for human browsing
- Quick visual identification

### Custom Separators

You can customize the separator between ID and title:

```typescript
await settingsManager.updateZettel({
  separator: ' - '  // Use dash
})
// Result: 20240612153000000a1b2 - My Note Title.md

await settingsManager.updateZettel({
  separator: ' | '  // Use pipe
})
// Result: 20240612153000000a1b2 | My Note Title.md

await settingsManager.updateZettel({
  separator: ' ⁝ '  // Default tricolon
})
// Result: 20240612153000000a1b2 ⁝ My Note Title.md
```

**Note:** When renaming a note in ID_ONLY mode, the filename doesn't change (title updates in content/frontmatter instead).

## Template Variables

Settings templates support these variables:

- `{{title}}` - Note title
- `{{date}}` - Current date (to be implemented)
- `{{time}}` - Current time (to be implemented)
- `{{zettelId}}` - Zettel ID (to be implemented)

Example template:

```markdown
# {{title}}

Created: {{date}} {{time}}
Tags:

## Content

```

## Testing Settings

```typescript
// In developer console
const plugin = app.plugins.plugins['obsidian-zettelkasten']
const settings = plugin.getSettingsManager()

// View all settings
console.log(settings.getAll())

// Test updates
await settings.updateBoxes({ rootFolder: 'test-folder' })
console.log(settings.getBoxes())

// Test export
console.log(settings.export())

// Test reset
await settings.resetToDefaults()
```

## Future Enhancements

Potential improvements:

- **Settings Profiles**: Multiple setting configurations
- **Settings Sync**: Sync via Obsidian Sync or custom solution
- **Settings Validation**: Validate settings before save
- **Settings Events**: Emit events when settings change
- **Settings Presets**: Common configurations for different workflows
