# Settings Integration Guide

This guide explains how to integrate the command system with plugin settings.

## Overview

The command system now supports:

- ✅ Dynamic enable/disable of commands
- ✅ Command metadata for settings UI
- ✅ Category-based organization
- ✅ Persistence across plugin reloads
- ✅ Public API for settings integration

## For Settings Implementers

When you implement the settings system, follow these steps:

### 1. Add Settings Interface

```typescript
// src/settings/PluginSettings.ts
export interface PluginSettings {
  // ... other settings ...

  // Map of command ID to enabled state
  enabledCommands: Record<string, boolean>
}

export const DEFAULT_SETTINGS: PluginSettings = {
  // ... other defaults ...
  enabledCommands: {}, // Empty = use command defaults
}
```

### 2. Load Settings in main.ts

```typescript
// src/main.ts
export default class ZettelkastenPlugin extends Plugin {
  settings!: PluginSettings

  async onload() {
    // Load settings
    await this.loadSettings()

    // ... initialize services ...

    // Register commands with settings
    this.registerCommands()
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}
```

### 3. Update getEnabledCommandsFromSettings

```typescript
// Replace the TODO in main.ts
private getEnabledCommandsFromSettings(): Map<string, boolean> {
  return new Map(Object.entries(this.settings.enabledCommands))
}
```

### 4. Update enable/disable methods

```typescript
public async enableCommand(commandId: string): Promise<void> {
  this.commandRegistry.enableCommand(commandId)
  this.settings.enabledCommands[commandId] = true
  await this.saveSettings()
}

public async disableCommand(commandId: string): Promise<void> {
  this.commandRegistry.disableCommand(commandId)
  this.settings.enabledCommands[commandId] = false
  await this.saveSettings()

  // Inform user that reload is required
  new Notice('Plugin reload required for command changes to take effect')
}
```

### 5. Create Settings UI

```typescript
// src/settings/SettingsTab.ts
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

    // ... other settings ...

    // Command settings section
    this.displayCommandSettings(containerEl)
  }

  private displayCommandSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h2', { text: 'Commands' })

    const registry = this.plugin.getCommandRegistry()
    const categories = registry.getCommandsByCategory()

    for (const [category, commands] of categories) {
      // Category header
      containerEl.createEl('h3', {
        text: this.formatCategoryName(category),
        cls: 'setting-item-heading',
      })

      // Commands in this category
      for (const command of commands) {
        // Skip commands that can't be disabled
        if (command.metadata?.canBeDisabled === false) {
          continue
        }

        new Setting(containerEl)
          .setName(command.name)
          .setDesc(command.metadata?.description ?? '')
          .addToggle((toggle) => {
            toggle.setValue(registry.isCommandEnabled(command.id)).onChange(async (enabled) => {
              if (enabled) {
                await this.plugin.enableCommand(command.id)
              } else {
                await this.plugin.disableCommand(command.id)
              }
            })
          })
      }
    }
  }

  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}
```

## Command Categories

Current categories:

- `note-creation` - Commands for creating different note types
- `box-management` - Commands for managing boxes
- `navigation` - Commands for navigating (to be added)
- `uncategorized` - Fallback for commands without category

## Example: Complete Settings Flow

```typescript
// 1. User opens settings
// 2. Settings UI shows all commands grouped by category
// 3. User toggles a command off
// 4. Plugin calls: plugin.disableCommand('create-fleeting-note')
// 5. Registry marks command as disabled
// 6. Setting saved to disk: { enabledCommands: { 'create-fleeting-note': false } }
// 7. Notice shown: "Plugin reload required"
// 8. User reloads plugin (Ctrl+R or restart Obsidian)
// 9. On load, plugin reads settings
// 10. registerAll() receives enabledCommands map
// 11. 'create-fleeting-note' is NOT registered
// 12. Command doesn't appear in command palette
```

## Adding New Command Categories

When adding commands in new categories:

1. Create the command with category metadata:

```typescript
export const myNavigationCommand: CommandFactory = (context) => ({
  id: 'navigate-to-parent',
  name: 'Navigate to Parent Zettel',
  metadata: {
    category: 'navigation', // New category
    description: 'Jump to parent zettel',
    canBeDisabled: true,
    enabledByDefault: true,
  },
  execute: async () => {
    /* ... */
  },
})
```

2. The settings UI will automatically group it under "Navigation"

## Testing Command Settings

```typescript
// In developer console
const plugin = app.plugins.plugins['obsidian-zettelkasten']
const registry = plugin.getCommandRegistry()

// Check command status
console.log(registry.isCommandEnabled('create-zettel-note'))

// Get all commands
console.log(registry.getCommands())

// Get enabled only
console.log(registry.getEnabledCommands())

// Get by category
console.log(registry.getCommandsByCategory())

// Enable/disable
await plugin.enableCommand('create-zettel-note')
await plugin.disableCommand('create-fleeting-note')
```

## Best Practices

1. **Always use metadata**: Every command should have complete metadata
2. **Descriptive categories**: Use clear, consistent category names
3. **User-friendly descriptions**: Write descriptions for end users, not developers
4. **Consider defaults**: Most commands should be `enabledByDefault: true`
5. **Core commands**: Use `canBeDisabled: false` for essential functionality
6. **Show reload notice**: Always inform users when reload is needed

## Known Limitations

⚠️ **Obsidian API Limitation**: Commands cannot be unregistered at runtime. Changes require plugin reload.

This is a limitation of Obsidian's plugin API, not our implementation. The CommandRegistry handles this gracefully by:

- Tracking disabled state
- Not registering disabled commands on next load
- Providing clear user feedback
