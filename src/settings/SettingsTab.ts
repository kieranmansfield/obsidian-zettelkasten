import { App, PluginSettingTab, Setting, Notice } from 'obsidian'
import type ZettelkastenPlugin from '../main'
import { FilenameFormat, BoxMode, ZettelDetectionMode } from '../base/settings'
import { FolderSuggest } from '../ui/FolderSuggest'
import { FileSuggest } from '../ui/FileSuggest'
import { TagSuggest } from '../ui/TagSuggest'
import { BoxConfigModal } from '../ui/BoxConfigModal'
import { ImportExportModal } from '../ui/ImportExportModal'
import { CommandsModal } from '../ui/CommandsModal'
import { createDefaultBoxConfig } from '../settings/DefaultSettings'

/**
 * SettingsTab
 *
 * Provides a clean, organized UI for all plugin settings using native Obsidian components.
 */
export default class SettingsTab extends PluginSettingTab {
  plugin: ZettelkastenPlugin
  icon = 'square-library'

  constructor(app: App, plugin: ZettelkastenPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    const settings = this.plugin.getSettingsManager()

    // Commands Management
    this.addCommandsSection(containerEl)

    // Box System
    this.addBoxSection(containerEl)

    // Note Type Settings (only when boxes are disabled)
    const boxSettings = settings.getBoxes()
    if (!boxSettings.enabled) {
      this.addZettelSection(containerEl)
      this.addFleetingSection(containerEl)
      this.addIndexSection(containerEl)
      this.addLiteratureSection(containerEl)
      this.addProjectSection(containerEl)
    }

    // Zettelkasten Sidebar View
    this.addZettelkastenViewSection(containerEl)

    // Note Sequences
    this.addNoteSequenceSection(containerEl)

    // Ignored Folders
    this.addIgnoredFoldersSection(containerEl)

    // Advanced
    this.addAdvancedSection(containerEl)
  }

  // ============================================
  // Commands Section
  // ============================================
  private addCommandsSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Commands').setHeading()

