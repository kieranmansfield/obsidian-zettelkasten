import {
  App,
  Notice,
  PluginSettingTab,
  type SettingDefinition,
  type SettingDefinitionItem,
  type SettingDefinitionPage,
  type SettingGroupItem,
} from 'obsidian'
import type ZettelkastenPlugin from '../main'
import { FilenameFormat, ZettelDetectionMode } from '../base/settings'
import { getIn } from '../base/objectPath'
import { TextSuggest, tagNames } from '../ui/TextSuggest'
import { ImportExportModal } from '../ui/ImportExportModal'
import { CommandsModal } from '../ui/CommandsModal'
import { DEFAULT_SETTINGS } from '../settings/DefaultSettings'

interface NoteTypePage {
  name: string
  desc: string
  key: 'zettel' | 'fleeting' | 'literature' | 'index' | 'projects'
  /** Setting names differ for zettels (zettelDetectionMode / zettelTag); omit for no detection settings */
  modeKey?: string
  tagKey?: string
  /** Allowed detection modes (default: all) */
  modes?: ZettelDetectionMode[]
  /** Settings shown under "Creation" */
  creation: SettingGroupItem[]
}

const toggle = (name: string, key: string, desc?: string): SettingDefinition => ({
  name,
  desc,
  control: { type: 'toggle', key },
})

const input =
  (type: 'text' | 'folder' | 'file') =>
  (name: string, key: string, desc?: string, placeholder?: string): SettingDefinition => ({
    name,
    desc,
    control: { type, key, placeholder },
  })
const text = input('text')
const folder = input('folder')
const file = input('file')

const dropdown = (
  name: string,
  key: string,
  options: Record<string, string>,
  desc?: string
): SettingDefinition => ({
  name,
  desc,
  control: { type: 'dropdown', key, options },
})

/**
 * SettingsTab
 *
 * Declarative settings (Obsidian 1.13+): the tab returns definitions, Obsidian renders them
 * and routes reads/writes through getControlValue / setControlValue using dotted keys
 * such as "zettel.enabled" into PluginSettings.
 */
export default class SettingsTab extends PluginSettingTab {
  plugin: ZettelkastenPlugin
  icon = 'square-library'

