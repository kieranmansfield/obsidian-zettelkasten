import type { Plugin } from 'obsidian'
import { DEFAULT_SETTINGS } from './DefaultSettings'
import { getIn, setIn } from '../base/objectPath'
import type {
  PluginSettings,
  GeneralSettings,
  CommandSettings,
  ZettelSettings,
  FleetingSettings,
  IndexSettings,
  LiteratureSettings,
  NoteSequenceSettings,
} from 'src/base/settings'

/**
 * SettingsManager
 *
 * Handles loading, saving, and managing plugin settings.
 * Provides type-safe access to all settings with validation.
 *
 * Architecture:
 * - Centralized settings management
 * - Deep merge for updates
 * - Migration support for version updates
 * - Type-safe getters and setters
 */
export default class SettingsManager {
  private plugin: Plugin
  private settings: PluginSettings

  constructor(plugin: Plugin) {
    this.plugin = plugin
    this.settings = DEFAULT_SETTINGS
  }

  /**
   * Load settings from disk
   * Merges with defaults and runs migrations
   */
  async load(): Promise<void> {
    const raw = ((await this.plugin.loadData()) ?? {}) as Record<string, unknown>

    // Migrate zettelkastenView → zettelkastenSidebar
    if ('zettelkastenView' in raw && !('zettelkastenSidebar' in raw)) {
      raw['zettelkastenSidebar'] = raw['zettelkastenView']
      delete raw['zettelkastenView']
    }

    migrateToSlipBox(raw)

    // Deep merge loaded data with defaults
    this.settings = this.deepMerge(DEFAULT_SETTINGS, raw)

    // Run migrations if needed
    await this.migrate()
  }

  /**
   * Save settings to disk
   */
  async save(): Promise<void> {
    await this.plugin.saveData(this.settings)
  }

  /**
   * Get all settings
   */
  getAll(): PluginSettings {
    return { ...this.settings }
  }

  /** Read a setting by dotted path, e.g. "zettel.enabled" */
  // fallow-ignore-next-line unused-class-member
  getPath(path: string): unknown {
    return getIn(this.settings, path)
  }

  /** Write a setting by dotted path and persist it */
  // fallow-ignore-next-line unused-class-member
  async setPath(path: string, value: unknown): Promise<void> {
    this.settings = setIn(this.settings, path, value)
    await this.save()
    this.refreshZettelkastenSidebar()
  }

  /**
   * Get general settings
   */
  getGeneral() {
    return { ...this.settings.general }
  }

  /**
   * Get command settings
   */
  getCommands() {
    return { ...this.settings.commands }
  }

  /**
   * Get zettel settings
   */
  getZettel() {
    return { ...this.settings.zettel }
  }

  /**
   * Get fleeting note settings
   */
  getFleeting() {
    return { ...this.settings.fleeting }
  }

  /**
   * Get structure note settings
   */
  // fallow-ignore-next-line unused-class-member
  getIndex() {
    return { ...this.settings.index }
  }

  /**
   * Get literature note settings
   */
  getLiterature() {
    return { ...this.settings.literature }
  }

  /**
   * Get project note settings
   */
  getProjects() {
    return { ...this.settings.projects }
  }

  /**
   * Get Zettelkasten sidebar settings
   */
  getZettelkastenSidebar() {
    return { ...this.settings.zettelkastenSidebar }
  }

  /**
   * Get note sequence settings
   */
  getNoteSequences() {
    return { ...this.settings.noteSequences }
  }

  /**
   * Update general settings
   */
  async updateGeneral(general: Partial<typeof this.settings.general>): Promise<void> {
    this.settings.general = { ...this.settings.general, ...general }
    await this.save()
  }

  /**
   * Update command settings
   */
  async updateCommands(commands: Partial<typeof this.settings.commands>): Promise<void> {
    this.settings.commands = { ...this.settings.commands, ...commands }
    await this.save()
  }

