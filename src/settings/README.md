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

### 2. Areas

There are no boxes. Notes live in fixed areas (strict Zettelkasten): `fleeting.folder` (`inbox`),
`literature.folder` (`reference`), `zettel.defaultFolder` (`slipbox`, flat: zettels, structure notes and
`Index.md`) and `projects.folder` (`projects`). Old `boxes` settings are migrated on load (`migrateToSlipBox`).

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
    console.log('Slip-box:', this.settingsManager.getZettel().defaultFolder)
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
const zettelSettings = settingsManager.getZettel()
const commandSettings = settingsManager.getCommands()

// Check command enabled state
const isEnabled = settingsManager.isCommandEnabled('create-zettel-note')
```

### Updating Settings

```typescript
// Update entire section
await settingsManager.updateZettel({
  defaultFolder: 'my-slip-box',
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
await settingsManager.resetSection('zettel')
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

  zettel: {
    defaultFolder: 'slipbox',
    template: PERMANENT_TEMPLATE,
    autoLinkToParent: true,
    openOnCreate: true,
  },

  // ... etc
}
```

## Settings Migration

`load()` runs `migrateToSlipBox` on the raw data before merging it with the defaults (boxes and tag/link zettel detection become the flat slip-box folder), then `migrate()` for version bumps. Compare versions with `compareSemver`, never as strings (`'0.1.10' < '0.1.4'` is true):

```typescript
private async migrate(): Promise<void> {
  const currentVersion = this.settings.version
  let needsSave = false

  if (compareSemver(currentVersion ?? '0.0.0', '0.1.4') < 0) {
    this.settings.version = '0.1.4'
    needsSave = true
  }

  if (needsSave) await this.save()
}
```

### Adding New Migrations

When you release a new version with breaking changes:

1. Update `DEFAULT_SETTINGS.version`
2. Add a `compareSemver(currentVersion ?? '0.0.0', '<version>') < 0` block in `migrate()`, or a raw-data step next to `migrateToSlipBox` when an old key is renamed or removed
3. Add a test in `SettingsManager.test.ts` with the old settings data

## Settings Tab

`SettingsTab` is declarative: it has no `display()`. Obsidian renders the items returned by `getSettingDefinitions()` (groups, sub-pages, toggles, text fields, actions), and reads and writes values through two hooks keyed by dotted paths such as `zettel.defaultFolder`:

```typescript
getControlValue(key: string): unknown {
  return this.plugin.getSettingsManager().getPath(key)
}

async setControlValue(key: string, value: unknown): Promise<void> {
  // emptied text fields fall back to the default
  await this.plugin.getSettingsManager().setPath(key, next)
  this.refreshDomState()
}
```

To add a setting, add its default in `DefaultSettings.ts`, its type in `src/base/settings.ts`, and an item with that `key` in the matching page of `getSettingDefinitions()`.

## Best Practices

### 1. Always Use Getters

```typescript
// ✅ Good - returns copy
const zettel = settingsManager.getZettel()

// ❌ Bad - direct access
const zettel = settingsManager['settings'].zettel
```

### 2. Update Then Save

```typescript
// ✅ Good - update methods auto-save
await settingsManager.updateZettel({ defaultFolder: 'new-folder' })

// ❌ Bad - manual modification
settingsManager.settings.zettel.defaultFolder = 'new-folder'
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
await settings.updateZettel({ defaultFolder: 'test-folder' })
console.log(settings.getZettel())

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