  constructor(app: App, plugin: ZettelkastenPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  // ============================================
  // Storage
  // ============================================
  // fallow-ignore-next-line unused-class-member
  getControlValue(key: string): unknown {
    return this.plugin.getSettingsManager().getPath(key)
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    // Emptied text fields fall back to the default (e.g. folder names, separator)
    const fallback = getIn(DEFAULT_SETTINGS, key)
    const next = value === '' && typeof fallback === 'string' && fallback ? fallback : value
    await this.plugin.getSettingsManager().setPath(key, next)
    this.refreshDomState()
  }

  private get<T>(key: string): T {
    return this.plugin.getSettingsManager().getPath(key) as T
  }

  private on = (key: string) => () => this.get<boolean>(key)
  private is = (key: string, value: unknown) => () => this.get<unknown>(key) === value
  private status = (key: string) => () => (this.get<boolean>(key) ? 'On' : 'Off')

  // ============================================
  // Definitions
  // ============================================
  // fallow-ignore-next-line unused-class-member
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Manage commands',
        desc: 'Enable or disable individual plugin commands',
        action: () => new CommandsModal(this.app, this.plugin).open(),
      },
      {
        type: 'group',
        heading: 'Organisation',
        items: [this.noteTypesPage()],
      },
      {
        type: 'group',
        heading: 'Interface',
        items: [this.sidebarPage(), this.sequencesPage()],
      },
      {
        type: 'group',
        heading: 'Maintenance',
        items: [this.advancedPage()],
      },
    ]
  }

  // ============================================
  // Note types
  // ============================================
  private noteTypesPage(): SettingDefinitionPage {
    const common = (label: string, key: string): SettingGroupItem[] => [
      file(
        'Template file',
        `${key}.templatePath`,
        'Path to template file (leave empty for default)',
        `templates/${label}.md`
      ),
      toggle(
        'Open on create',
        `${key}.openOnCreate`,
        `Open newly created ${label} notes in the editor`
      ),
    ]

    return {
      type: 'page',
      name: 'Note types',
      desc: 'Detection, folders and templates for each kind of note',
      items: [
        this.noteTypePage({
          name: 'Zettel notes',
          desc: 'Atomic notes with unique ids for building a knowledge network',
          key: 'zettel',
          modeKey: 'zettelDetectionMode',
          tagKey: 'zettelTag',
          // Tags and links would stamp type tags / bare links onto permanent notes
          modes: [ZettelDetectionMode.FOLDER, ZettelDetectionMode.PROPERTY],
          creation: [
            folder(
              'Slip-box folder',
              'zettel.defaultFolder',
              'One flat folder for zettels, structure notes and the Index. No subfolders.',
              'slipbox'
            ),
            dropdown(
              'Filename format',
              'zettel.filenameFormat',
              {
                [FilenameFormat.ID_ONLY]: 'ID only',
                [FilenameFormat.ID_TITLE]: 'ID + title',
              },
              'How zettel filenames are formatted'
            ),
            {
              ...text(
                'Separator',
                'zettel.separator',
                'Optional character(s) between ID and title (empty: "ID Title")'
              ),
              visible: this.is('zettel.filenameFormat', FilenameFormat.ID_TITLE),
            },
            ...common('zettel', 'zettel'),
          ],
        }),
        this.noteTypePage({
          name: 'Fleeting notes',
          desc: 'Temporary notes for quick capture and processing',
          key: 'fleeting',
          modeKey: 'detectionMode',
          tagKey: 'tag',
          creation: [
            folder('Folder', 'fleeting.folder', 'The single inbox for fleeting notes', 'inbox'),
            ...common('fleeting', 'fleeting'),
          ],
        }),
        this.noteTypePage({
          name: 'Literature notes',
          desc: 'Notes for external sources, books, articles and research',
          key: 'literature',
          modeKey: 'detectionMode',
          tagKey: 'tag',
          creation: [
            folder(
              'Folder',
              'literature.folder',
              'Folder for literature notes, one per source',
              'reference'
            ),
            ...common('literature', 'literature'),
          ],
        }),
        this.noteTypePage({
          name: 'Structure notes',
          desc: 'Notes in the slip-box that order and annotate zettels (type: structure)',
          key: 'index',
          creation: common('structure', 'index'),
        }),
        this.noteTypePage({
          name: 'Project notes',
          desc: 'Notes that group work towards a goal',
          key: 'projects',
          modeKey: 'detectionMode',
          tagKey: 'tag',
          creation: [
            folder('Folder', 'projects.folder', 'Folder for project notes', 'Projects'),
            ...common('project', 'projects'),
          ],
        }),
      ],
    }
  }

  private noteTypePage(o: NoteTypePage): SettingDefinitionPage {
    const enabled = this.on(`${o.key}.enabled`)
    const modeKey = `${o.key}.${o.modeKey}`
    const tagKey = `${o.key}.${o.tagKey}`
    const marker = 'New notes get this added automatically'
    const labels: Record<ZettelDetectionMode, string> = {
      [ZettelDetectionMode.FOLDER]: 'Folder-based',
      [ZettelDetectionMode.TAG]: 'Tag-based',
      [ZettelDetectionMode.LINK]: 'Link-based',
      [ZettelDetectionMode.PROPERTY]: 'Property-based',
    }
    const modes = o.modes ?? Object.values(ZettelDetectionMode)

    return {
      type: 'page',
      name: o.name,
      desc: o.desc,
      displayValue: this.status(`${o.key}.enabled`),
      items: [
        { type: 'group', items: [toggle(`Enable ${o.name.toLowerCase()}`, `${o.key}.enabled`)] },
        {
          type: 'group',
          heading: 'Detection',
          visible: () => enabled() && !!o.modeKey,
          items: [
            dropdown(
              'Detection mode',
              modeKey,
              Object.fromEntries(modes.map((m) => [m, labels[m]])),
              'Identify notes by folder location, tag, link or property'
            ),
            {
              name: 'Tag',
              desc: `Tag that marks these notes. ${marker}`,
              visible: this.is(modeKey, ZettelDetectionMode.TAG),
              render: (setting) => {
                setting.addText((input) => {
                  new TextSuggest(this.app, input.inputEl, tagNames(this.app), (value) => {
                    input.setValue(value)
                    void this.setControlValue(tagKey, value)
                  })
                  input
                    .setValue(this.get<string>(tagKey))
                    .onChange((value) => void this.setControlValue(tagKey, value))
                })
              },
            },
            {
              ...file('Link', tagKey, `Note that these notes link to. ${marker}`, 'My index note'),
              visible: this.is(modeKey, ZettelDetectionMode.LINK),
            },
            {
              ...text(
                'Property',
                tagKey,
                `"key: value", or "key:" for any value. List properties match any item. ${marker}`,
                `type: ${o.key}`
              ),
              visible: this.is(modeKey, ZettelDetectionMode.PROPERTY),
            },
          ],
        },
        { type: 'group', heading: 'Creation', visible: enabled, items: o.creation },
      ],
    }
  }

  // ============================================
  // Sidebar
  // ============================================
  private sidebarPage(): SettingDefinitionPage {
    const s = 'zettelkastenSidebar'
    const sections = [
      {
        label: 'Inbox',
        show: 'showInbox',
        name: 'inboxName',
        dash: 'dashboardFleetingNote',
        filter: 'inboxFilterTag',
      },
      {
        label: 'Zettels',
        show: 'showZettels',
        name: 'zettelsName',
        dash: 'dashboardZettelNote',
        filter: 'zettelsFilterTag',
      },
      {
        label: 'Literature',
        show: 'showLiterature',
        name: 'literatureName',
        dash: 'dashboardLiteratureNote',
        filter: 'literatureFilterTag',
      },
      {
        label: 'Structure notes',
        show: 'showIndex',
        name: 'indexName',
        dash: 'dashboardIndexNote',
        filter: 'indexFilterTag',
      },
      {
        label: 'Projects',
        show: 'showProjects',
        name: 'projectsName',
        dash: 'dashboardProjectsNote',
        filter: 'projectsFilterTag',
      },
    ]

    return {
      type: 'page',
      name: 'Sidebar',
      desc: 'The Zettelkasten sidebar: sections, names, dashboards and filters',
      items: [
        {
          type: 'group',
          items: [
            {
              type: 'page',
              name: 'Sections',
              desc: 'Which sections appear and what they are called',
              items: [
                {
                  type: 'group',
                  heading: 'Visibility',
                  items: sections.map((x) =>
                    toggle(`Show ${x.label.toLowerCase()}`, `${s}.${x.show}`)
                  ),
                },
                {
                  type: 'group',
                  heading: 'Names',
                  items: [
                    ...sections.map((x) =>
                      text(`${x.label} section name`, `${s}.${x.name}`, undefined, x.label)
                    ),
                    text('Bookmarks section name', `${s}.bookmarksName`, undefined, 'Bookmarks'),
                  ],
                },
              ],
            },
            {
              type: 'page',
              name: 'Dashboard notes',
              desc: 'Notes to open when clicking a section header',
              items: [
                {
                  type: 'group',
                  items: sections.map((x) =>
                    file(
                      `${x.label} dashboard note`,
                      `${s}.${x.dash}`,
                      `Note to open when clicking the ${x.label.toLowerCase()} section header`,
                      `path/to/${x.label.toLowerCase()}-dashboard.md`
                    )
                  ),
                },
              ],
            },
            {
              type: 'page',
              name: 'Section filters',
              desc: 'Narrow each section with a tag, link or property',
              items: [
                {
                  type: 'group',
                  items: sections.map((x) =>
                    text(
                      `${x.label} filter`,
                      `${s}.${x.filter}`,
                      'Additional tag, [[link]] or "key: value" property (leave empty for no filter)',
                      'project, [[note]] or status: active'
                    )
                  ),
                },
              ],
            },
          ],
        },
      ],
    }
  }

  // ============================================
  // Note sequences
  // ============================================
  private sequencesPage(): SettingDefinitionPage {
    const enabled = this.on('noteSequences.enabled')
    return {
      type: 'page',
      name: 'Note sequences',
      desc: 'Visualise and navigate hierarchical note sequences',
      displayValue: this.status('noteSequences.enabled'),
      items: [
        { type: 'group', items: [toggle('Enable note sequences', 'noteSequences.enabled')] },
        {
          type: 'group',
          visible: enabled,
          items: [
            toggle(
              'Show sequences view',
              'noteSequences.showSequencesView',
              'Display card view showing all note sequences'
            ),
          ],
        },
      ],
    }
  }

  // ============================================
  // Advanced
  // ============================================
  private advancedPage(): SettingDefinitionPage {
    const manager = this.plugin.getSettingsManager()

    return {
      type: 'page',
      name: 'Advanced',
      desc: 'Import/export and reset',
      items: [
        {
          type: 'group',
          heading: 'Data',
          items: [
            {
              name: 'Import/export settings',
              desc: 'Import or export all plugin settings as JSON',
              action: () => new ImportExportModal(this.app, manager, () => this.update()).open(),
            },
            {
              name: 'Reset to defaults',
              desc: 'Reset all settings to default values (cannot be undone)',
              action: () => {
                void (async () => {
                  await manager.resetToDefaults()
                  new Notice('Settings reset to defaults')
                  this.update()
                })()
              },
            },
          ],
        },
      ],
    }
  }
}
