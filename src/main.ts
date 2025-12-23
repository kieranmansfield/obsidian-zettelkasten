import { Plugin, addIcon, Platform } from 'obsidian'
import FileService from './service/file.service'
import ZettelNote from './core/zettelNote.class'
import FleetingNote from './core/fleetingNote.class'
import IndexNote from './core/indexNote.class'
import LiteratureNote from './core/literatureNote.class'
import BoxService from './service/box.service'
import BoxManager from './core/boxManager.class'
import NoteSequenceService from './service/noteSequence.service'
import CommandRegistry from './commands/CommandRegistry'
import SettingsManager from './settings/SettingsManager'
import SettingsTab from './settings/SettingsTab'
import type { CommandContext } from './base/command'
import * as commands from './commands'
import { NoteSequencesView, VIEW_TYPE_NOTE_SEQUENCES } from './ui/NoteSequencesView'
import { SequenceNavigatorView, VIEW_TYPE_SEQUENCE_NAVIGATOR } from './ui/SequenceNavigatorView'
import { ZettelkastenView, VIEW_TYPE_ZETTELKASTEN } from './ui/ZettelkastenView'
import { NoteSequencesBasesView, VIEW_TYPE_NOTE_SEQUENCES_BASES } from './ui/NoteSequencesBasesView'
import { createNoteSequenceCardsViewRegistration } from './ui/NoteSequenceCardsView'

export default class ZettelkastenPlugin extends Plugin {
  private settingsManager!: SettingsManager
  private fileService!: FileService
  private zettelNote!: ZettelNote
  private fleetingNote!: FleetingNote
  private indexNote!: IndexNote
  private literatureNote!: LiteratureNote
  private boxService!: BoxService
  private boxManager!: BoxManager
  private noteSequenceService!: NoteSequenceService
  private commandRegistry!: CommandRegistry

