import type { Plugin } from 'obsidian'
import { DEFAULT_SETTINGS } from './DefaultSettings'
import type {
  PluginSettings,
  GeneralSettings,
  CommandSettings,
  BoxSettings,
  ZettelSettings,
  FleetingSettings,
  IndexSettings,
  LiteratureSettings,
  ProjectSettings,
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
    const data = await this.plugin.loadData()

    // Deep merge loaded data with defaults
    this.settings = this.deepMerge(DEFAULT_SETTINGS, data || {})

    // Run migrations if needed
    await this.migrate()

    console.log('Settings loaded:', this.settings)
  }

  /**
   * Save settings to disk
   */
  async save(): Promise<void> {
    await this.plugin.saveData(this.settings)
    console.log('Settings saved')
  }

  /**
   * Get all settings
   */
  getAll(): PluginSettings {
    return { ...this.settings }
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
   * Get box settings
   */
  getBoxes() {
    return { ...this.settings.boxes }
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
   * Get index note settings
   */
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
   * Get Zettelkasten view settings
   */
  getZettelkastenView() {
    return { ...this.settings.zettelkastenView }
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
   * Update box settings
   */
  async updateBoxes(boxes: Partial<typeof this.settings.boxes>): Promise<void> {
    this.settings.boxes = { ...this.settings.boxes, ...boxes }
    await this.save()
  }

  /**
   * Update zettel settings
   */
  async updateZettel(zettel: Partial<typeof this.settings.zettel>): Promise<void> {
    this.settings.zettel = { ...this.settings.zettel, ...zettel }
    await this.save()
  }

  /**
   * Update fleeting note settings
   */
  async updateFleeting(fleeting: Partial<typeof this.settings.fleeting>): Promise<void> {
    this.settings.fleeting = { ...this.settings.fleeting, ...fleeting }
    await this.save()
  }

  /**
   * Update index note settings
   */
  async updateIndex(index: Partial<typeof this.settings.index>): Promise<void> {
    this.settings.index = { ...this.settings.index, ...index }
    await this.save()
  }

  /**
   * Update literature note settings
   */
  async updateLiterature(literature: Partial<typeof this.settings.literature>): Promise<void> {
    this.settings.literature = { ...this.settings.literature, ...literature }
    await this.save()
  }

  /**
   * Update project note settings
   */
  async updateProjects(projects: Partial<typeof this.settings.projects>): Promise<void> {
    this.settings.projects = { ...this.settings.projects, ...projects }
    await this.save()
  }

  /**
   * Update Zettelkasten view settings
   */
  async updateZettelkastenView(
    zettelkastenView: Partial<typeof this.settings.zettelkastenView>
  ): Promise<void> {
    this.settings.zettelkastenView = { ...this.settings.zettelkastenView, ...zettelkastenView }
    await this.save()

    // Refresh the Zettelkasten view if it's open
    this.refreshZettelkastenView()
  }

  /**
   * Refresh the Zettelkasten view
   */
  private refreshZettelkastenView(): void {
    const { VIEW_TYPE_ZETTELKASTEN } = require('../ui/ZettelkastenView')
    const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)
    leaves.forEach((leaf) => {
      const view = leaf.view as any
      if (view && typeof view.refresh === 'function') {
        view.refresh()
      }
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
    } else if (section === 'boxes') {
      this.settings.boxes = { ...(defaultValue as BoxSettings) }
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
          ;(output as Record<string, unknown>)[key] = this.deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          )
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
    if (!currentVersion || currentVersion < '0.1.4') {
      console.log('Migrating settings to v0.1.4')
      // Add any migration logic here
      this.settings.version = '0.1.4'
      needsSave = true
    }

    // Add future migrations here
    // if (currentVersion < '0.2.0') { ... }

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
      const imported = JSON.parse(json)
      this.settings = this.deepMerge(DEFAULT_SETTINGS, imported)
      await this.save()
    } catch (error) {
      throw new Error(`Failed to import settings: ${error}`)
    }
  }
}
