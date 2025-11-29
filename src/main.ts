import { Plugin } from 'obsidian'
import { ZettelId } from './core/zettel/ZettelId'
import { FileRef, ZettelNode } from './types/interfaces'
import { ZettelkastenPluginSettings, DEFAULT_SETTINGS } from './settings/PluginSettings'
import { ZettelkastenSettingTab } from './settings/SettingsTab'
import { CommandManager } from './commands/CommandManager'
import { ZettelkastenView, VIEW_TYPE_ZETTELKASTEN } from './ui/ZettelkastenView'
import { NoteSequencesView, VIEW_TYPE_NOTE_SEQUENCES } from './ui/NoteSequencesView'
import { SequenceNavigatorView, VIEW_TYPE_SEQUENCE_NAVIGATOR } from './ui/SequenceNavigatorView'

/**
 * ZettelTree helper integrated from new architecture.
 * Provides methods to build and compact forests of ZettelNodes.
 */
export class ZettelTree {
  buildForestFromFiles(files: FileRef[]): ZettelNode[] {
    const nodes: ZettelNode[] = files
      .map((file) => {
        try {
          const id = ZettelId.fromString(file.name)
          return { id, children: [], file } as ZettelNode
        } catch {
          return null
        }
      })
      .filter((node): node is ZettelNode => node !== null)
    return this.compactForest(nodes)
  }

  compactForest(nodes: ZettelNode[]): ZettelNode[] {
    const nodeMap = new Map<string, ZettelNode>()
    nodes.forEach((node) => nodeMap.set(node.id.toString(), node))

    const childrenMap = new Map<string, ZettelNode[]>()
    const childIdSet = new Set<string>()

    for (const node of nodes) {
      const parentId = node.id.getParent()
      if (parentId) {
        const parentIdStr = parentId.toString()
        if (!childrenMap.has(parentIdStr)) {
          childrenMap.set(parentIdStr, [])
        }
        childrenMap.get(parentIdStr)!.push(node)
        childIdSet.add(node.id.toString())
      }
    }

    const buildNode = (node: ZettelNode): ZettelNode => {
      const children = childrenMap.get(node.id.toString()) || []
      const sortedChildren = [...children].sort((a, b) =>
        a.id.toString().localeCompare(b.id.toString())
      )
      return {
        id: node.id,
        file: node.file,
        children: sortedChildren.map(buildNode),
      }
    }

    const roots = nodes.filter((node) => !childIdSet.has(node.id.toString()))
    return roots.sort((a, b) => a.id.toString().localeCompare(b.id.toString())).map(buildNode)
  }

  fromIds(ids: ZettelId[]): ZettelNode[] {
    const nodes: ZettelNode[] = ids.map((id) => ({
      id,
      children: [],
    }))
    return this.compactForest(nodes)
  }
}

export default class ZettelkastenPlugin extends Plugin {
  settings: ZettelkastenPluginSettings
  commandManager: CommandManager

  async onload() {
    await this.loadSettings()

    // Register views
    this.registerView(VIEW_TYPE_ZETTELKASTEN, (leaf) => new ZettelkastenView(leaf, this))
    this.registerView(VIEW_TYPE_NOTE_SEQUENCES, (leaf) => new NoteSequencesView(leaf, this))
    this.registerView(VIEW_TYPE_SEQUENCE_NAVIGATOR, (leaf) => new SequenceNavigatorView(leaf, this))

    // Initialize commands
    this.commandManager = new CommandManager(this)
    this.commandManager.registerCommands()

    // Add settings tab
    this.addSettingTab(new ZettelkastenSettingTab(this.app, this))

    // Activate panel and sequence navigator if enabled
    if (this.settings.enableZettelkastenPanel) {
      await this.activateView()
    }
    if (this.settings.enableSequenceNavigator) {
      await this.activateSequenceNavigator()
    }
  }

