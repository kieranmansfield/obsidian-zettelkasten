import { Plugin, Platform } from 'obsidian'
import FileService from './service/file.service'
import { noteKinds } from './core/note.class'
import NoteSequenceService from './service/noteSequence.service'
import CommandRegistry from './commands/CommandRegistry'
import SettingsManager from './settings/SettingsManager'
import SettingsTab from './settings/SettingsTab'
import { allCommands } from './commands'
import { NoteSequencesView, VIEW_TYPE_NOTE_SEQUENCES } from './ui/NoteSequencesView'
import { SequenceNavigatorView, VIEW_TYPE_SEQUENCE_NAVIGATOR } from './ui/SequenceNavigatorView'
import {
  ZettelkastenSidebar,
  VIEW_TYPE_ZETTELKASTEN,
  revealZettelkastenSidebar,
} from './ui/ZettelkastenSidebar'
import { createNoteSequenceCardsViewRegistration } from './ui/NoteSequenceCardsView'

export default class ZettelkastenPlugin extends Plugin {
  private settingsManager!: SettingsManager
  private commandRegistry = new CommandRegistry(this)

  async onload() {
    // Saved settings change what the sidebar shows
    this.settingsManager = new SettingsManager(this, () => {
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)) {
        if (leaf.view instanceof ZettelkastenSidebar) leaf.view.refresh()
      }
    })
    await this.settingsManager.load()
    this.addSettingTab(new SettingsTab(this.app, this))

    const fileService = new FileService(this.app)
    const noteSequenceService = new NoteSequenceService(this.app)

    // Views must be registered before Obsidian restores the workspace layout, or their tabs go blank
    this.registerView(VIEW_TYPE_ZETTELKASTEN, (leaf) => new ZettelkastenSidebar(leaf, this))
    this.registerView(
      VIEW_TYPE_NOTE_SEQUENCES,
      (leaf) => new NoteSequencesView(leaf, noteSequenceService)
    )
    this.registerView(
      VIEW_TYPE_SEQUENCE_NAVIGATOR,
      (leaf) => new SequenceNavigatorView(leaf, noteSequenceService)
    )

    const sequences = this.settingsManager.get('noteSequences')
    if (sequences.enabled && sequences.showSequencesView) {
      this.registerBasesView(
        'note-sequence-cards',
        createNoteSequenceCardsViewRegistration(noteSequenceService)
      )
    }

    this.app.workspace.onLayoutReady(() => {
      this.commandRegistry.registerAll(
        allCommands,
        {
          app: this.app,
          fileService,
          settingsManager: this.settingsManager,
          noteSequenceService,
          ...noteKinds(this.app, fileService, this.settingsManager),
        },
        this.settingsManager.getEnabledCommandsMap()
      )

      // Mobile can restore the sidebar outside the left dock
      const { workspace } = this.app
      if (Platform.isMobile && workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN).length) {
        void revealZettelkastenSidebar(workspace)
      }
    })
  }

  public getSettingsManager(): SettingsManager {
    return this.settingsManager
  }

  public getCommandRegistry(): CommandRegistry {
    return this.commandRegistry
  }

  /** Add a command to the palette straight away and remember it */
  public async enableCommand(commandId: string): Promise<void> {
    this.commandRegistry.enableCommand(commandId)
    await this.settingsManager.enableCommand(commandId)
  }

  /** Remove a command from the palette straight away and remember it */
  public async disableCommand(commandId: string): Promise<void> {
    this.commandRegistry.disableCommand(commandId)
    await this.settingsManager.disableCommand(commandId)
  }
}
