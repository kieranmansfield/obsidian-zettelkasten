import {
  FilenameFormat,
  PluginSettings,
  BoxMode,
  ZettelSettings,
  FleetingSettings,
  IndexSettings,
  LiteratureSettings,
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
  folder: 'literature',
  templatePath: '',
  template:
    '# {{title}}\n\n## Metadata\n- Author: \n- Year: \n- Type: \n\n## Summary\n\n## Key Points\n\n',
  openOnCreate: true,
}

/**
 * Default Zettelkasten view settings
 */
export const DEFAULT_ZETTELKASTEN_VIEW_SETTINGS: ZettelkastenViewSettings = {
  enabled: true,
  showInbox: true,
  showZettels: true,
  showReferences: true,
  showIndex: true,
  dashboardNotes: [],
  inboxFilterTag: '',
  inboxFilterFolder: '',
  zettelsFilterTag: '',
  zettelsFilterFolder: '',
  referencesFilterTag: '',
  referencesFilterFolder: '',
  indexFilterTag: '',
  indexFilterFolder: '',
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
    zettelDetectionMode: ZettelDetectionMode.FOLDER,
    zettelIdFormat: 'YYYYMMDDHHmmssSSS',
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
  zettelkastenView: { ...DEFAULT_ZETTELKASTEN_VIEW_SETTINGS },
  noteSequences: { ...DEFAULT_NOTE_SEQUENCE_SETTINGS },
}
