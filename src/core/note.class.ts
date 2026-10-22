import type { App, TFile } from 'obsidian'
import type FileService from '../service/file.service'
import type SettingsManager from '../settings/SettingsManager'
import { fillTemplate, stampFile, zettelContent, zettelFilename } from '../base/fileHelpers'
import { ZettelDetectionMode } from '../base/settings'
import { STRUCTURE_MARKER } from '../settings/DefaultSettings'
import { generateTimeStampId } from '../base/zettelIdOrder'

/** Remove characters not allowed in filenames */
const sanitizeName = (name: string): string => name.replace(/[\\/:*?"<>|]/g, '').trim()

/** "<timestamp> <title>": fleeting and structure notes */
const timestampedName = (title: string): string => `${generateTimeStampId()} ${title}`.trim()

/** Settings a note kind is created with, read at creation time so changes apply at once */
interface NoteSettings {
  folder: string
  templatePath: string
  template: string
  /** How notes of this kind are detected; non-folder modes get `marker` stamped on */
  mode: ZettelDetectionMode
  marker: string
  openOnCreate: boolean
}

/** A kind of note (zettel, fleeting, structure, literature): its filename, content and settings */
export default class NoteCore {
  private app: App
  private fileService: FileService
  private settings: () => NoteSettings
  private filename: (title: string) => string
  private content: (template: string, title: string) => string

  constructor(
    app: App,
    fileService: FileService,
    settings: () => NoteSettings,
    filename: (title: string) => string,
    content: (template: string, title: string) => string = fillTemplate
  ) {
    this.app = app
    this.fileService = fileService
    this.settings = settings
    this.filename = filename
    this.content = content
  }

  /** Create the note from its template, mark it for detection and open it if set; never overwrites */
  // fallow-ignore-next-line unused-class-member
  async create(title: string): Promise<TFile> {
    const s = this.settings()
    const template = await this.fileService.loadTemplate(s.templatePath, s.template)
    const file = await this.fileService.create(
      s.folder,
      this.filename(sanitizeName(title)),
      this.content(template, title)
    )
    await stampFile(this.app, file, s.mode, s.marker)
    if (s.openOnCreate) await this.app.workspace.getLeaf().openFile(file)
    return file
  }
}

/** The four note kinds, wired to their settings */
export function noteKinds(app: App, fileService: FileService, settings: SettingsManager) {
  const byDetection = (s: { detectionMode: ZettelDetectionMode; tag: string }) => ({
    mode: s.detectionMode,
    marker: s.tag,
  })
  return {
    zettelNote: new NoteCore(
      app,
      fileService,
      () => {
        const z = settings.get('zettel')
        return { ...z, folder: z.defaultFolder, mode: z.zettelDetectionMode, marker: z.zettelTag }
      },
      (title) => zettelFilename(generateTimeStampId(), title, settings.get('zettel')),
      (template, title) => zettelContent(template, title, settings.get('zettel'))
    ),
    fleetingNote: new NoteCore(
      app,
      fileService,
      () => {
        const s = settings.get('fleeting')
        return { ...s, ...byDetection(s) }
      },
      timestampedName
    ),
    // A custom template may lack the marker: stamp `type: structure` so the note is detected
    indexNote: new NoteCore(
      app,
      fileService,
      () => ({
        ...settings.get('index'),
        folder: settings.get('zettel').defaultFolder,
        mode: ZettelDetectionMode.PROPERTY,
        marker: STRUCTURE_MARKER,
      }),
      timestampedName
    ),
    // Literature notes are named after their source, no ID
    literatureNote: new NoteCore(
      app,
      fileService,
      () => {
        const s = settings.get('literature')
        return { ...s, ...byDetection(s) }
      },
      (title) => title
    ),
  }
}
