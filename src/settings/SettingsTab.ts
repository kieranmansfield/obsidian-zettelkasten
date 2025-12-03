import { App, PluginSettingTab, Setting, Notice } from 'obsidian'
import type ZettelkastenPlugin from '../main'
import { FilenameFormat, BoxMode, ZettelDetectionMode } from '../base/settings'
import { FolderSuggest } from '../ui/FolderSuggest'
import { FileSuggest } from '../ui/FileSuggest'
import { BoxConfigModal } from '../ui/BoxConfigModal'
import { ImportExportModal } from '../ui/ImportExportModal'
import { CommandsModal } from '../ui/CommandsModal'
import { createDefaultBoxConfig } from '../settings/DefaultSettings'

/**
 * SettingsTab
 *
 * Provides a clean, organized UI for all plugin settings.
 * Settings are grouped into collapsible sections with enable/disable toggles.
 */

/*
 TODO FIX SCROLL TO TOP - When enabling and disabling the toggle switches - the settings window jumps to the top.
 TODO REMOVE empty & defunct button on default box.
TODO REMOVE root folder setting and auto-create
 */

export default class SettingsTab extends PluginSettingTab {
  plugin: ZettelkastenPlugin

  constructor(app: App, plugin: ZettelkastenPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    const settings = this.plugin.getSettingsManager()
    const boxSettings = settings.getBoxes()

    // Plugin header
    containerEl.createEl('h1', {
      text: 'Zettelkasten Settings',
      cls: 'zettelkasten-settings-title',
    })

    // General Settings (non-collapsible)
    this.displayGeneralSettings(containerEl)

    // Box Settings with enable/disable
    this.displayBoxSettings(containerEl)

    // Show note type settings ONLY when boxes are disabled
    if (!boxSettings.enabled) {
      // Zettel Note Settings with enable/disable
      this.displayZettelSettings(containerEl)

      // Fleeting Note Settings with enable/disable
      this.displayFleetingSettings(containerEl)

      // Index Note Settings with enable/disable
      this.displayIndexSettings(containerEl)

      // Literature Note Settings with enable/disable
      this.displayLiteratureSettings(containerEl)
    }

    // Zettelkasten View (shown regardless of box mode)
    this.displayZettelkastenViewSettings(containerEl)

    // Note Sequences (shown regardless of box mode)
    this.displayNoteSequenceSettings(containerEl)

    // Advanced Settings
    this.displayAdvancedSettings(containerEl)
  }

