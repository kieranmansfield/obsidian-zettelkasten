import { App, TFile, WorkspaceLeaf } from 'obsidian'

export class WorkspaceUtils {
  static getActiveLeaf(app: App): WorkspaceLeaf | null {
    return app.workspace.getLeaf()
  }

  static async openFile(app: App, file: TFile) {
    const leaf = this.getActiveLeaf(app)
    if (!leaf) throw new Error('No active leaf')
    await leaf.openFile(file)
  }
}