    new Setting(containerEl)
      .setName('Manage commands')
      .setDesc('Enable or disable individual plugin commands')
      .addButton((button) => {
        button
          .setButtonText('Manage commands')
          .setCta()
          .onClick(() => {
            new CommandsModal(this.app, this.plugin).open()
          })
      })
  }

  // ============================================
  // Box System Section
  // ============================================
  private addBoxSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const boxSettings = settings.getBoxes()

    new Setting(containerEl).setName('Box system').setHeading()

    containerEl.createEl('p', {
      text: 'Organize zettels into boxes (folders or tags). When disabled, all zettels go to a single folder.',
      cls: 'setting-item-description',
    })

    new Setting(containerEl)
      .setName('Enable box system')
      .setDesc('Use boxes to organize notes into separate collections')
      .addToggle((toggle) => {
        toggle.setValue(boxSettings.enabled).onChange((value) => {
          void (async () => {
            await settings.updateBoxes({ enabled: value })
            this.display()
          })()
        })
      })

    if (!boxSettings.enabled) {
      // Single folder mode
      new Setting(containerEl)
        .setName('Zettels folder')
        .setDesc('Folder where all zettels will be stored')
        .addText((text) => {
          new FolderSuggest(this.app, text.inputEl, (value) => {
            void settings.updateBoxes({ rootFolder: value })
          })

          text
            .setPlaceholder('Zettels')
            .setValue(boxSettings.rootFolder)
            .onChange((value) => {
              void settings.updateBoxes({ rootFolder: value || 'zettels' })
            })
        })
    } else {
      // Box system enabled
      new Setting(containerEl)
        .setName('Box mode')
        .setDesc('Organize boxes by folders or by tags')
        .addDropdown((dropdown) => {
          dropdown
            .addOption(BoxMode.FOLDER, 'Folders')
            .addOption(BoxMode.TAG, 'Tags')
            .setValue(boxSettings.mode)
            .onChange((value) => {
              void (async () => {
                await settings.updateBoxes({ mode: value as BoxMode })
                this.display()
              })()
            })
        })

      if (boxSettings.mode === BoxMode.FOLDER) {
        new Setting(containerEl)
          .setName('Root folder')
          .setDesc('Root folder containing all boxes')
          .addText((text) => {
            new FolderSuggest(this.app, text.inputEl, (value) => {
              void settings.updateBoxes({ rootFolder: value })
            })

            text
              .setPlaceholder('Zettels')
              .setValue(boxSettings.rootFolder)
              .onChange((value) => {
                void settings.updateBoxes({ rootFolder: value || 'zettels' })
              })
          })
      }

      new Setting(containerEl)
        .setName('Auto-create boxes')
        .setDesc('Automatically create boxes when referenced')
        .addToggle((toggle) => {
          toggle.setValue(boxSettings.autoCreateBoxes).onChange((value) => {
            void settings.updateBoxes({ autoCreateBoxes: value })
          })
        })

      // Boxes management
      new Setting(containerEl).setName('Boxes').setHeading()

      new Setting(containerEl)
        .setName('Add box')
        .setDesc('Configure boxes and their settings')
        .addButton((button) => {
          button
            .setButtonText('Add box')
            .setCta()
            .onClick(() => {
              const newBox = createDefaultBoxConfig()
              newBox.id = `box-${Date.now()}`
              newBox.name = 'New box'
              newBox.isDefault = false

              const modal = new BoxConfigModal(this.app, newBox, (config) => {
                void (async () => {
                  const newBoxes = [...boxSettings.boxes, config]
                  await settings.updateBoxes({ boxes: newBoxes })
                  this.display()
                })()
              })
              modal.open()
            })
        })

      // List existing boxes
      boxSettings.boxes.forEach((box, index) => {
        new Setting(containerEl)
          .setName(box.name)
          .setDesc(box.isDefault ? 'Default box' : `${boxSettings.mode}: ${box.value || '(root)'}`)
          .addButton((button) => {
            button.setButtonText('Edit').onClick(() => {
              const modal = new BoxConfigModal(this.app, box, (config) => {
                void (async () => {
                  const newBoxes = [...boxSettings.boxes]
                  newBoxes[index] = config
                  await settings.updateBoxes({ boxes: newBoxes })
                  this.display()
                })()
              })
              modal.open()
            })
          })
          .addButton((button) => {
            if (!box.isDefault) {
              button
                .setIcon('trash')
                .setTooltip('Delete box')
                .onClick(() => {
                  void (async () => {
                    const newBoxes = boxSettings.boxes.filter((_, i) => i !== index)
                    await settings.updateBoxes({ boxes: newBoxes })
                    this.display()
                  })()
                })
            }
          })
      })
    }
  }

  // ============================================
  // Zettel Notes Section
  // ============================================
  private addZettelSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const zettelSettings = settings.getZettel()

    new Setting(containerEl).setName('Zettel notes').setHeading()

    containerEl.createEl('p', {
      text: 'Atomic notes with unique ids for building a knowledge network.',
      cls: 'setting-item-description',
    })

    new Setting(containerEl).setName('Enable zettel notes').addToggle((toggle) => {
      toggle.setValue(zettelSettings.enabled).onChange((value) => {
        void (async () => {
          await settings.updateZettel({ enabled: value })
          this.display()
        })()
      })
    })

    if (!zettelSettings.enabled) return

    new Setting(containerEl)
      .setName('Detection mode')
      .setDesc('Identify zettel notes by folder location or tag')
      .addDropdown((dropdown) => {
        dropdown
          .addOption(ZettelDetectionMode.FOLDER, 'Folder-based')
          .addOption(ZettelDetectionMode.TAG, 'Tag-based')
          .setValue(zettelSettings.zettelDetectionMode)
          .onChange((value) => {
            void (async () => {
              await settings.updateZettel({ zettelDetectionMode: value as ZettelDetectionMode })
              this.display()
            })()
          })
      })

    if (zettelSettings.zettelDetectionMode === ZettelDetectionMode.TAG) {
      new Setting(containerEl)
        .setName('Zettel tag')
        .setDesc('Tag to identify zettel notes')
        .addText((text) => {
          new TagSuggest(this.app, text.inputEl, (value) => {
            void settings.updateZettel({ zettelTag: value })
          })

          text
            .setPlaceholder('Zettel')
            .setValue(zettelSettings.zettelTag)
            .onChange((value) => {
              void settings.updateZettel({ zettelTag: value || 'zettel' })
            })
        })
    }

    new Setting(containerEl)
      .setName('Default folder')
      .setDesc('Folder for zettel notes (relative to box root)')
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl, (value) => {
          void settings.updateZettel({ defaultFolder: value })
        })

        text
          .setPlaceholder('')
          .setValue(zettelSettings.defaultFolder)
          .onChange((value) => {
            void settings.updateZettel({ defaultFolder: value })
          })
      })

    new Setting(containerEl)
      .setName('Filename format')
      .setDesc('How zettel filenames should be formatted')
      .addDropdown((dropdown) => {
        dropdown
          .addOption(FilenameFormat.ID_ONLY, 'ID only')
          .addOption(FilenameFormat.ID_TITLE, 'ID + title')
          .setValue(zettelSettings.filenameFormat)
          .onChange((value) => {
            void (async () => {
              await settings.updateZettel({ filenameFormat: value as FilenameFormat })
              this.display()
            })()
          })
      })

    if (zettelSettings.filenameFormat === FilenameFormat.ID_TITLE) {
      new Setting(containerEl)
        .setName('Separator')
        .setDesc('Character(s) between ID and title')
        .addText((text) => {
          text
            .setPlaceholder('⁝')
            .setValue(zettelSettings.separator)
            .onChange((value) => {
              void settings.updateZettel({ separator: value || '⁝' })
            })
        })
    }

    new Setting(containerEl)
      .setName('Template file')
      .setDesc('Path to template file (leave empty for default)')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          void settings.updateZettel({ templatePath: value })
        })

        text
          .setPlaceholder('templates/zettel.md')
          .setValue(zettelSettings.templatePath)
          .onChange((value) => {
            void settings.updateZettel({ templatePath: value })
          })
      })

    new Setting(containerEl)
      .setName('Auto-link to parent')
      .setDesc('Automatically add link to parent when creating child zettel')
      .addToggle((toggle) => {
        toggle.setValue(zettelSettings.autoLinkToParent).onChange((value) => {
          void settings.updateZettel({ autoLinkToParent: value })
        })
      })

    new Setting(containerEl)
      .setName('Open on create')
      .setDesc('Open newly created zettels in the editor')
      .addToggle((toggle) => {
        toggle.setValue(zettelSettings.openOnCreate).onChange((value) => {
          void settings.updateZettel({ openOnCreate: value })
        })
      })
  }

  // ============================================
  // Fleeting Notes Section
  // ============================================
  private addFleetingSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const fleetingSettings = settings.getFleeting()

    new Setting(containerEl).setName('Fleeting notes').setHeading()

    containerEl.createEl('p', {
      text: 'Temporary notes for quick capture and processing.',
      cls: 'setting-item-description',
    })

    new Setting(containerEl).setName('Enable fleeting notes').addToggle((toggle) => {
      toggle.setValue(fleetingSettings.enabled).onChange((value) => {
        void (async () => {
          await settings.updateFleeting({ enabled: value })
          this.display()
        })()
      })
    })

    if (!fleetingSettings.enabled) return

    new Setting(containerEl)
      .setName('Folder')
      .setDesc('Folder for fleeting notes')
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl, (value) => {
          void settings.updateFleeting({ folder: value })
        })

        text
          .setPlaceholder('Fleeting')
          .setValue(fleetingSettings.folder)
          .onChange((value) => {
            void settings.updateFleeting({ folder: value || 'fleeting' })
          })
      })

    new Setting(containerEl)
      .setName('Template file')
      .setDesc('Path to template file (leave empty for default)')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          void settings.updateFleeting({ templatePath: value })
        })

        text
          .setPlaceholder('templates/fleeting.md')
          .setValue(fleetingSettings.templatePath)
          .onChange((value) => {
            void settings.updateFleeting({ templatePath: value })
          })
      })

    new Setting(containerEl)
      .setName('Open on create')
      .setDesc('Open newly created fleeting notes in the editor')
      .addToggle((toggle) => {
        toggle.setValue(fleetingSettings.openOnCreate).onChange((value) => {
          void settings.updateFleeting({ openOnCreate: value })
        })
      })
  }

  // ============================================
  // Index Notes Section
  // ============================================
  private addIndexSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const indexSettings = settings.getIndex()

    new Setting(containerEl).setName('Index notes').setHeading()

    containerEl.createEl('p', {
      text: 'Index/moc (map of content) notes for organizing and linking zettels.',
      cls: 'setting-item-description',
    })

    new Setting(containerEl).setName('Enable index notes').addToggle((toggle) => {
      toggle.setValue(indexSettings.enabled).onChange((value) => {
        void (async () => {
          await settings.updateIndex({ enabled: value })
          this.display()
        })()
      })
    })

    if (!indexSettings.enabled) return

    new Setting(containerEl)
      .setName('Folder')
      .setDesc('Folder for index notes')
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl, (value) => {
          void settings.updateIndex({ folder: value })
        })

        text
          .setPlaceholder('Index')
          .setValue(indexSettings.folder)
          .onChange((value) => {
            void settings.updateIndex({ folder: value || 'index' })
          })
      })

    new Setting(containerEl)
      .setName('Template file')
      .setDesc('Path to template file (leave empty for default)')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          void settings.updateIndex({ templatePath: value })
        })

        text
          .setPlaceholder('templates/index.md')
          .setValue(indexSettings.templatePath)
          .onChange((value) => {
            void settings.updateIndex({ templatePath: value })
          })
      })

    new Setting(containerEl)
      .setName('Open on create')
      .setDesc('Open newly created index notes in the editor')
      .addToggle((toggle) => {
        toggle.setValue(indexSettings.openOnCreate).onChange((value) => {
          void settings.updateIndex({ openOnCreate: value })
        })
      })
  }

  // ============================================
  // Literature Notes Section
  // ============================================
  private addLiteratureSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const literatureSettings = settings.getLiterature()

    new Setting(containerEl).setName('Literature notes').setHeading()

    containerEl.createEl('p', {
      text: 'Notes for referencing external sources, books, articles, and research.',
      cls: 'setting-item-description',
    })

    new Setting(containerEl).setName('Enable literature notes').addToggle((toggle) => {
      toggle.setValue(literatureSettings.enabled).onChange((value) => {
        void (async () => {
          await settings.updateLiterature({ enabled: value })
          this.display()
        })()
      })
    })

    if (!literatureSettings.enabled) return

    new Setting(containerEl)
      .setName('Folder')
      .setDesc('Folder for literature notes')
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl, (value) => {
          void settings.updateLiterature({ folder: value })
        })

        text
          .setPlaceholder('Literature')
          .setValue(literatureSettings.folder)
          .onChange((value) => {
            void settings.updateLiterature({ folder: value || 'literature' })
          })
      })

    new Setting(containerEl)
      .setName('Template file')
      .setDesc('Path to template file (leave empty for default)')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          void settings.updateLiterature({ templatePath: value })
        })

        text
          .setPlaceholder('templates/literature.md')
          .setValue(literatureSettings.templatePath)
          .onChange((value) => {
            void settings.updateLiterature({ templatePath: value })
          })
      })

    new Setting(containerEl)
      .setName('Open on create')
      .setDesc('Open newly created literature notes in the editor')
      .addToggle((toggle) => {
        toggle.setValue(literatureSettings.openOnCreate).onChange((value) => {
          void settings.updateLiterature({ openOnCreate: value })
        })
      })
  }

  // ============================================
  // Project Notes Section
  // ============================================
  private addProjectSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const projectSettings = settings.getProjects()

    new Setting(containerEl).setName('Project notes').setHeading()

    containerEl.createEl('p', {
      text: 'Notes for organizing and tracking projects, tasks, and long-term work.',
      cls: 'setting-item-description',
    })

    new Setting(containerEl).setName('Enable project notes').addToggle((toggle) => {
      toggle.setValue(projectSettings.enabled).onChange((value) => {
        void (async () => {
          await settings.updateProjects({ enabled: value })
          this.display()
        })()
      })
    })

    if (!projectSettings.enabled) return

    new Setting(containerEl)
      .setName('Detection mode')
      .setDesc('How to identify project notes')
      .addDropdown((dropdown) => {
        dropdown
          .addOption(ZettelDetectionMode.FOLDER, 'Folder-based')
          .addOption(ZettelDetectionMode.TAG, 'Tag-based')
          .setValue(projectSettings.detectionMode)
          .onChange((value) => {
            void (async () => {
              await settings.updateProjects({
                detectionMode: value as ZettelDetectionMode,
              })
              this.display()
            })()
          })
      })

    if (projectSettings.detectionMode === ZettelDetectionMode.TAG) {
      new Setting(containerEl)
        .setName('Tag')
        .setDesc('Tag to identify project notes (e.g., "project")')
        .addText((text) => {
          new TagSuggest(this.app, text.inputEl, (value) => {
            text.setValue(value)
            void settings.updateProjects({ tag: value })
          })

          text
            .setPlaceholder('project')
            .setValue(projectSettings.tag)
            .onChange((value) => {
              void settings.updateProjects({ tag: value || 'project' })
            })
        })
    } else {
      new Setting(containerEl)
        .setName('Folder')
        .setDesc('Folder for project notes')
        .addText((text) => {
          new FolderSuggest(this.app, text.inputEl, (value) => {
            text.setValue(value)
            void settings.updateProjects({ folder: value })
          })

          text
            .setPlaceholder('projects')
            .setValue(projectSettings.folder)
            .onChange((value) => {
              void settings.updateProjects({ folder: value || 'projects' })
            })
        })
    }

    new Setting(containerEl)
      .setName('Template file')
      .setDesc('Path to template file (leave empty for default)')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          void settings.updateProjects({ templatePath: value })
        })

        text
          .setPlaceholder('templates/project.md')
          .setValue(projectSettings.templatePath)
          .onChange((value) => {
            void settings.updateProjects({ templatePath: value })
          })
      })

    new Setting(containerEl)
      .setName('Open on create')
      .setDesc('Open newly created project notes in the editor')
      .addToggle((toggle) => {
        toggle.setValue(projectSettings.openOnCreate).onChange((value) => {
          void settings.updateProjects({ openOnCreate: value })
        })
      })
  }

  // ============================================
  // Zettelkasten Sidebar View Section
  // ============================================
  private addZettelkastenViewSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const viewSettings = settings.getZettelkastenView()

    containerEl.createEl('p', {
      text: 'Browse your notes by type in a collapsible sidebar view.',
      cls: 'setting-item-description',
    })

    new Setting(containerEl).setName('Enable sidebar view').addToggle((toggle) => {
      toggle.setValue(viewSettings.enabled).onChange((value) => {
        void (async () => {
          await settings.updateZettelkastenView({ enabled: value })
          this.display()
        })()
      })
    })

    if (!viewSettings.enabled) return

    // Section visibility
    new Setting(containerEl).setName('Section visibility').setHeading()

    new Setting(containerEl).setName('Show inbox').addToggle((toggle) => {
      toggle.setValue(viewSettings.showInbox).onChange((value) => {
        void settings.updateZettelkastenView({ showInbox: value })
      })
    })

    new Setting(containerEl).setName('Show zettels').addToggle((toggle) => {
      toggle.setValue(viewSettings.showZettels).onChange((value) => {
        void settings.updateZettelkastenView({ showZettels: value })
      })
    })

    new Setting(containerEl).setName('Show literature').addToggle((toggle) => {
      toggle.setValue(viewSettings.showLiterature ?? true).onChange((value) => {
        void settings.updateZettelkastenView({ showLiterature: value })
      })
    })

    new Setting(containerEl).setName('Show index').addToggle((toggle) => {
      toggle.setValue(viewSettings.showIndex).onChange((value) => {
        void settings.updateZettelkastenView({ showIndex: value })
      })
    })

    new Setting(containerEl).setName('Show projects').addToggle((toggle) => {
      toggle.setValue(viewSettings.showProjects ?? false).onChange((value) => {
        void settings.updateZettelkastenView({ showProjects: value })
      })
    })

    // Section names
    new Setting(containerEl).setName('Section names').setHeading()

    new Setting(containerEl).setName('Inbox section name').addText((text) => {
      text
        .setPlaceholder('Inbox')
        .setValue(viewSettings.inboxName || 'Inbox')
        .onChange((value) => {
          void settings.updateZettelkastenView({ inboxName: value })
        })
    })

    new Setting(containerEl).setName('Zettels section name').addText((text) => {
      text
        .setPlaceholder('Zettels')
        .setValue(viewSettings.zettelsName || 'Zettels')
        .onChange((value) => {
          void settings.updateZettelkastenView({ zettelsName: value })
        })
    })

    new Setting(containerEl).setName('Literature section name').addText((text) => {
      text
        .setPlaceholder('Literature')
        .setValue(viewSettings.literatureName || 'Literature')
        .onChange((value) => {
          void settings.updateZettelkastenView({ literatureName: value })
        })
    })

    new Setting(containerEl).setName('Index section name').addText((text) => {
      text
        .setPlaceholder('Index')
        .setValue(viewSettings.indexName || 'Index')
        .onChange((value) => {
          void settings.updateZettelkastenView({ indexName: value })
        })
    })

    new Setting(containerEl).setName('Projects section name').addText((text) => {
      text
        .setPlaceholder('Projects')
        .setValue(viewSettings.projectsName || 'Projects')
        .onChange((value) => {
          void settings.updateZettelkastenView({ projectsName: value })
        })
    })

    // Dashboard notes
    new Setting(containerEl).setName('Dashboard notes').setHeading()

    containerEl.createEl('p', {
      text: 'Optional dashboard notes to open when clicking section headers',
      cls: 'setting-item-description',
    })

    new Setting(containerEl)
      .setName('Inbox dashboard note')
      .setDesc('Note to open when clicking the inbox section header')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ dashboardFleetingNote: value })
        })

        text
          .setPlaceholder('path/to/inbox-dashboard.md')
          .setValue(viewSettings.dashboardFleetingNote || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ dashboardFleetingNote: value })
          })
      })

    new Setting(containerEl)
      .setName('Zettels dashboard note')
      .setDesc('Note to open when clicking the zettels section header')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ dashboardZettelNote: value })
        })

        text
          .setPlaceholder('path/to/zettels-dashboard.md')
          .setValue(viewSettings.dashboardZettelNote || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ dashboardZettelNote: value })
          })
      })

    new Setting(containerEl)
      .setName('Literature dashboard note')
      .setDesc('Note to open when clicking the literature section header')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ dashboardLiteratureNote: value })
        })

        text
          .setPlaceholder('path/to/literature-dashboard.md')
          .setValue(viewSettings.dashboardLiteratureNote || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ dashboardLiteratureNote: value })
          })
      })

    new Setting(containerEl)
      .setName('Index dashboard note')
      .setDesc('Note to open when clicking the index section header')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ dashboardIndexNote: value })
        })

        text
          .setPlaceholder('path/to/index-dashboard.md')
          .setValue(viewSettings.dashboardIndexNote || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ dashboardIndexNote: value })
          })
      })

    new Setting(containerEl)
      .setName('Projects dashboard note')
      .setDesc('Note to open when clicking the projects section header')
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ dashboardProjectsNote: value })
        })

        text
          .setPlaceholder('path/to/projects-dashboard.md')
          .setValue(viewSettings.dashboardProjectsNote || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ dashboardProjectsNote: value })
          })
      })

    // Section filters
    new Setting(containerEl).setName('Section filters').setHeading()

    containerEl.createEl('p', {
      text: 'Optional tags to further filter notes in each section',
      cls: 'setting-item-description',
    })

    new Setting(containerEl)
      .setName('Inbox filter tag')
      .setDesc('Additional tag to filter inbox notes (leave empty for no filter)')
      .addText((text) => {
        new TagSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ inboxFilterTag: value })
        })

        text
          .setPlaceholder('Optional filter tag')
          .setValue(viewSettings.inboxFilterTag || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ inboxFilterTag: value })
          })
      })

    new Setting(containerEl)
      .setName('Zettels filter tag')
      .setDesc('Additional tag to filter zettel notes (leave empty for no filter)')
      .addText((text) => {
        new TagSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ zettelsFilterTag: value })
        })

        text
          .setPlaceholder('Optional filter tag')
          .setValue(viewSettings.zettelsFilterTag || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ zettelsFilterTag: value })
          })
      })

    new Setting(containerEl)
      .setName('Literature filter tag')
      .setDesc('Additional tag to filter literature notes (leave empty for no filter)')
      .addText((text) => {
        new TagSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ literatureFilterTag: value })
        })

        text
          .setPlaceholder('Optional filter tag')
          .setValue(viewSettings.literatureFilterTag || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ literatureFilterTag: value })
          })
      })

    new Setting(containerEl)
      .setName('Index filter tag')
      .setDesc('Additional tag to filter index notes (leave empty for no filter)')
      .addText((text) => {
        new TagSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ indexFilterTag: value })
        })

        text
          .setPlaceholder('Optional filter tag')
          .setValue(viewSettings.indexFilterTag || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ indexFilterTag: value })
          })
      })

    new Setting(containerEl)
      .setName('Projects filter tag')
      .setDesc('Additional tag to filter project notes (leave empty for no filter)')
      .addText((text) => {
        new TagSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          void settings.updateZettelkastenView({ projectsFilterTag: value })
        })

        text
          .setPlaceholder('Optional filter tag')
          .setValue(viewSettings.projectsFilterTag || '')
          .onChange((value) => {
            void settings.updateZettelkastenView({ projectsFilterTag: value })
          })
      })
  }

  // ============================================
  // Note Sequences Section
  // ============================================
  private addNoteSequenceSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const sequenceSettings = settings.getNoteSequences()

    new Setting(containerEl).setName('Note sequences').setHeading()

    containerEl.createEl('p', {
      text: 'Visualize and navigate hierarchical note sequences with parent-child relationships.',
      cls: 'setting-item-description',
    })

    new Setting(containerEl).setName('Enable note sequences').addToggle((toggle) => {
      toggle.setValue(sequenceSettings.enabled).onChange((value) => {
        void (async () => {
          await settings.updateNoteSequences({ enabled: value })
          this.display()
        })()
      })
    })

    if (!sequenceSettings.enabled) return

    new Setting(containerEl)
      .setName('Show sequences view')
      .setDesc('Display card view showing all note sequences')
      .addToggle((toggle) => {
        toggle.setValue(sequenceSettings.showSequencesView).onChange((value) => {
          void settings.updateNoteSequences({ showSequencesView: value })
        })
      })

    new Setting(containerEl)
      .setName('Show sequence navigator sidebar')
      .setDesc("Display tree view of the current note's sequence in the sidebar")
      .addToggle((toggle) => {
        toggle.setValue(sequenceSettings.showSequenceNavigator).onChange((value) => {
          void settings.updateNoteSequences({ showSequenceNavigator: value })
        })
      })

    new Setting(containerEl)
      .setName('Auto-open navigator')
      .setDesc('Automatically open sequence navigator when opening a zettel note')
      .addToggle((toggle) => {
        toggle.setValue(sequenceSettings.autoOpenNavigator).onChange((value) => {
          void settings.updateNoteSequences({ autoOpenNavigator: value })
        })
      })
  }

  // ============================================
  // Ignored Folders Section
  // ============================================
  private addIgnoredFoldersSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const generalSettings = settings.getGeneral()

    new Setting(containerEl).setName('Ignored folders').setHeading()

    new Setting(containerEl)
      .setName('Add ignored folder')
      .setDesc('Folders to exclude from indexing and search')
      .addButton((button) => {
        button
          .setButtonText('Add folder')
          .setCta()
          .onClick(() => {
            void (async () => {
              const newFolders = [...generalSettings.ignoredFolders, '']
              await settings.updateGeneral({ ignoredFolders: newFolders })
              this.display()
            })()
          })
      })

    generalSettings.ignoredFolders.forEach((folder, index) => {
      new Setting(containerEl)
        .addText((text) => {
          new FolderSuggest(this.app, text.inputEl, (value) => {
            const newFolders = [...generalSettings.ignoredFolders]
            newFolders[index] = value
            void settings.updateGeneral({ ignoredFolders: newFolders })
          })

          text
            .setPlaceholder('Folder/path')
            .setValue(folder)
            .onChange((value) => {
              const newFolders = [...generalSettings.ignoredFolders]
              newFolders[index] = value
              void settings.updateGeneral({ ignoredFolders: newFolders })
            })
        })
        .addButton((button) => {
          button
            .setIcon('trash')
            .setTooltip('Remove folder')
            .onClick(() => {
              void (async () => {
                const newFolders = generalSettings.ignoredFolders.filter((_, i) => i !== index)
                await settings.updateGeneral({ ignoredFolders: newFolders })
                this.display()
              })()
            })
        })
    })
  }

  // ============================================
  // Advanced Section
  // ============================================
  private addAdvancedSection(containerEl: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()

    new Setting(containerEl).setName('Advanced').setHeading()

    new Setting(containerEl)
      .setName('Import/export settings')
      .setDesc('Import or export all plugin settings as JSON')
      .addButton((button) => {
        button
          .setButtonText('Import/export')
          .setCta()
          .onClick(() => {
            const modal = new ImportExportModal(this.app, settings, () => {
              this.display()
            })
            modal.open()
          })
      })

    new Setting(containerEl)
      .setName('Reset to defaults')
      .setDesc('Reset all settings to default values (cannot be undone)')
      .addButton((button) => {
        button
          .setButtonText('Reset')
          .setWarning()
          .onClick(() => {
            void (async () => {
              await settings.resetToDefaults()
              new Notice('Settings reset to defaults')
              this.display()
            })()
          })
      })
  }
}
