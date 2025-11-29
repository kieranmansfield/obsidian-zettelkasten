import { TFile } from 'obsidian'

export interface FileRef {
  path: string
  name: string
  // Add other file metadata if needed
}

// Configuration options for file creation
export interface FileCreatorOptions {
  // Path where the file will be created
  readonly path: string
  // Title of the note (used as content header)
  readonly title: string
  // Optional template file path
  readonly templatePath?: string
  // Whether to open the file after creation
  readonly shouldOpen?: boolean
  // Optional callback executed after successful creation
  readonly onSuccess?: () => void
  // Optional callback executed on error
  readonly onError?: (error: Error) => void
}

// Result of file creation operation
export interface FileCreationResult {
  readonly success: boolean
  readonly file: TFile | null
  readonly error?: Error
}

export type LogType = 'info' | 'rename' | 'reorder' | 'conflict' | 'undo' | 'error'
export interface ZkLogEntry {
  id: string
  type: LogType
  ts: number
  msg: string
  data?: Record<string, unknown>
}
export interface ZkLogStore {
  entries: ZkLogEntry[]
}

export interface UndoAction {
  description: string
  undo: () => Promise<void> | void
  redo: () => Promise<void> | void
}

export interface BoxDefinition {
  id: string
  name: string
  path: string
}

export type SegmentType = 'letters' | 'numbers'

export interface Segment {
  readonly type: SegmentType
  readonly value: string
}

export interface ZettelNode {
  id: string
  file?: FileRef
  children: ZettelNode[]
}

export interface ZettelTree {
  root: ZettelNode
  nodes: Map<string, ZettelNode>
}

// PLUGIN INTERFACES

// Zettel ID matching modes
export type ZettelIdMatchingMode = 'strict' | 'separator' | 'fuzzy'

// Structure note modes
export type StructureNoteMode = 'moc' | 'zettelkasten'

// Zettel detection modes
export type ZettelDetectionMode = 'tag' | 'folder'

// Inbox modes
export type InboxMode = 'default' | 'fleeting'

// Plugin settings interface
export interface ZettelkastenPluginSettings {
  // General settings
  ignoredFolders: string[]
  newNoteLocation: string
  zettelsLocation: string

  // Zettel settings
  zettelDetectionMode: ZettelDetectionMode
  zettelIdFormat: string
  useSeparatorFormat: boolean
  zettelIdSeparator: string
  zettelIdMatchingMode: ZettelIdMatchingMode
  noteTemplatePath: string
  zettelTag: string
  useZettelPrefix: boolean
  zettelPrefix: string

  // Note Sequence settings
  enableNoteSequence: boolean
  enableNoteSequencesView: boolean
  enableSequenceNavigator: boolean

  // Inbox settings
  enableInbox: boolean
  inboxMode: InboxMode // "default" or "fleeting"
  inboxLocation: string

  // Default mode settings
  defaultInboxTemplatePath: string

  // Fleeting Notes mode settings
  fleetingNotesUseSeparateLocation: boolean
  fleetingNotesLocation: string
  fleetingNotesTemplatePath: string
  fleetingNotesUseZettelId: boolean
  fleetingNotesFilenameFormat: string
  fleetingNotesTag: string
  useFleetingNotesPrefix: boolean
  fleetingNotesPrefix: string

  // Structure Notes settings (MOCs and ZK Indexes)
  enableStructureNotes: boolean
  structureNoteMode: StructureNoteMode // "moc" or "zettelkasten"
  structureNotesUseSeparateLocation: boolean
  structureNotesLocation: string
  mocTemplatePath: string // Template for MOC mode
  zkIndexTemplatePath: string // Template for ZK Index mode
  structureNotesUseZettelId: boolean
  structureNotesFilenameFormat: string
  structureNotesTag: string
  useStructureNotesPrefix: boolean
  structureNotesPrefix: string

  // Reference settings
  enableReference: boolean
  referenceLocation: string

  // Projects settings
  enableProjects: boolean
  projectsLocation: string
  projectsTemplatePath: string

