import type { App, Command, Plugin } from 'obsidian'
import type FileService from '../service/file.service'
import type BoxService from '../service/box.service'
import type BoxManager from '../core/boxManager.class'
import type SettingsManager from '../settings/SettingsManager'
import type NoteSequenceService from '../service/noteSequence.service'
import type ZettelNote from '../core/zettelNote.class'
import type FleetingNote from '../core/fleetingNote.class'
import type IndexNote from '../core/indexNote.class'
import type LiteratureNote from '../core/literatureNote.class'

/**
 * Command metadata for settings and management
 */
export interface CommandMetadata {
  /**
   * Category for organizing commands in settings
   * e.g., 'note-creation', 'navigation', 'box-management'
   */
  category?: string

  /**
   * Description for settings UI
   */
  description?: string

  /**
   * Whether this command can be disabled in settings
   * Some core commands might always need to be enabled
   */
  canBeDisabled?: boolean

  /**
   * Default enabled state
   */
  enabledByDefault?: boolean
}

/**
 * Base interface for all plugin commands
 * Extends Obsidian's Command interface with lifecycle methods
 */
export interface BaseCommand extends Omit<Command, 'callback'> {
  /**
   * Execute the command
   */
  execute: () => void | Promise<void>

  /**
   * Metadata for settings integration
   */
  metadata?: CommandMetadata
}

/**
 * Dependencies that commands might need
 * This grows as the plugin adds more services
 */
export interface CommandContext {
  // Core services
  app: App
  plugin?: Plugin

  // Plugin services (add as needed)
  fileService?: FileService
  boxService?: BoxService
  boxManager?: BoxManager
  settingsManager?: SettingsManager
  noteSequenceService?: NoteSequenceService

  // Note types
  zettelNote?: ZettelNote
  fleetingNote?: FleetingNote
  indexNote?: IndexNote
  literatureNote?: LiteratureNote
}

/**
 * Factory function type for creating commands
 * Commands receive context and return a command definition
 */
export type CommandFactory = (context: CommandContext) => BaseCommand
