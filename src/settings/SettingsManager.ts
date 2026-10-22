import type { Plugin } from 'obsidian'
import { DEFAULT_SETTINGS } from './DefaultSettings'
import { getIn, setIn } from '../base/objectPath'
import type { PluginSettings } from 'src/base/settings'

type Section = Exclude<keyof PluginSettings, 'commands'>

/** Loads, migrates, reads and saves the plugin settings; every save calls `onChange` */
export default class SettingsManager {
  private plugin: Plugin
  private onChange: () => void
  private settings: PluginSettings = structuredClone(DEFAULT_SETTINGS)

  constructor(plugin: Plugin, onChange: () => void = () => {}) {
    this.plugin = plugin
    this.onChange = onChange
  }

  async load(): Promise<void> {
    this.apply((await this.plugin.loadData()) ?? {})
  }

  async save(): Promise<void> {
    await this.plugin.saveData(this.settings)
    this.onChange()
  }

  getAll(): PluginSettings {
    return { ...this.settings }
  }

  /** A copy of one settings section */
  get<K extends Section>(section: K): PluginSettings[K] {
    return { ...this.settings[section] }
  }

  /** Read a setting by dotted path, e.g. "zettel.enabled" */
  // fallow-ignore-next-line unused-class-member
  getPath(path: string): unknown {
    return getIn(this.settings, path)
  }

  /** Write a setting by dotted path and persist it */
  async setPath(path: string, value: unknown): Promise<void> {
    this.settings = setIn(this.settings, path, value)
    await this.save()
  }

  async enableCommand(commandId: string): Promise<void> {
    await this.setPath(`commands.enabledCommands.${commandId}`, true)
  }

  async disableCommand(commandId: string): Promise<void> {
    await this.setPath(`commands.enabledCommands.${commandId}`, false)
  }

  getEnabledCommandsMap(): Map<string, boolean> {
    return new Map(Object.entries(this.settings.commands.enabledCommands))
  }

  async resetToDefaults(): Promise<void> {
    this.settings = structuredClone(DEFAULT_SETTINGS)
    await this.save()
  }

  export(): string {
    return JSON.stringify(this.settings, null, 2)
  }

  /** Replace the settings with an export; it is migrated like saved data */
  async import(json: string): Promise<void> {
    let raw: unknown
    try {
      raw = JSON.parse(json)
    } catch (error) {
      throw new Error(`Failed to import settings: ${String(error)}`, { cause: error })
    }
    this.apply(raw)
    await this.save()
  }

  /** Migrate saved or imported data and merge it over the defaults */
  private apply(data: unknown): void {
    const raw = isObject(data) ? data : {}
    // zettelkastenView → zettelkastenSidebar
    if ('zettelkastenView' in raw && !('zettelkastenSidebar' in raw)) {
      raw['zettelkastenSidebar'] = raw['zettelkastenView']
      delete raw['zettelkastenView']
    }
    migrateToSlipBox(raw)
    migrateReferencesToLiterature(section(raw, 'zettelkastenSidebar'))
    this.settings = deepMerge(structuredClone(DEFAULT_SETTINGS), raw)
  }
}

const isObject = (item: unknown): item is Record<string, unknown> =>
  item !== null && typeof item === 'object' && !Array.isArray(item)

/** `source` over `target`, recursing into objects; arrays and values replace */
function deepMerge<T>(target: T, source: Record<string, unknown>): T {
  const output = { ...target } as Record<string, unknown>
  for (const [key, value] of Object.entries(source)) {
    output[key] = isObject(value) && isObject(output[key]) ? deepMerge(output[key], value) : value
  }
  return output as T
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

/** Literature settings were once "references": keep the user's choice under the new keys */
function migrateReferencesToLiterature(sidebar: RawSection): void {
  const renames = {
    showReferences: 'showLiterature',
    showReferenceFiles: 'showLiteratureFiles',
    referencesFilterTag: 'literatureFilterTag',
  }
  for (const [old, now] of Object.entries(renames)) {
    if (!(old in sidebar)) continue
    if (sidebar[now] === undefined || sidebar[now] === '') sidebar[now] = sidebar[old]
    delete sidebar[old]
  }
}

function migrateZettel(zettel: RawSection, boxRoot: unknown): void {
  zettel['defaultFolder'] ||= boxRoot || DEFAULT_SETTINGS.zettel.defaultFolder
  if (['tag', 'link'].includes(String(zettel['zettelDetectionMode']))) {
    zettel['zettelDetectionMode'] = 'folder'
    zettel['zettelTag'] = DEFAULT_SETTINGS.zettel.zettelTag
  }
}
