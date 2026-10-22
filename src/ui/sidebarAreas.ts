import type { App, TFile } from 'obsidian'
import { matchesMarker } from '../base/fileHelpers'
import { ZettelDetectionMode } from '../base/settings'
import { parseZettelId } from '../base/zettelIdOrder'
import { STRUCTURE_MARKER } from '../settings/DefaultSettings'
import type SettingsManager from '../settings/SettingsManager'

/** One area in the sidebar: which notes it lists and where its heading leads */
export interface MenuItem {
  name: string
  icon: string
  folder: string
  /** List only notes in `folder` (folder detection); otherwise search the whole vault */
  inFolder: boolean
  /** Area membership beyond the folder, e.g. a tag or property marker */
  matches?: (file: TFile) => boolean
  /** Extra user filter tag */
  filterTag?: string
  dashboardNote?: string
  showFiles: boolean
}

/** The enabled sidebar areas, in order */
export function sidebarAreas(app: App, settings: Pick<SettingsManager, 'get'>): MenuItem[] {
  const fleeting = settings.get('fleeting')
  const zettel = settings.get('zettel')
  const literature = settings.get('literature')
  const index = settings.get('index')
  const projects = settings.get('projects')
  const view = settings.get('zettelkastenSidebar')

  /** Folder detection lists the folder (`inFolder` narrows it); other modes search the vault for the marker */
  const detect = (mode: ZettelDetectionMode, marker: string, inFolder?: (f: TFile) => boolean) =>
    mode === ZettelDetectionMode.FOLDER
      ? { inFolder: true, matches: inFolder }
      : { inFolder: false, matches: (f: TFile) => matchesMarker(app, f, marker, mode) }

  const items: Array<MenuItem & { show: boolean }> = [
    {
      show: view.showInbox && fleeting.enabled,
      name: view.inboxName || 'Inbox',
      icon: 'inbox',
      folder: fleeting.folder,
      ...detect(fleeting.detectionMode, fleeting.tag),
      filterTag: view.inboxFilterTag,
      dashboardNote: view.dashboardFleetingNote,
      showFiles: view.showInboxFiles,
    },
    {
      show: view.showZettels && zettel.enabled,
      name: view.zettelsName || 'Zettels',
      icon: 'gallery-vertical-end',
      folder: zettel.defaultFolder || '',
      // In the slip-box folder, only notes with an ID count as zettels
      ...detect(zettel.zettelDetectionMode, zettel.zettelTag, (f) => !!parseZettelId(f.basename)),
      filterTag: view.zettelsFilterTag,
      dashboardNote: view.dashboardZettelNote,
      showFiles: view.showZettelFiles,
    },
    {
      show: view.showLiterature && literature.enabled,
      name: view.literatureName || 'Literature',
      icon: 'book-open',
      folder: literature.folder,
      ...detect(literature.detectionMode, literature.tag),
      filterTag: view.literatureFilterTag,
      dashboardNote: view.dashboardLiteratureNote,
      showFiles: view.showLiteratureFiles,
    },
    {
      // Structure notes: `type: structure` notes in the slip-box
      show: view.showIndex && index.enabled,
      name: view.indexName || 'Structure notes',
      icon: 'list',
      folder: zettel.defaultFolder,
      inFolder: true,
      matches: (f) => matchesMarker(app, f, STRUCTURE_MARKER, ZettelDetectionMode.PROPERTY),
      filterTag: view.indexFilterTag,
      dashboardNote: view.dashboardIndexNote,
      showFiles: view.showIndexFiles,
    },
    {
      show: view.showProjects && projects.enabled,
      name: view.projectsName || 'Projects',
      icon: 'folder-kanban',
      folder: projects.folder,
      ...detect(projects.detectionMode, projects.tag),
      filterTag: view.projectsFilterTag,
      dashboardNote: view.dashboardProjectsNote,
      showFiles: view.showProjectFiles,
    },
  ]
  return items.filter((item) => item.show)
}
