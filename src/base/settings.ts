/**
 * Plugin Settings
 *
 * Defines all configurable settings for the Zettelkasten plugin
 */

/**
 * Filename format modes for zettel notes
 */
export enum FilenameFormat {
  /**
   * Pure ZettelId only (e.g., "20240612153000000a1b2.md")
   */
  ID_ONLY = 'id-only',

  /**
   * ZettelId + separator + title (e.g., "20240612153000000a1b2 ⁝ My Note.md")
   */
  ID_TITLE = 'id-title',
}

/**
 * Zettel detection mode
 */
export enum ZettelDetectionMode {
  /**
   * Detect zettels based on folder location
   */
  FOLDER = 'folder',

  /**
   * Detect zettels based on tags
   */
  TAG = 'tag',
}

/**
 * General plugin settings
 */
export interface GeneralSettings {
  /**
   * Folders to ignore when indexing/searching
   * @default []
   */
  ignoredFolders: string[]
}

/**
 * Settings for command availability
 */
export interface CommandSettings {
  /**
   * Map of command ID to enabled state
   * If command ID is not in map, uses command's default enabled state
   */
  enabledCommands: Record<string, boolean>
}

/**
 * Box mode type
 */
export enum BoxMode {
  /**
   * Boxes organized by folders
   */
  FOLDER = 'folder',

  /**
   * Boxes organized by tags
   */
  TAG = 'tag',
}

/**
 * Individual box configuration
 */
export interface BoxConfig {
  /**
   * Box ID (unique identifier)
   */
  id: string

  /**
   * Box name
   */
  name: string

  /**
   * Box value (folder path or tag name depending on mode)
   */
  value: string

  /**
   * Whether this is the default box (non-deletable)
   */
  isDefault: boolean

  /**
   * Note type settings for this box
   */
  zettel: ZettelSettings
  fleeting: FleetingSettings
  index: IndexSettings
  literature: LiteratureSettings
}

/**
 * Settings for box management
 */
export interface BoxSettings {
  /**
   * Enable/disable the box system
   * When disabled, all notes go to a single folder
   * @default false
   */
  enabled: boolean

  /**
   * Box organization mode (folder or tag based)
   * @default BoxMode.FOLDER
   */
  mode: BoxMode

  /**
   * Root folder for all boxes (or single folder when boxes disabled)
   * @default "zettels"
   */
  rootFolder: string

  /**
   * Default box/folder for new zettels when not specified
   * @default ""
   */
  defaultBox: string

  /**
   * Whether to create boxes automatically when referenced
   * Only applies when boxes are enabled
   * @default true
   */
  autoCreateBoxes: boolean

  /**
   * Array of configured boxes (when boxes enabled)
   * @default []
   */
  boxes: BoxConfig[]
}

/**
 * Settings for zettel notes
 */
export interface ZettelSettings {
  /**
   * Enable/disable zettel note type
   * @default true
   */
  enabled: boolean

  /**
   * How to detect zettel notes (folder-based or tag-based)
   * @default ZettelDetectionMode.FOLDER
   */
  zettelDetectionMode: ZettelDetectionMode

  /**
   * Tag to identify zettel notes (only used when zettelDetectionMode is TAG)
   * @default "zettel"
   */
  zettelTag: string

  /**
   * Format for ZettelId timestamps
   * @default "YYYYMMDDHHmmssSSS"
   */
  zettelIdFormat: string

  /**
   * Default folder for zettel notes (relative to box root)
   * @default ""
   */
  defaultFolder: string

  /**
   * Path to template file (relative to vault root)
   * If empty, uses inline template
   * @default ""
   */
  templatePath: string

  /**
   * Inline template content (used if templatePath is empty)
   * @default "# {{title}}\n\n"
   */
  template: string

  /**
   * Filename format mode
   * @default FilenameFormat.ID_ONLY
   */
  filenameFormat: FilenameFormat

  /**
   * Separator between ID and title (only used when filenameFormat is ID_TITLE)
   * @default "⁝"
   */
  separator: string

  /**
   * Whether to automatically link to parent when creating child zettel
   * @default true
   */
  autoLinkToParent: boolean

  /**
   * Whether to open newly created zettels in editor
   * @default true
   */
  openOnCreate: boolean
}

/**
 * Settings for fleeting notes
 */