  /**
   * Update zettel settings
   */
  async updateZettel(zettel: Partial<typeof this.settings.zettel>): Promise<void> {
    this.settings.zettel = { ...this.settings.zettel, ...zettel }
    await this.save()
    // Refresh the Zettelkasten view if it's open
    this.refreshZettelkastenSidebar()
  }

  /**
   * Update fleeting note settings
   */
  async updateFleeting(fleeting: Partial<typeof this.settings.fleeting>): Promise<void> {
    this.settings.fleeting = { ...this.settings.fleeting, ...fleeting }
    await this.save()
    // Refresh the Zettelkasten view if it's open
    this.refreshZettelkastenSidebar()
  }

  /**
   * Update index note settings
   */
  async updateIndex(index: Partial<typeof this.settings.index>): Promise<void> {
    this.settings.index = { ...this.settings.index, ...index }
    await this.save()
    // Refresh the Zettelkasten view if it's open
    this.refreshZettelkastenSidebar()
  }

  /**
   * Update literature note settings
   */
  async updateLiterature(literature: Partial<typeof this.settings.literature>): Promise<void> {
    this.settings.literature = { ...this.settings.literature, ...literature }
    await this.save()
    // Refresh the Zettelkasten view if it's open
    this.refreshZettelkastenSidebar()
  }

  /**
   * Update project note settings
   */
  async updateProjects(projects: Partial<typeof this.settings.projects>): Promise<void> {
    this.settings.projects = { ...this.settings.projects, ...projects }
    await this.save()
    // Refresh the Zettelkasten view if it's open
    this.refreshZettelkastenSidebar()
  }

  /**
   * Update Zettelkasten sidebar settings
   */
  async updateZettelkastenSidebar(
    zettelkastenSidebar: Partial<typeof this.settings.zettelkastenSidebar>
  ): Promise<void> {
    this.settings.zettelkastenSidebar = {
      ...this.settings.zettelkastenSidebar,
      ...zettelkastenSidebar,
    }
    await this.save()

    // Refresh the Zettelkasten sidebar if it's open
    this.refreshZettelkastenSidebar()
  }

