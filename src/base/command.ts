import type { App, Command } from 'obsidian'
import type FileService from '../service/file.service'
import type SettingsManager from '../settings/SettingsManager'
import type NoteSequenceService from '../service/noteSequence.service'
import type NoteCore from '../core/note.class'

/**
 * Command metadata for settings and management
 */
export interface CommandMetadata {
  /**
   * Category for organizing commands in settings
   * e.g., 'note-creation', 'navigation'
   */
  category?: string

  /**
   * Description for settings UI
   */
  description?: string
}

/**
 * Base interface for all plugin commands
 * Extends Obsidian's Command interface with lifecycle methods
 */
export interface BaseCommand extends Omit<Command, 'callback'> {
  /**
   * Execute the command
   */
  execute: () => unknown

  /**
   * Metadata for settings integration
   */
  metadata?: CommandMetadata
}

/** Services every command receives; main.ts builds them all before registering commands */
export interface CommandContext {
  app: App
  fileService: FileService
  settingsManager: SettingsManager
  noteSequenceService: NoteSequenceService
  zettelNote: NoteCore
  fleetingNote: NoteCore
  indexNote: NoteCore
  literatureNote: NoteCore
}

/**
 * Factory function type for creating commands
 * Commands receive context and return a command definition
 */
export type CommandFactory = (context: CommandContext) => BaseCommand