export interface FleetingSettings {
  /**
   * Enable/disable fleeting note type
   * @default true
   */
  enabled: boolean

  /**
   * How to detect fleeting notes (folder-based or tag-based)
   * @default ZettelDetectionMode.FOLDER
   */
  detectionMode: ZettelDetectionMode

  /**
   * Tag to identify fleeting notes (only used when detectionMode is TAG)
   * @default "fleeting"
   */
  tag: string

  /**
   * Folder for fleeting notes
   * @default "fleeting"
   */
  folder: string

  /**
   * Path to template file (relative to vault root)
   * If empty, uses inline template
   * @default ""
   */
  templatePath: string

  /**
   * Inline template content (used if templatePath is empty)
   * @default "# {{title}}\n\n"
   */
  template: string

  /**
   * Whether to open newly created fleeting notes in editor
   * @default true
   */
  openOnCreate: boolean
}

/**
 * Settings for index notes
 */
export interface IndexSettings {
  /**
   * Enable/disable index note type
   * @default true
   */
  enabled: boolean

  /**
   * How to detect index notes (folder-based or tag-based)
   * @default ZettelDetectionMode.FOLDER
   */
  detectionMode: ZettelDetectionMode

  /**
   * Tag to identify index notes (only used when detectionMode is TAG)
   * @default "index"
   */
  tag: string

  /**
   * Folder for index notes
   * @default "index"
   */
  folder: string

  /**
   * Path to template file (relative to vault root)
   * If empty, uses inline template
   * @default ""
   */
  templatePath: string

  /**
   * Inline template content (used if templatePath is empty)
   * @default "# {{title}}\n\n## Overview\n\n## Notes\n\n"
   */
  template: string

  /**
   * Whether to open newly created index notes in editor
   * @default true
   */
  openOnCreate: boolean
}

/**
 * Settings for literature notes
 */
export interface LiteratureSettings {
  /**
   * Enable/disable literature note type
   * @default true
   */
  enabled: boolean

  /**
   * How to detect literature notes (folder-based or tag-based)
   * @default ZettelDetectionMode.FOLDER
   */
  detectionMode: ZettelDetectionMode

  /**
   * Tag to identify literature notes (only used when detectionMode is TAG)
   * @default "literature"
   */
  tag: string

  /**
   * Folder for literature notes
   * @default "literature"
   */
  folder: string

  /**
   * Path to template file (relative to vault root)
   * If empty, uses inline template
   * @default ""
   */
  templatePath: string

  /**
   * Inline template content (used if templatePath is empty)
   * @default "# {{title}}\n\n## Metadata\n- Author: \n- Year: \n- Type: \n\n## Summary\n\n## Key Points\n\n"
   */
  template: string

  /**
   * Whether to open newly created literature notes in editor
   * @default true
   */
  openOnCreate: boolean
}

/**
 * Bookmark type for saved references
 */
export interface Bookmark {
  type: 'file' | 'search' | 'graph' | 'folder'
  path?: string
  title: string
  query?: string
}

/**
 * Settings for projects
 */
export interface ProjectSettings {
  /**
   * Enable/disable projects section
   * @default false
   */
  enabled: boolean

  /**
   * How to detect project notes (folder-based or tag-based)
   * @default ZettelDetectionMode.FOLDER
   */
  detectionMode: ZettelDetectionMode

  /**
   * Tag to identify project notes (only used when detectionMode is TAG)
   * @default "project"
   */
  tag: string

  /**
   * Folder for project notes
   * @default "projects"
   */
  folder: string

  /**
   * Path to template file (relative to vault root)
   * If empty, uses inline template
   * @default ""
   */
  templatePath: string

  /**
   * Inline template content (used if templatePath is empty)
   * @default "# {{title}}\n\n## Overview\n\n## Tasks\n\n"
   */
  template: string

  /**
   * Whether to open newly created project notes in editor
   * @default true
   */
  openOnCreate: boolean
}

/**
 * Settings for the Zettelkasten sidebar view
 */
export interface ZettelkastenViewSettings {
  /**
   * Enable/disable Zettelkasten sidebar view
   * @default true
   */
  enabled: boolean

  /**
   * Custom name for inbox section
   * @default "Inbox"
   */
  inboxName: string

  /**
   * Custom name for zettels section
   * @default "Zettels"
   */
  zettelsName: string

