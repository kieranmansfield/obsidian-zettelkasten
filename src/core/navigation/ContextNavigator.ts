import { App, TFile } from 'obsidian'
// import type { ZettelId } from '../zettel/ZettelNode'
// import { ContextNavigator as CoreNavigator } from '../navigation/ContextNavigator'
import ZettelFilesystem from '../ZettelFilesystem'

/**
 * NavigationService
 * -----------------
 * Service-layer bridge between Obsidian and the pure ContextNavigator.
 * Loads forest, resolves tree structure, and opens notes.
 *
 * This replaces the old UI ContextNavigator, which violated architecture rules.
 */
export class NavigationService {
  constructor(
    private readonly app: App,
    private readonly fs: ZettelFilesystem,
    private readonly boxFolder?: string
  ) {}

  /** Build navigator + forest */
  private async loadNavigator(): Promise<{ nav: CoreNavigator; forest: ZettelNode[] }> {
    const forest = await this.fs.buildForestForFolder(this.boxFolder)
    return { nav: new CoreNavigator(forest), forest }
  }

  /** Open a note by ID */
  private async openById(id: string): Promise<void> {
    if (!this.boxFolder) return

    const fullPath = `${this.boxFolder}/${id}.md`
    const file = this.app.vault.getAbstractFileByPath(fullPath)

    if (file instanceof TFile) {
      const leaf = this.app.workspace.getLeaf()
      await leaf.openFile(file)
    }
  }

  /** Navigate: parent */
  async gotoParent(file: TFile): Promise<void> {
    const { nav } = await this.loadNavigator()
    const parent = nav.getParent(file.basename)
    if (parent) await this.openById(parent.id)
  }

  /** Navigate: first child */
  async gotoFirstChild(file: TFile): Promise<void> {
    const { nav } = await this.loadNavigator()
    const children = nav.getChildren(file.basename)
    if (children.length > 0) await this.openById(children[0].id)
  }

  /** Navigate: next sibling */
  async gotoNextSibling(file: TFile): Promise<void> {
    const { nav } = await this.loadNavigator()
    const next = nav.getNextSibling(file.basename)
    if (next) await this.openById(next.id)
  }

  /** Navigate: previous sibling */
  async gotoPrevSibling(file: TFile): Promise<void> {
    const { nav } = await this.loadNavigator()
    const prev = nav.getPrevSibling(file.basename)
    if (prev) await this.openById(prev.id)
  }

  /** Navigate: subtree root */
  async gotoRoot(file: TFile): Promise<void> {
    const { nav } = await this.loadNavigator()
    const root = nav.getRoot(file.basename)
    if (root) await this.openById(root.id)
  }
}