  /**
   * Refresh the Zettelkasten sidebar
   */
  private refreshZettelkastenSidebar(): void {
    // Dynamic import to avoid circular dependencies
    import('../ui/ZettelkastenSidebar')
      .then(({ VIEW_TYPE_ZETTELKASTEN, ZettelkastenSidebar }) => {
        const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)
        leaves.forEach((leaf) => {
          const view = leaf.view
          if (view instanceof ZettelkastenSidebar) {
            view.refresh()
          }
        })
      })
      .catch((error) => {
        console.error('Failed to refresh ZettelkastenSidebar:', error)
      })
  }

  /**
   * Update note sequence settings
   */
  async updateNoteSequences(
    noteSequences: Partial<typeof this.settings.noteSequences>
  ): Promise<void> {
    this.settings.noteSequences = { ...this.settings.noteSequences, ...noteSequences }
    await this.save()
  }

  /**
   * Enable a command
   */
  async enableCommand(commandId: string): Promise<void> {
    this.settings.commands.enabledCommands[commandId] = true
    await this.save()
  }

  /**
   * Disable a command
   */
  async disableCommand(commandId: string): Promise<void> {
    this.settings.commands.enabledCommands[commandId] = false
    await this.save()
  }

  /**
   * Check if a command is enabled
   */
  isCommandEnabled(commandId: string): boolean | undefined {
    return this.settings.commands.enabledCommands[commandId]
  }

  /**
   * Get enabled commands as a Map
   */
  getEnabledCommandsMap(): Map<string, boolean> {
    return new Map(Object.entries(this.settings.commands.enabledCommands))
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS }
    await this.save()
  }

  /**
   * Reset specific section to defaults
   */
  async resetSection(section: keyof Omit<PluginSettings, 'version'>): Promise<void> {
    // TypeScript needs help with the index signature
    const defaultValue = DEFAULT_SETTINGS[section]

    if (section === 'general') {
      this.settings.general = { ...(defaultValue as GeneralSettings) }
    } else if (section === 'commands') {
      this.settings.commands = { ...(defaultValue as CommandSettings) }
    } else if (section === 'zettel') {
      this.settings.zettel = { ...(defaultValue as ZettelSettings) }
    } else if (section === 'fleeting') {
      this.settings.fleeting = { ...(defaultValue as FleetingSettings) }
    } else if (section === 'index') {
      this.settings.index = { ...(defaultValue as IndexSettings) }
    } else if (section === 'literature') {
      this.settings.literature = { ...(defaultValue as LiteratureSettings) }
    } else if (section === 'noteSequences') {
      this.settings.noteSequences = { ...(defaultValue as NoteSequenceSettings) }
    }

    await this.save()
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const output = { ...target }

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        const sourceValue = (source as Record<string, unknown>)[key]
        const targetValue = (output as Record<string, unknown>)[key]

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          ;(output as Record<string, unknown>)[key] = this.deepMerge(targetValue, sourceValue)
        } else {
          ;(output as Record<string, unknown>)[key] = sourceValue
        }
      })
    }

    return output
  }

  /**
   * Check if value is an object
   */
  private isObject(item: unknown): item is Record<string, unknown> {
    return item !== null && typeof item === 'object' && !Array.isArray(item)
  }

  /**
   * Migrate settings from old versions
   */
  private async migrate(): Promise<void> {
    const currentVersion = this.settings.version
    let needsSave = false

    // Example migration: if version is old, update something
    if (compareSemver(currentVersion ?? '0.0.0', '0.1.4') < 0) {
      // Add any migration logic here
      this.settings.version = '0.1.4'
      needsSave = true
    }

    // Add future migrations here
    // if (compareSemver(currentVersion ?? '0.0.0', '0.2.0') < 0) { ... }

    if (needsSave) {
      await this.save()
    }
  }

  /**
   * Export settings as JSON string
   */
  export(): string {
    return JSON.stringify(this.settings, null, 2)
  }

  /**
   * Import settings from JSON string
   */
  async import(json: string): Promise<void> {
    try {
      const imported = JSON.parse(json) as Partial<PluginSettings>
      this.settings = this.deepMerge(DEFAULT_SETTINGS, imported)
      await this.save()
    } catch (error) {
      throw new Error(
        `Failed to import settings: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    }
  }
}

/** Numeric `major.minor.patch` comparison ('0.1.10' > '0.1.4'); no pre-release tags */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d) return d
  }
  return 0
}

type RawSection = Record<string, unknown>

/**
 * Strict Zettelkasten structure (one flat slip-box, no topic boxes, no type tags on permanent notes):
 * - boxes are removed; the old box root becomes the slip-box if no zettel folder was set
 * - zettel detection by tag or link becomes folder detection (they stamp #type tags / bare links)
 * - structure notes always live in the slip-box, so index folder/detection settings are dropped
 */
function migrateToSlipBox(raw: Record<string, unknown>): void {
  const boxes = section(raw, 'boxes')
  delete raw['boxes']
  migrateZettel(section(raw, 'zettel'), boxes['rootFolder'])

  const index = section(raw, 'index')
  for (const key of ['folder', 'detectionMode', 'tag']) delete index[key]
}

const section = (raw: Record<string, unknown>, key: string): RawSection =>
  (raw[key] ??= {}) as RawSection

function migrateZettel(zettel: RawSection, boxRoot: unknown): void {
  zettel['defaultFolder'] ||= boxRoot || DEFAULT_SETTINGS.zettel.defaultFolder
  if (['tag', 'link'].includes(String(zettel['zettelDetectionMode']))) {
    zettel['zettelDetectionMode'] = 'folder'
    zettel['zettelTag'] = DEFAULT_SETTINGS.zettel.zettelTag
  }
}