  /**
   * Helper to create collapsible sections with optional toggle
   */
  private createCollapsibleSection(
    containerEl: HTMLElement,
    title: string,
    description: string,
    defaultOpen = true,
    toggleConfig?: {
      getValue: () => boolean
      onChange: (value: boolean) => Promise<void>
    }
  ): HTMLElement {
    const sectionWrapper = containerEl.createDiv({ cls: 'settings-section' })

    const details = sectionWrapper.createEl('details', {
      cls: 'zettelkasten-collapsible-section',
    })

    // If toggle exists and is disabled, don't open the section
    const isEnabled = toggleConfig ? toggleConfig.getValue() : true
    details.open = isEnabled && defaultOpen

    const summary = details.createEl('summary')
    const header = summary.createDiv({ cls: 'section-header' })
    header.createEl('h1', { text: title })

    // Add toggle switch if provided
    if (toggleConfig) {
      const toggleContainer = header.createDiv({ cls: 'section-toggle' })

      // Create a temporary Setting to get the toggle switch
      const tempSetting = new Setting(toggleContainer)
        .setClass('section-toggle-setting')
        .addToggle((toggle) => {
          toggle.setValue(toggleConfig.getValue()).onChange(async (value) => {
            await toggleConfig.onChange(value)
            this.display() // Refresh display
          })
        })

      // Remove default setting styling
      tempSetting.settingEl.style.border = 'none'
      tempSetting.settingEl.style.padding = '0'

      // Stop propagation on the toggle container to prevent section collapse
      toggleContainer.addEventListener('click', (e) => {
        e.stopPropagation()
      })

      // Prevent expanding when disabled
      if (!isEnabled) {
        summary.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
        })
      }
    }

    const content = details.createDiv()
    if (description) {
      content.createEl('p', {
        text: description,
        cls: 'setting-item-description',
      })
    }

    return content
  }

  /**
   * General Settings Section (non-collapsible)
   */
  private displayGeneralSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const generalSettings = settings.getGeneral()

    const sectionEl = containerEl.createDiv({ cls: 'settings-section' })
    sectionEl.createEl('h1', { text: 'General' })

    // Zettel Detection Mode
    new Setting(sectionEl)
      .setName('Zettel Detection Mode')
      .setDesc('How to identify zettel notes: by folder location or by tags')
      .addDropdown((dropdown) => {
        dropdown
          .addOption(ZettelDetectionMode.FOLDER, 'Folder-based')
          .addOption(ZettelDetectionMode.TAG, 'Tag-based')
          .setValue(generalSettings.zettelDetectionMode)
          .onChange(async (value) => {
            await settings.updateGeneral({ zettelDetectionMode: value as ZettelDetectionMode })
          })
      })

    // Zettel ID Format
    new Setting(sectionEl)
      .setName('Zettel ID Format')
      .setDesc('Format for ZettelId timestamps (e.g., YYYYMMDDHHmmssSSS)')
      .addText((text) => {
        text
          .setPlaceholder('YYYYMMDDHHmmssSSS')
          .setValue(generalSettings.zettelIdFormat)
          .onChange(async (value) => {
            await settings.updateGeneral({ zettelIdFormat: value || 'YYYYMMDDHHmmssSSS' })
          })
      })

    // Manage Commands
    new Setting(sectionEl)
      .setName('Manage Commands')
      .setDesc('Enable or disable individual plugin commands')
      .addButton((button) => {
        button
          .setButtonText('Manage Commands')
          .setCta()
          .onClick(() => {
            new CommandsModal(this.app, this.plugin).open()
          })
      })

    // Ignored Folders header
    sectionEl.createEl('h3', { text: 'Ignored Folders', cls: 'settings-subsection-title' })

    // Add button for new ignored folder
    new Setting(sectionEl)
      .setName('Ignored Folders')
      .setDesc('Folders to exclude from indexing and search')
      .addButton((button) => {
        button
          .setButtonText('Add Folder')
          .setCta()
          .onClick(async () => {
            const newFolders = [...generalSettings.ignoredFolders, '']
            await settings.updateGeneral({ ignoredFolders: newFolders })
            this.display()
          })
      })

    // Display existing ignored folders
    generalSettings.ignoredFolders.forEach((folder, index) => {
      new Setting(sectionEl)
        .setClass('zettelkasten-ignored-folder-item')
        .addText((text) => {
          new FolderSuggest(this.app, text.inputEl, async (value) => {
            text.setValue(value)
            const newFolders = [...generalSettings.ignoredFolders]
            newFolders[index] = value
            await settings.updateGeneral({ ignoredFolders: newFolders })
          })

          text
            .setPlaceholder('folder/path')
            .setValue(folder)
            .onChange(async (value) => {
              const newFolders = [...generalSettings.ignoredFolders]
              newFolders[index] = value
              await settings.updateGeneral({ ignoredFolders: newFolders })
            })
        })
        .addButton((button) => {
          button
            .setIcon('trash')
            .setTooltip('Remove folder')
            .onClick(async () => {
              const newFolders = generalSettings.ignoredFolders.filter((_, i) => i !== index)
              await settings.updateGeneral({ ignoredFolders: newFolders })
              this.display()
            })
        })
    })
  }

  /**
   * Box Settings Section
   */
  private displayBoxSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const boxSettings = settings.getBoxes()

    const content = this.createCollapsibleSection(
      containerEl,
      'Box System',
      'Organize zettels into boxes (folders or tags). When disabled, all zettels go to a single folder.',
      false,
      {
        getValue: () => boxSettings.enabled,
        onChange: async (enabled) => {
          await settings.updateBoxes({ enabled })
        },
      }
    )

    if (!boxSettings.enabled) {
      // Single folder mode
      new Setting(content)
        .setName('Zettels Folder')
        .setDesc('Folder where all zettels will be stored')
        .addText((text) => {
          new FolderSuggest(this.app, text.inputEl, async (value) => {
            text.setValue(value)
            await settings.updateBoxes({ rootFolder: value })
          })

          text
            .setPlaceholder('zettels')
            .setValue(boxSettings.rootFolder)
            .onChange(async (value) => {
              await settings.updateBoxes({ rootFolder: value || 'zettels' })
            })
        })
    } else {
      // Box system enabled - show mode selector
      new Setting(content)
        .setName('Box Mode')
        .setDesc('How boxes are organized: by folders or by tags')
        .addDropdown((dropdown) => {
          dropdown
            .addOption(BoxMode.FOLDER, 'Folder-based')
            .addOption(BoxMode.TAG, 'Tag-based')
            .setValue(boxSettings.mode)
            .onChange(async (value) => {
              await settings.updateBoxes({ mode: value as BoxMode })
              this.display() // Refresh to show/hide relevant options
            })
        })

      // Show folder-specific settings only in folder mode
      if (boxSettings.mode === BoxMode.FOLDER) {
        new Setting(content)
          .setName('Root Folder')
          .setDesc('Root folder for all boxes')
          .addText((text) => {
            new FolderSuggest(this.app, text.inputEl, async (value) => {
              text.setValue(value)
              await settings.updateBoxes({ rootFolder: value })
            })

            text
              .setPlaceholder('zettels')
              .setValue(boxSettings.rootFolder)
              .onChange(async (value) => {
                await settings.updateBoxes({ rootFolder: value || 'zettels' })
              })
          })
      }

      new Setting(content)
        .setName('Auto-create Boxes')
        .setDesc('Automatically create boxes when referenced')
        .addToggle((toggle) => {
          toggle.setValue(boxSettings.autoCreateBoxes).onChange(async (value) => {
            await settings.updateBoxes({ autoCreateBoxes: value })
          })
        })

      // Box Management
      content.createEl('h3', { text: 'Boxes', cls: 'settings-subsection-title' })

      // Add Box button
      new Setting(content)
        .setName('Boxes')
        .setDesc('Manage boxes and their note type settings')
        .addButton((button) => {
          button
            .setButtonText('Add Box')
            .setCta()
            .onClick(async () => {
              const newBox = createDefaultBoxConfig()
              newBox.id = `box-${Date.now()}`
              newBox.name = 'New Box'
              newBox.isDefault = false

              const modal = new BoxConfigModal(this.app, newBox, async (config) => {
                const newBoxes = [...boxSettings.boxes, config]
                await settings.updateBoxes({ boxes: newBoxes })
                this.display()
              })
              modal.open()
            })
        })

      // Display existing boxes
      boxSettings.boxes.forEach((box, index) => {
        new Setting(content)
          .setName(box.name)
          .setDesc(box.isDefault ? 'Default box (non-deletable)' : `Box: ${box.value || '(root)'}`)
          .addButton((button) => {
            button.setButtonText('Edit').onClick(() => {
              const modal = new BoxConfigModal(this.app, box, async (config) => {
                const newBoxes = [...boxSettings.boxes]
                newBoxes[index] = config
                await settings.updateBoxes({ boxes: newBoxes })
                this.display()
              })
              modal.open()
            })
          })
          .addButton((button) => {
            if (!box.isDefault) {
              button
                .setIcon('trash')
                .setTooltip('Delete box')
                .onClick(async () => {
                  const newBoxes = boxSettings.boxes.filter((_, i) => i !== index)
                  await settings.updateBoxes({ boxes: newBoxes })
                  this.display()
                })
            }
          })
      })
    }
  }

  /**
   * Zettel Note Settings Section
   */
  private displayZettelSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const zettelSettings = settings.getZettel()

    const content = this.createCollapsibleSection(
      containerEl,
      'Zettel Notes',
      'Atomic notes with unique ZettelIds for building a knowledge network.',
      true,
      {
        getValue: () => zettelSettings.enabled,
        onChange: async (enabled) => {
          await settings.updateZettel({ enabled })
        },
      }
    )

    if (!zettelSettings.enabled) return

    new Setting(content)
      .setName('Default Folder')
      .setDesc('Folder for zettel notes (relative to box root, leave empty for box root)')
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl, async (value) => {
          text.setValue(value)
          await settings.updateZettel({ defaultFolder: value })
        })

        text
          .setPlaceholder('')
          .setValue(zettelSettings.defaultFolder)
          .onChange(async (value) => {
            await settings.updateZettel({ defaultFolder: value })
          })
      })

    // Filename Format
    new Setting(content)
      .setName('Filename Format')
      .setDesc('How zettel filenames should be formatted')
      .addDropdown((dropdown) => {
        dropdown
          .addOption(FilenameFormat.ID_ONLY, 'ID Only (20240612153000000a1b2.md)')
          .addOption(FilenameFormat.ID_TITLE, 'ID + Title (20240612153000000a1b2 ⁝ My Note.md)')
          .setValue(zettelSettings.filenameFormat)
          .onChange(async (value) => {
            await settings.updateZettel({
              filenameFormat: value as FilenameFormat,
            })
            this.display() // Refresh to show/hide separator
            new Notice('Filename format updated. New zettels will use the new format.')
          })
      })

    // Separator (only shown if ID_TITLE format)
    if (zettelSettings.filenameFormat === FilenameFormat.ID_TITLE) {
      new Setting(content)
        .setName('Separator')
        .setDesc('Character(s) between ID and title (e.g., ⁝, -, |)')
        .addText((text) => {
          text
            .setPlaceholder('⁝')
            .setValue(zettelSettings.separator)
            .onChange(async (value) => {
              await settings.updateZettel({ separator: value || '⁝' })
            })
        })
    }

    // Template File
    this.addTemplateFileSetting(content, 'Zettel', zettelSettings, async (templatePath) => {
      await settings.updateZettel({ templatePath })
    })

    // Auto Link to Parent
    new Setting(content)
      .setName('Auto-link to Parent')
      .setDesc('Automatically add link to parent when creating child zettel')
      .addToggle((toggle) => {
        toggle.setValue(zettelSettings.autoLinkToParent).onChange(async (value) => {
          await settings.updateZettel({ autoLinkToParent: value })
        })
      })

    // Open on Create
    new Setting(content)
      .setName('Open on Create')
      .setDesc('Open newly created zettels in the editor')
      .addToggle((toggle) => {
        toggle.setValue(zettelSettings.openOnCreate).onChange(async (value) => {
          await settings.updateZettel({ openOnCreate: value })
        })
      })
  }

  /**
   * Fleeting Note Settings Section
   */
  private displayFleetingSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const fleetingSettings = settings.getFleeting()

    const content = this.createCollapsibleSection(
      containerEl,
      'Fleeting Notes',
      'Temporary notes for quick capture and processing.',
      false,
      {
        getValue: () => fleetingSettings.enabled,
        onChange: async (enabled) => {
          await settings.updateFleeting({ enabled })
        },
      }
    )

    if (!fleetingSettings.enabled) return

    new Setting(content)
      .setName('Folder')
      .setDesc('Folder for fleeting notes')
      .addText((text) => {
        text
          .setPlaceholder('fleeting')
          .setValue(fleetingSettings.folder)
          .onChange(async (value) => {
            await settings.updateFleeting({ folder: value || 'fleeting' })
          })
      })

    this.addTemplateFileSetting(content, 'Fleeting', fleetingSettings, async (templatePath) => {
      await settings.updateFleeting({ templatePath })
    })

    new Setting(content)
      .setName('Open on Create')
      .setDesc('Open newly created fleeting notes in the editor')
      .addToggle((toggle) => {
        toggle.setValue(fleetingSettings.openOnCreate).onChange(async (value) => {
          await settings.updateFleeting({ openOnCreate: value })
        })
      })
  }

  /**
   * Index Note Settings Section
   */
  private displayIndexSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const indexSettings = settings.getIndex()

    const content = this.createCollapsibleSection(
      containerEl,
      'Index Notes',
      'Index/MOC (Map of Content) notes for organizing and linking zettels.',
      false,
      {
        getValue: () => indexSettings.enabled,
        onChange: async (enabled) => {
          await settings.updateIndex({ enabled })
        },
      }
    )

    if (!indexSettings.enabled) return

    new Setting(content)
      .setName('Folder')
      .setDesc('Folder for index notes')
      .addText((text) => {
        text
          .setPlaceholder('index')
          .setValue(indexSettings.folder)
          .onChange(async (value) => {
            await settings.updateIndex({ folder: value || 'index' })
          })
      })

    this.addTemplateFileSetting(content, 'Index', indexSettings, async (templatePath) => {
      await settings.updateIndex({ templatePath })
    })

    new Setting(content)
      .setName('Open on Create')
      .setDesc('Open newly created index notes in the editor')
      .addToggle((toggle) => {
        toggle.setValue(indexSettings.openOnCreate).onChange(async (value) => {
          await settings.updateIndex({ openOnCreate: value })
        })
      })
  }

  /**
   * Literature Note Settings Section
   */
  private displayLiteratureSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const literatureSettings = settings.getLiterature()

    const content = this.createCollapsibleSection(
      containerEl,
      'Literature Notes',
      'Notes for referencing external sources, books, articles, and research.',
      false,
      {
        getValue: () => literatureSettings.enabled,
        onChange: async (enabled) => {
          await settings.updateLiterature({ enabled })
        },
      }
    )

    if (!literatureSettings.enabled) return

    new Setting(content)
      .setName('Folder')
      .setDesc('Folder for literature notes')
      .addText((text) => {
        text
          .setPlaceholder('literature')
          .setValue(literatureSettings.folder)
          .onChange(async (value) => {
            await settings.updateLiterature({ folder: value || 'literature' })
          })
      })

    this.addTemplateFileSetting(content, 'Literature', literatureSettings, async (templatePath) => {
      await settings.updateLiterature({ templatePath })
    })

    new Setting(content)
      .setName('Open on Create')
      .setDesc('Open newly created literature notes in the editor')
      .addToggle((toggle) => {
        toggle.setValue(literatureSettings.openOnCreate).onChange(async (value) => {
          await settings.updateLiterature({ openOnCreate: value })
        })
      })
  }

  /**
   * Note Sequences Settings Section
   */
  private displayZettelkastenViewSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const viewSettings = settings.getZettelkastenView()

    const content = this.createCollapsibleSection(
      containerEl,
      'Zettelkasten Sidebar',
      'Browse your notes by type in a collapsible sidebar view (Inbox, Zettels, References, Index).',
      false,
      {
        getValue: () => viewSettings.enabled,
        onChange: async (enabled) => {
          await settings.updateZettelkastenView({ enabled })
        },
      }
    )

    if (!viewSettings.enabled) return

    new Setting(content)
      .setName('Show Inbox')
      .setDesc('Display fleeting notes section in sidebar')
      .addToggle((toggle) => {
        toggle.setValue(viewSettings.showInbox).onChange(async (value) => {
          await settings.updateZettelkastenView({ showInbox: value })
        })
      })

    new Setting(content)
      .setName('Show Zettels')
      .setDesc('Display zettel notes section in sidebar')
      .addToggle((toggle) => {
        toggle.setValue(viewSettings.showZettels).onChange(async (value) => {
          await settings.updateZettelkastenView({ showZettels: value })
        })
      })

    new Setting(content)
      .setName('Show References')
      .setDesc('Display literature notes section in sidebar')
      .addToggle((toggle) => {
        toggle.setValue(viewSettings.showReferences).onChange(async (value) => {
          await settings.updateZettelkastenView({ showReferences: value })
        })
      })

    new Setting(content)
      .setName('Show Index')
      .setDesc('Display index notes section in sidebar')
      .addToggle((toggle) => {
        toggle.setValue(viewSettings.showIndex).onChange(async (value) => {
          await settings.updateZettelkastenView({ showIndex: value })
        })
      })

    // Dashboard notes
    content.createEl('h3', { text: 'Dashboard Notes' })

    new Setting(content)
      .setName('Dashboard Notes')
      .setDesc('Comma-separated file paths for pinned dashboard notes (e.g., "MOC.md, Todo.md")')
      .addTextArea((text) => {
        text
          .setValue(viewSettings.dashboardNotes.join(', '))
          .setPlaceholder('MOC.md, Todo.md')
          .onChange(async (value) => {
            const paths = value
              .split(',')
              .map((p) => p.trim())
              .filter((p) => p.length > 0)
            await settings.updateZettelkastenView({ dashboardNotes: paths })
          })
        text.inputEl.rows = 3
      })

    // Filtering options
    content.createEl('h3', { text: 'Section Filters' })
    content.createEl('p', {
      text: 'Optionally filter sections by folder or tag. Leave blank to use default folder settings.',
      cls: 'setting-item-description',
    })

    // Inbox filters
    new Setting(content)
      .setName('Inbox Filter Folder')
      .setDesc('Override default inbox folder (leave blank to use Fleeting folder)')
      .addText((text) => {
        text
          .setPlaceholder('inbox')
          .setValue(viewSettings.inboxFilterFolder)
          .onChange(async (value) => {
            await settings.updateZettelkastenView({ inboxFilterFolder: value })
          })
      })

    new Setting(content)
      .setName('Inbox Filter Tag')
      .setDesc('Filter inbox by tag (e.g., "inbox" or "#inbox")')
      .addText((text) => {
        text
          .setPlaceholder('#inbox')
          .setValue(viewSettings.inboxFilterTag)
          .onChange(async (value) => {
            await settings.updateZettelkastenView({ inboxFilterTag: value })
          })
      })

    // Zettels filters
    new Setting(content)
      .setName('Zettels Filter Folder')
      .setDesc('Override default zettels folder (leave blank to use Zettel folder)')
      .addText((text) => {
        text
          .setPlaceholder('zettels')
          .setValue(viewSettings.zettelsFilterFolder)
          .onChange(async (value) => {
            await settings.updateZettelkastenView({ zettelsFilterFolder: value })
          })
      })

    new Setting(content)
      .setName('Zettels Filter Tag')
      .setDesc('Filter zettels by tag (e.g., "zettel" or "#zettel")')
      .addText((text) => {
        text
          .setPlaceholder('#zettel')
          .setValue(viewSettings.zettelsFilterTag)
          .onChange(async (value) => {
            await settings.updateZettelkastenView({ zettelsFilterTag: value })
          })
      })

    // References filters
    new Setting(content)
      .setName('References Filter Folder')
      .setDesc('Override default references folder (leave blank to use Literature folder)')
      .addText((text) => {
        text
          .setPlaceholder('references')
          .setValue(viewSettings.referencesFilterFolder)
          .onChange(async (value) => {
            await settings.updateZettelkastenView({ referencesFilterFolder: value })
          })
      })

    new Setting(content)
      .setName('References Filter Tag')
      .setDesc('Filter references by tag (e.g., "literature" or "#literature")')
      .addText((text) => {
        text
          .setPlaceholder('#literature')
          .setValue(viewSettings.referencesFilterTag)
          .onChange(async (value) => {
            await settings.updateZettelkastenView({ referencesFilterTag: value })
          })
      })

    // Index filters
    new Setting(content)
      .setName('Index Filter Folder')
      .setDesc('Override default index folder (leave blank to use Index folder)')
      .addText((text) => {
        text
          .setPlaceholder('index')
          .setValue(viewSettings.indexFilterFolder)
          .onChange(async (value) => {
            await settings.updateZettelkastenView({ indexFilterFolder: value })
          })
      })

    new Setting(content)
      .setName('Index Filter Tag')
      .setDesc('Filter index by tag (e.g., "index" or "#index")')
      .addText((text) => {
        text
          .setPlaceholder('#index')
          .setValue(viewSettings.indexFilterTag)
          .onChange(async (value) => {
            await settings.updateZettelkastenView({ indexFilterTag: value })
          })
      })
  }

  private displayNoteSequenceSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const sequenceSettings = settings.getNoteSequences()

    const content = this.createCollapsibleSection(
      containerEl,
      'Note Sequences',
      'Visualize and navigate hierarchical note sequences with parent-child relationships.',
      false,
      {
        getValue: () => sequenceSettings.enabled,
        onChange: async (enabled) => {
          await settings.updateNoteSequences({ enabled })
        },
      }
    )

    if (!sequenceSettings.enabled) return

    new Setting(content)
      .setName('Show Note Sequence Cards')
      .setDesc('Display card view showing all note sequences')
      .addToggle((toggle) => {
        toggle.setValue(sequenceSettings.showSequencesView).onChange(async (value) => {
          await settings.updateNoteSequences({ showSequencesView: value })
        })
      })

    new Setting(content)
      .setName('Show Sequence Navigator')
      .setDesc("Display tree view of the current note's sequence in the sidebar")
      .addToggle((toggle) => {
        toggle.setValue(sequenceSettings.showSequenceNavigator).onChange(async (value) => {
          await settings.updateNoteSequences({ showSequenceNavigator: value })
        })
      })

    new Setting(content)
      .setName('Auto-open Navigator')
      .setDesc('Automatically open sequence navigator when opening a zettel note')
      .addToggle((toggle) => {
        toggle.setValue(sequenceSettings.autoOpenNavigator).onChange(async (value) => {
          await settings.updateNoteSequences({ autoOpenNavigator: value })
        })
      })
  }

  /**
   * Helper to add template file setting
   */
  private addTemplateFileSetting(
    container: HTMLElement,
    noteType: string,
    settings: { templatePath: string },
    onUpdate: (path: string) => Promise<void>
  ): void {
    new Setting(container)
      .setName('Template File')
      .setDesc(
        `Path to template file for ${noteType.toLowerCase()} notes (leave empty for default template)`
      )
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, async (value) => {
          text.setValue(value)
          await onUpdate(value)
        })

        text
          .setPlaceholder('templates/zettel-template.md')
          .setValue(settings.templatePath || '')
          .onChange(async (value) => {
            await onUpdate(value)
          })
      })
  }

  /**
   * Advanced Settings Section (non-collapsible)
   */
  private displayAdvancedSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()

    const sectionEl = containerEl.createDiv({ cls: 'settings-section' })
    sectionEl.createEl('h1', { text: 'Advanced' })

    new Setting(sectionEl)
      .setName('Import/Export Settings')
      .setDesc('Import or export all plugin settings as JSON')
      .addButton((button) => {
        button
          .setButtonText('Import/Export')
          .setCta()
          .onClick(() => {
            const modal = new ImportExportModal(this.app, settings, () => {
              this.display() // Refresh settings display after import
            })
            modal.open()
          })
      })

    new Setting(sectionEl)
      .setName('Reset to Defaults')
      .setDesc('Reset all settings to default values (cannot be undone)')
      .addButton((button) => {
        button
          .setButtonText('Reset')
          .setWarning()
          .onClick(async () => {
            await settings.resetToDefaults()
            new Notice('Settings reset to defaults')
            this.display()
          })
      })
  }
}
