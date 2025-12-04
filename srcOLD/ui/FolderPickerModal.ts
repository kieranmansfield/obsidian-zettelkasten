import { FuzzySuggestModal, App } from 'obsidian'

export class FolderPickerModal extends FuzzySuggestModal<string> {
  constructor(
    app: App,
    private folders: string[]
  ) {
    super(app)
  }

  getItems(): string[] {
    return this.folders
  }

  getItemText(item: string): string {
    return item
  }

  onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
    console.log('Selected Folder:', item)
  }
}
