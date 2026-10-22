import {
  FilenameFormat,
  PluginSettings,
  ZettelSettings,
  FleetingSettings,
  IndexSettings,
  LiteratureSettings,
  ProjectSettings,
  ZettelDetectionMode,
  ZettelkastenSidebarSettings,
  NoteSequenceSettings,
} from '../base/settings'

// Note formats from the strict Zettelkasten skill (Ahrens, zettelkasten.de, Duffney, Kadavy).
// {{title}} and {{date}} (YYYY-MM-DD) are filled in on creation.

const PERMANENT_TEMPLATE = `---
created: {{date}}
---
%% One idea, in your own words and full sentences, for a reader who has not seen the source. It must fit on one screen. %%


- Continues [[ID title]] because …

Source: [[Surname YYYY]] p. 
`

const LITERATURE_TEMPLATE = `---
type: literature
author: 
title: 
year: 
source: 
---
%% Very short, very selective, your own words. One point per line, each with its page. Quote only when the wording itself matters. %%
- p.  – 
`

const STRUCTURE_TEMPLATE = `---
type: structure
---
%% Your current view of how these notes hang together. Order them and say what each contributes. When your view changes, write a new structure note, link it from this one and update the index. %%
- [[ID title]] – what it contributes here
`

export const INDEX_TEMPLATE = `---
type: index
---
# Index
%% Keyword → 1–2 entry notes, never more than 4. Choose by asking: in which situation do I want to stumble on this again? %%
## keyword
- [[ID title]]
`

/** Basename of the single Index note in the slip-box */
export const INDEX_NOTE = 'Index'

/** Property that marks structure notes */
export const STRUCTURE_MARKER = 'type: structure'

/**
 * Default zettel settings
 */
export const DEFAULT_ZETTEL_SETTINGS: ZettelSettings = {
  enabled: true,
  zettelDetectionMode: ZettelDetectionMode.FOLDER,
  zettelTag: 'type: permanent',
  zettelIdFormat: 'YYYYMMDDHHmmssSSS',
  defaultFolder: 'slip-box',
  templatePath: '',
  template: PERMANENT_TEMPLATE,
  filenameFormat: FilenameFormat.ID_TITLE,
  separator: '',
  autoLinkToParent: true,
  openOnCreate: true,
}

/**
 * Default fleeting settings (fleeting notes have no format, Ahrens 2.1)
 */
export const DEFAULT_FLEETING_SETTINGS: FleetingSettings = {
  enabled: true,
  detectionMode: ZettelDetectionMode.FOLDER,
  tag: 'fleeting',
  folder: 'inbox',
  templatePath: '',
  template: '',
  openOnCreate: true,
}

/**
 * Default structure note settings
 */
export const DEFAULT_INDEX_SETTINGS: IndexSettings = {
  enabled: true,
  templatePath: '',
  template: STRUCTURE_TEMPLATE,
  openOnCreate: true,
}

/**
 * Default literature settings
 */
export const DEFAULT_LITERATURE_SETTINGS: LiteratureSettings = {
  enabled: true,
  detectionMode: ZettelDetectionMode.FOLDER,
  tag: 'literature',
  folder: 'reference',
  templatePath: '',
  template: LITERATURE_TEMPLATE,
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
export const DEFAULT_ZETTELKASTEN_SIDEBAR_SETTINGS: ZettelkastenSidebarSettings = {
  enabled: true,
  inboxName: 'Inbox',
  zettelsName: 'Zettels',
  literatureName: 'Literature',
  indexName: 'Structure notes',
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

  zettel: { ...DEFAULT_ZETTEL_SETTINGS },
  fleeting: { ...DEFAULT_FLEETING_SETTINGS },
  index: { ...DEFAULT_INDEX_SETTINGS },
  literature: { ...DEFAULT_LITERATURE_SETTINGS },
  projects: { ...DEFAULT_PROJECT_SETTINGS },
  zettelkastenSidebar: { ...DEFAULT_ZETTELKASTEN_SIDEBAR_SETTINGS },
  noteSequences: { ...DEFAULT_NOTE_SEQUENCE_SETTINGS },
}