  async activateView() {
    const { workspace } = this.app
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)[0]
    if (!leaf) {
      const newLeaf = workspace.getLeftLeaf(false)
      if (newLeaf) {
        await newLeaf.setViewState({
          type: VIEW_TYPE_ZETTELKASTEN,
          active: true,
        })
        leaf = newLeaf
      }
    }
    if (leaf) workspace.revealLeaf(leaf)
  }

  async activateSequenceNavigator() {
    const { workspace } = this.app
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_SEQUENCE_NAVIGATOR)[0]
    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false)
      if (rightLeaf) {
        await rightLeaf.setViewState({
          type: VIEW_TYPE_SEQUENCE_NAVIGATOR,
          active: true,
        })
        leaf = rightLeaf
      }
    }
    if (leaf) workspace.revealLeaf(leaf)
  }

  async deactivateView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)
    for (const leaf of leaves) leaf.detach()
  }

  async loadSettings() {
    const loadedData = (await this.loadData()) as
      | (Partial<ZettelkastenPluginSettings> & {
          enableMocs?: boolean
          enableIndexes?: boolean
          mocsUseSeparateLocation?: boolean
          mocsLocation?: string
          mocsTemplatePath?: string
          mocsUseZettelId?: boolean
          mocsFilenameFormat?: string
          mocsTag?: string
          useMocsPrefix?: boolean
          mocsPrefix?: string
          indexMode?: 'moc' | 'zettelkasten'
          indexesUseSeparateLocation?: boolean
          indexesLocation?: string
          indexesTemplatePath?: string
          indexesUseZettelId?: boolean
          indexesFilenameFormat?: string
          indexesTag?: string
          useIndexesPrefix?: boolean
          indexesPrefix?: string
          enableFleetingNotes?: boolean
          enableSequenceReorder?: boolean
        })
      | null

    this.settings = Object.assign({}, DEFAULT_SETTINGS)

    if (loadedData) {
      this.settings = Object.assign(this.settings, loadedData)

      // Migrate MOCs/Indexes to structure notes
      if (loadedData.enableMocs !== undefined && loadedData.enableIndexes === undefined) {
        this.settings.enableStructureNotes =
          loadedData.enableMocs || loadedData.enableIndexes || false
        this.settings.structureNoteMode = loadedData.enableMocs ? 'moc' : 'zettelkasten'
        if (loadedData.enableMocs) {
          this.settings.structureNotesUseSeparateLocation =
            loadedData.mocsUseSeparateLocation ?? false
          this.settings.structureNotesLocation = loadedData.mocsLocation || ''
          this.settings.mocTemplatePath = loadedData.mocsTemplatePath || ''
          this.settings.structureNotesUseZettelId = loadedData.mocsUseZettelId ?? false
          this.settings.structureNotesFilenameFormat =
            loadedData.mocsFilenameFormat || '{{title}} Index'
          this.settings.structureNotesTag = loadedData.mocsTag || 'index'
          this.settings.useStructureNotesPrefix = loadedData.useMocsPrefix ?? false
          this.settings.structureNotesPrefix = loadedData.mocsPrefix || 'i'
        }
        await this.saveSettings()
      }

      if (
        loadedData.enableIndexes !== undefined &&
        this.settings.enableStructureNotes === undefined
      ) {
        this.settings.enableStructureNotes = loadedData.enableIndexes
        this.settings.structureNoteMode = loadedData.indexMode || 'moc'
        this.settings.structureNotesUseSeparateLocation =
          loadedData.indexesUseSeparateLocation ?? false
        this.settings.structureNotesLocation = loadedData.indexesLocation || ''
        if (loadedData.indexMode === 'moc') {
          this.settings.mocTemplatePath = loadedData.indexesTemplatePath || ''
        } else {
          this.settings.zkIndexTemplatePath = loadedData.indexesTemplatePath || ''
        }
        this.settings.structureNotesUseZettelId = loadedData.indexesUseZettelId ?? false
        this.settings.structureNotesFilenameFormat =
          loadedData.indexesFilenameFormat || '{{title}} Index'
        this.settings.structureNotesTag = loadedData.indexesTag || 'index'
        this.settings.useStructureNotesPrefix = loadedData.useIndexesPrefix ?? false
        this.settings.structureNotesPrefix = loadedData.indexesPrefix || 'i'
        await this.saveSettings()
      }

      // Migrate fleeting notes to inbox
      if (loadedData.enableFleetingNotes !== undefined && loadedData.enableInbox === undefined) {
        this.settings.enableInbox = loadedData.enableFleetingNotes
        this.settings.inboxMode = 'fleeting'
        if (loadedData.fleetingNotesUseSeparateLocation && loadedData.fleetingNotesLocation) {
          this.settings.inboxLocation = loadedData.fleetingNotesLocation
        }
        await this.saveSettings()
      }

      // Migrate sequence reorder to note sequence
      if (
        loadedData.enableSequenceReorder !== undefined &&
        loadedData.enableNoteSequence === undefined
      ) {
        this.settings.enableNoteSequence = loadedData.enableSequenceReorder
        await this.saveSettings()
      }
    }

    console.log('Loaded settings:', JSON.stringify(this.settings, null, 2))
  }

  async saveSettings() {
    await this.saveData(this.settings)
    console.log('Saved settings:', JSON.stringify(this.settings, null, 2))
    this.refreshPanelView()
  }

  refreshPanelView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)
    leaves.forEach((leaf) => {
      if (leaf.view instanceof ZettelkastenView) {
        leaf.view.refresh()
      }
    })
  }
}