  // Zettelkasten Panel settings
  enableZettelkastenPanel: boolean
  panelShowFileLists: boolean
  panelShowFileIcons: boolean
  panelInboxName: string
  panelZettelsName: string
  panelReferencesName: string
  panelProjectsName: string
  panelBookmarksName: string
  panelNoteSequenceName: string
  panelWorkspacesName: string
  panelShowNoteSequence: boolean
  panelShowWorkspaces: boolean
  panelInboxDashboard: string
  panelInboxFilterTags: string[]
  panelZettelsDashboard: string
  panelZettelsFilterTags: string[]
  panelReferencesDashboard: string
  panelReferencesFilterTags: string[]
  panelProjectsDashboard: string
  panelProjectsFilterTags: string[]
  panelBookmarks: Array<{
    type: 'file' | 'search' | 'graph' | 'folder'
    path?: string
    title: string
    query?: string
  }>
  panelTagMatchMode: 'any' | 'all'
}

// Default settings values
export const DEFAULT_SETTINGS: ZettelkastenPluginSettings = {
  ignoredFolders: ['templates', 'scripts'],
  newNoteLocation: '',
  zettelsLocation: '',

  zettelDetectionMode: 'folder',
  zettelIdFormat: 'YYYYMMDDHHmmssSSS',
  useSeparatorFormat: false,
  zettelIdSeparator: '⁝ ',
  zettelIdMatchingMode: 'separator',
  noteTemplatePath: '',
  zettelTag: 'zettel',
  useZettelPrefix: false,
  zettelPrefix: 'z',

  enableNoteSequence: false,
  enableNoteSequencesView: true,
  enableSequenceNavigator: true,

  enableInbox: true,
  inboxMode: 'default',
  inboxLocation: '',

  defaultInboxTemplatePath: '',

  fleetingNotesUseSeparateLocation: false,
  fleetingNotesLocation: '',
  fleetingNotesTemplatePath: '',
  fleetingNotesUseZettelId: true,
  fleetingNotesFilenameFormat: '',
  fleetingNotesTag: 'fleeting',
  useFleetingNotesPrefix: false,
  fleetingNotesPrefix: 'f',

  enableStructureNotes: true,
  structureNoteMode: 'moc',
  structureNotesUseSeparateLocation: false,
  structureNotesLocation: '',
  mocTemplatePath: '',
  zkIndexTemplatePath: '',
  structureNotesUseZettelId: false,
  structureNotesFilenameFormat: '{{title}} Index',
  structureNotesTag: 'index',
  useStructureNotesPrefix: false,
  structureNotesPrefix: 'i',

  enableReference: false,
  referenceLocation: '',

  enableProjects: false,
  projectsLocation: '',
  projectsTemplatePath: '',

  enableZettelkastenPanel: true,
  panelShowFileLists: true,
  panelShowFileIcons: true,
  panelInboxName: 'Inbox',
  panelZettelsName: 'Zettels',
  panelReferencesName: 'References',
  panelProjectsName: 'Projects',
  panelBookmarksName: 'Bookmarks',
  panelNoteSequenceName: 'Note Sequence',
  panelWorkspacesName: 'Workspaces',
  panelShowNoteSequence: true,
  panelShowWorkspaces: false,
  panelInboxDashboard: '',
  panelInboxFilterTags: [],
  panelZettelsDashboard: '',
  panelZettelsFilterTags: [],
  panelReferencesDashboard: '',
  panelReferencesFilterTags: [],
  panelProjectsDashboard: '',
  panelProjectsFilterTags: [],
  panelBookmarks: [],
  panelTagMatchMode: 'any',
}

// UI

// Reorder
export type MoveMode = 'child' | 'sibling-after' | 'top'

export interface BoxCommand {
  id: string
  name: string
  icon?: string
  callback: () => void
}

export interface NavigationOption {
  direction: string
  label: string
  file: TFile | null
  disabled: boolean
}

// Settings interface for NewZettel
export interface NewZettelSettings {
  matchRule: 'strict' | 'separator' | 'fuzzy'
  separator: string
  addTitle: boolean
  addAlias: boolean
  templateFile: string
  templateRequireTitle: boolean
  templateRequireLink: boolean
  useLinkAlias: boolean
}

export interface SequenceNode {
  file: TFile
  zettelId: string
  level: number
  children: SequenceNode[]
}

export interface ParentNote {
  file: TFile
  zettelId: string
  children: SequenceNode[]
}

export interface SequenceTreeNode {
  file: TFile
  zettelId: string
  level: number
  children: SequenceTreeNode[]
  isCollapsed: boolean
}

export interface MenuItem {
  name: string
  icon: string
  folderName: string
  dashboardPath?: string
  filterTags?: string[]
}