  /**
   * Custom name for literature section
   * @default "Literature"
   */
  literatureName: string

  /**
   * Custom name for index section
   * @default "Index"
   */
  indexName: string

  /**
   * Custom name for projects section
   * @default "Projects"
   */
  projectsName: string

  /**
   * Custom name for bookmarks section
   * @default "Bookmarks"
   */
  bookmarksName: string

  /**
   * Show inbox section in sidebar
   * @default true
   */
  showInbox: boolean

  /**
   * Show inbox files subsection
   * @default true
   */
  showInboxFiles: boolean

  /**
   * Show zettels section in sidebar
   * @default true
   */
  showZettels: boolean

  /**
   * Show zettel files subsection
   * @default true
   */
  showZettelFiles: boolean

  /**
   * Show literature section in sidebar
   * @default true
   */
  showLiterature: boolean

  /**
   * Show literature files subsection
   * @default true
   */
  showLiteratureFiles: boolean

  /**
   * Show index section in sidebar
   * @default true
   */
  showIndex: boolean

  /**
   * Show index files subsection
   * @default true
   */
  showIndexFiles: boolean

  /**
   * Show projects section in sidebar
   * @default false
   */
  showProjects: boolean

  /**
   * Show project files subsection
   * @default true
   */
  showProjectFiles: boolean

  /**
   * Dashboard note for fleeting/inbox section
   * @default ""
   */
  dashboardFleetingNote: string

  /**
   * Dashboard note for zettel section
   * @default ""
   */
  dashboardZettelNote: string

  /**
   * Dashboard note for literature section
   * @default ""
   */
  dashboardLiteratureNote: string

  /**
   * Dashboard note for index section
   * @default ""
   */
  dashboardIndexNote: string

  /**
   * Dashboard note for projects section
   * @default ""
   */
  dashboardProjectsNote: string

  /**
   * Filter tag for inbox section (empty = no additional filter)
   * @default ""
   */
  inboxFilterTag: string

  /**
   * Filter tag for zettels section (empty = no additional filter)
   * @default ""
   */
  zettelsFilterTag: string

  /**
   * Filter tag for literature section (empty = no additional filter)
   * @default ""
   */
  literatureFilterTag: string

  /**
   * Filter tag for index section (empty = no additional filter)
   * @default ""
   */
  indexFilterTag: string

  /**
   * Filter tag for projects section (empty = no additional filter)
   * @default ""
   */
  projectsFilterTag: string

  /**
   * Saved bookmarks
   * @default []
   */
  bookmarks: Bookmark[]

  // Keep old property for backward compatibility during migration
  /**
   * @deprecated Use showLiterature instead
   */
  showReferences?: boolean

  /**
   * @deprecated Use showLiteratureFiles instead
   */
  showReferenceFiles?: boolean

  /**
   * @deprecated Use literatureFilterTag instead
   */
  referencesFilterTag?: string
}

/**
 * Settings for note sequences
 */
export interface NoteSequenceSettings {
  /**
   * Enable/disable note sequences feature
   * @default true
   */
  enabled: boolean

  /**
   * Show sequences view (card view of all sequences)
   * @default true
   */
  showSequencesView: boolean

  /**
   * Show sequence navigator (tree view of current note's sequence)
   * @default true
   */
  showSequenceNavigator: boolean

  /**
   * Auto-open sequence navigator when opening a zettel
   * @default false
   */
  autoOpenNavigator: boolean
}

/**
 * Main plugin settings interface
 */
export interface PluginSettings {
  /**
   * Plugin version (for migration purposes)
   */
  version: string

  /**
   * General settings
   */
  general: GeneralSettings

  /**
   * Command settings
   */
  commands: CommandSettings

  /**
   * Box settings
   */
  boxes: BoxSettings

  /**
   * Zettel note settings
   */
  zettel: ZettelSettings

  /**
   * Fleeting note settings
   */
  fleeting: FleetingSettings

  /**
   * Index note settings
   */
  index: IndexSettings

  /**
   * Literature note settings
   */
  literature: LiteratureSettings

  /**
   * Project note settings
   */
  projects: ProjectSettings

  /**
   * Zettelkasten sidebar view settings
   */
  zettelkastenView: ZettelkastenViewSettings

  /**
   * Note sequence settings
   */
  noteSequences: NoteSequenceSettings
}
