import { App, TFile, WorkspaceLeaf } from 'obsidian'

export interface FileCreatorOptions {
  path: string
  title: string
  templatePath?: string
  shouldOpen?: boolean
}

export class FileCreator {
  constructor(
    private readonly app: App,
    private options: FileCreatorOptions
  ) {}

  async create(): Promise<TFile> {
    const content = await this.buildContent()
    const file = await this.app.vault.create(this.options.path, content)

    if (this.options.shouldOpen) {
      const leaf = this.getLeaf()
      if (leaf) await leaf.openFile(file)
    }

    return file
  }

  private async buildContent(): Promise<string> {
    if (this.options.templatePath) {
      const file = this.app.vault.getAbstractFileByPath(this.options.templatePath)
      if (file instanceof TFile) {
        const tpl = await this.app.vault.read(file)
        return this.applyTemplate(tpl)
      }
    }
    return `# ${this.options.title}\n`
  }

  private applyTemplate(tpl: string): string {
    const now = new Date()
    return tpl
      .replace(/{{title}}/g, this.options.title)
      .replace(/{{date}}/g, now.toISOString().split('T')[0])
      .replace(/{{time}}/g, now.toTimeString().split(' ')[0])
      .replace(/{{datetime}}/g, now.toISOString().replace('T', ' ').split('.')[0])
  }

  private getLeaf(): WorkspaceLeaf | null {
    return this.app.workspace.getLeaf()
  }
}

export default FileCreator