  async onload() {
    console.log('Loading Zettelkasten plugin')

    // Register custom icon for plugin settings
    addIcon(
      'zettelkasten-icon',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <rect x="10" y="30" width="15" height="50" stroke-width="2" fill="currentColor" opacity="0.3"/>
        <rect x="28" y="25" width="15" height="55" stroke-width="2" fill="currentColor" opacity="0.4"/>
        <rect x="46" y="28" width="15" height="52" stroke-width="2" fill="currentColor" opacity="0.5"/>
        <rect x="64" y="22" width="15" height="58" stroke-width="2" fill="currentColor" opacity="0.3"/>
        <rect x="82" y="26" width="15" height="54" stroke-width="2" fill="currentColor" opacity="0.4"/>
        <line x1="5" y1="82" x2="100" y2="82" stroke-width="3"/>
      </svg>`
    )

    // Load settings first
    await this.loadSettings()

    // Add settings tab
    this.addSettingTab(new SettingsTab(this.app, this))

    // Initialize services immediately (don't wait for layout ready)
    this.initializeServices()

    // Initialize note types
    this.initializeNoteTypes()

    // Register views BEFORE layout is ready to prevent ghost icons
    // Views must be registered before Obsidian restores the workspace layout
    this.registerViews()

    // Register Bases views
    this.registerBasesViews()

    // Register commands after layout is ready
    this.app.workspace.onLayoutReady(() => {
      try {
        this.registerCommands()
        // Ensure Zettelkasten view is in left sidebar on mobile
        this.ensureZettelkastenViewLocationOnMobile()
        console.log('Zettelkasten plugin loaded successfully')
      } catch (err) {
        console.error('Error during plugin initialization:', err)
      }
    })
  }

  /**
   * Load plugin settings
   */
  private async loadSettings(): Promise<void> {
    this.settingsManager = new SettingsManager(this)
    await this.settingsManager.load()
  }

  /**
   * Initialize core services
   */
  private initializeServices(): void {
    const boxSettings = this.settingsManager.getBoxes()

    this.fileService = new FileService(this.app)
    this.boxService = new BoxService(
      this.app.vault,
      boxSettings.defaultBox || boxSettings.rootFolder,
      boxSettings.rootFolder
    )
    this.boxManager = new BoxManager(this.boxService, this.fileService)
    this.noteSequenceService = new NoteSequenceService(this.app, this.fileService)
  }

  /**
   * Initialize note type handlers
   */
  private initializeNoteTypes(): void {
    this.zettelNote = new ZettelNote(this.fileService, this.boxManager, this.settingsManager)
    this.fleetingNote = new FleetingNote(this.fileService)
    this.indexNote = new IndexNote(this.fileService)
    this.literatureNote = new LiteratureNote(this.fileService)
  }

  /**
   * Register views for Note Sequences and Zettelkasten Sidebar
   */
  private registerViews(): void {
    const boxSettings = this.settingsManager.getBoxes()
    const rootFolder = boxSettings.rootFolder

    // Always register view types (even if disabled) to prevent ghost icons
    this.registerView(VIEW_TYPE_ZETTELKASTEN, (leaf) => new ZettelkastenView(leaf, this))

    this.registerView(
      VIEW_TYPE_NOTE_SEQUENCES,
      (leaf) => new NoteSequencesView(leaf, this.noteSequenceService, rootFolder)
    )

    this.registerView(
      VIEW_TYPE_NOTE_SEQUENCES_BASES,
      (leaf) => new NoteSequencesBasesView(leaf, this.noteSequenceService, rootFolder)
    )

    this.registerView(
      VIEW_TYPE_SEQUENCE_NAVIGATOR,
      (leaf) => new SequenceNavigatorView(leaf, this.noteSequenceService)
    )
  }

  /**
   * Register Bases views
   */
  private registerBasesViews(): void {
    const sequenceSettings = this.settingsManager.getNoteSequences()

    if (!sequenceSettings.enabled || !sequenceSettings.showSequencesView) {
      return
    }

    // Register Note Sequence Cards Bases View
    const registration = createNoteSequenceCardsViewRegistration(this.noteSequenceService)
    this.registerBasesView('note-sequence-cards', registration)
  }

  /**
   * Register all plugin commands
   */
  private registerCommands(): void {
    // Build command context with all dependencies
    const context: CommandContext = {
      app: this.app,
      plugin: this,
      fileService: this.fileService,
      boxService: this.boxService,
      boxManager: this.boxManager,
      settingsManager: this.settingsManager,
      noteSequenceService: this.noteSequenceService,
      zettelNote: this.zettelNote,
      fleetingNote: this.fleetingNote,
      indexNote: this.indexNote,
      literatureNote: this.literatureNote,
    }

    // Initialize command registry
    this.commandRegistry = new CommandRegistry(this, context)

    // Register all commands
    this.commandRegistry
      .add(commands.createZettelNoteCommand)
      .add(commands.createFleetingNoteCommand)
      .add(commands.createIndexNoteCommand)
      .add(commands.createLiteratureNoteCommand)
      .add(commands.openBoxPaletteCommand)
      .add(commands.openZettelCommand)
      .add(commands.openIndexCommand)
      .add(commands.openNoteSequencesViewCommand)
      // .add(commands.openNoteSequencesBasesViewCommand)
      .add(commands.openSequenceNavigatorViewCommand)
      .add(commands.openSequenceNavigatorModalCommand)
      .add(commands.openSequenceCommandPaletteCommand)
      .add(commands.openZettelkastenViewCommand)
      .add(commands.indentZettelCommand)
      .add(commands.outdentZettelCommand)
      .add(commands.assignParentCommand)
      .add(commands.assignChildCommand)
      .add(commands.openParentZettelCommand)
      .add(commands.openChildZettelCommand)
      .add(commands.nextSiblingCommand)
      .add(commands.nextChildCommand)
      .add(commands.nextSequenceCommand)
      .add(commands.addBookmarkCommand)
      .add(commands.removeBookmarkCommand)
      .registerAll(this.getEnabledCommandsFromSettings())
  }

  /**
   * Get enabled commands from settings
   */
  private getEnabledCommandsFromSettings(): Map<string, boolean> {
    return this.settingsManager.getEnabledCommandsMap()
  }

  /**
   * Get the settings manager (useful for settings UI)
   */
  public getSettingsManager(): SettingsManager {
    return this.settingsManager
  }

  /**
   * Get the command registry (useful for settings UI)
   */
  public getCommandRegistry(): CommandRegistry {
    return this.commandRegistry
  }

  /**
   * Enable a command dynamically
   * Note: Requires plugin reload to take effect
   */
  public async enableCommand(commandId: string): Promise<void> {
    this.commandRegistry.enableCommand(commandId)
    await this.settingsManager.enableCommand(commandId)
  }

  /**
   * Disable a command dynamically
   * Note: Requires plugin reload to take effect
   */
  public async disableCommand(commandId: string): Promise<void> {
    this.commandRegistry.disableCommand(commandId)
    await this.settingsManager.disableCommand(commandId)
  }

  /**
   * Ensure Zettelkasten view is in the left sidebar on mobile
   * This runs on layout ready to fix any workspace restoration issues
   */
  private ensureZettelkastenViewLocationOnMobile(): void {
    // Only run on mobile devices
    if (!Platform.isMobile) {
      return
    }

    const { workspace } = this.app
    const existing = workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)

    // If no view is open, nothing to do
    if (existing.length === 0) {
      return
    }

    const existingLeaf = existing[0]

    // Check if the existing leaf's parent is the left split
    const isInLeftSidebar = existingLeaf.getRoot() === workspace.leftSplit

    // If it's not in the left sidebar, move it there
    if (!isInLeftSidebar) {
      // Close the view in the wrong location
      existingLeaf.detach()

      // Open in the correct location (left sidebar)
      void (async () => {
        const leaf = workspace.getLeftLeaf(false)
        if (leaf) {
          await leaf.setViewState({
            type: VIEW_TYPE_ZETTELKASTEN,
            active: true,
          })
        }
      })()
    }
  }

  onunload() {
    console.log('Unloading Zettelkasten plugin')

    // Detach all custom views
  }
}
