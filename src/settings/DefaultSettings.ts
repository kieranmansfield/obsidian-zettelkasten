import {
  FilenameFormat,
  PluginSettings,
  BoxMode,
  ZettelSettings,
  FleetingSettings,
  IndexSettings,
  LiteratureSettings,
  ProjectSettings,
  BoxConfig,
  ZettelDetectionMode,
  ZettelkastenViewSettings,
  NoteSequenceSettings,
} from '../base/settings'

/**
 * Default zettel settings
 */
export const DEFAULT_ZETTEL_SETTINGS: ZettelSettings = {
  enabled: true,
  zettelDetectionMode: ZettelDetectionMode.FOLDER,
  zettelTag: 'zettel',
  zettelIdFormat: 'YYYYMMDDHHmmssSSS',
  defaultFolder: '',
  templatePath: '',
  template: '# {{title}}\n\n',
  filenameFormat: FilenameFormat.ID_ONLY,
  separator: '⁝',
  autoLinkToParent: true,
  openOnCreate: true,
}

/**
 * Default fleeting settings
 */
export const DEFAULT_FLEETING_SETTINGS: FleetingSettings = {
  enabled: true,
  detectionMode: ZettelDetectionMode.FOLDER,
  tag: 'fleeting',
  folder: 'fleeting',
  templatePath: '',
  template: '# {{title}}\n\n',
  openOnCreate: true,
}

/**
 * Default index settings
 */
export const DEFAULT_INDEX_SETTINGS: IndexSettings = {
  enabled: true,
  detectionMode: ZettelDetectionMode.FOLDER,
  tag: 'index',
  folder: 'index',
  templatePath: '',
  template: '# {{title}}\n\n## Overview\n\n## Notes\n\n',
  openOnCreate: true,
}

/**
 * Default literature settings
 */
export const DEFAULT_LITERATURE_SETTINGS: LiteratureSettings = {
  enabled: true,
  detectionMode: ZettelDetectionMode.FOLDER,
  tag: 'literature',
  folder: 'literature',
  templatePath: '',
  template:
    '# {{title}}\n\n## Metadata\n- Author: \n- Year: \n- Type: \n\n## Summary\n\n## Key Points\n\n',
  openOnCreate: true,
}

/**
 * Default project settings
 */
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  enabled: false,
  detectionMode: ZettelDetectionMode.FOLDER,
  tag: 'project',
  folder: 'projects',
  templatePath: '',
  template: '# {{title}}\n\n## Overview\n\n## Tasks\n\n',
  openOnCreate: true,
}

/**
 * Default Zettelkasten view settings
 */
export const DEFAULT_ZETTELKASTEN_VIEW_SETTINGS: ZettelkastenViewSettings = {
  enabled: true,
  inboxName: 'Inbox',
  zettelsName: 'Zettels',
  literatureName: 'Literature',
  indexName: 'Index',
  projectsName: 'Projects',
  bookmarksName: 'Bookmarks',
  showInbox: true,
  showInboxFiles: true,
  showZettels: true,
  showZettelFiles: true,
  showLiterature: true,
  showLiteratureFiles: true,
  showIndex: true,
  showIndexFiles: true,
  showProjects: false,
  showProjectFiles: true,
  dashboardFleetingNote: '',
  dashboardZettelNote: '',
  dashboardLiteratureNote: '',
  dashboardIndexNote: '',
  dashboardProjectsNote: '',
  inboxFilterTag: '',
  zettelsFilterTag: '',
  literatureFilterTag: '',
  indexFilterTag: '',
  projectsFilterTag: '',
  bookmarks: [],
}

/**
 * Default note sequence settings
 */
export const DEFAULT_NOTE_SEQUENCE_SETTINGS: NoteSequenceSettings = {
  enabled: true,
  showSequencesView: true,
  showSequenceNavigator: true,
  autoOpenNavigator: false,
}

/**
 * Create a default box configuration
 */
export function createDefaultBoxConfig(): BoxConfig {
  return {
    id: 'default',
    name: 'Default',
    value: '',
    isDefault: true,
    zettel: { ...DEFAULT_ZETTEL_SETTINGS },
    fleeting: { ...DEFAULT_FLEETING_SETTINGS },
    index: { ...DEFAULT_INDEX_SETTINGS },
    literature: { ...DEFAULT_LITERATURE_SETTINGS },
  }
}

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: PluginSettings = {
  version: '0.1.4',

  general: {
    ignoredFolders: [],
  },

  commands: {
    enabledCommands: {},
  },

  boxes: {
    enabled: false,
    mode: BoxMode.FOLDER,
    rootFolder: '',
    defaultBox: '',
    autoCreateBoxes: true,
    boxes: [createDefaultBoxConfig()],
  },

  zettel: { ...DEFAULT_ZETTEL_SETTINGS },
  fleeting: { ...DEFAULT_FLEETING_SETTINGS },
  index: { ...DEFAULT_INDEX_SETTINGS },
  literature: { ...DEFAULT_LITERATURE_SETTINGS },
  projects: { ...DEFAULT_PROJECT_SETTINGS },
  zettelkastenView: { ...DEFAULT_ZETTELKASTEN_VIEW_SETTINGS },
  noteSequences: { ...DEFAULT_NOTE_SEQUENCE_SETTINGS },
}
