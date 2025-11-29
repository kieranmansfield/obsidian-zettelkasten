/* eslint-disable @typescript-eslint/no-explicit-any */
import { Notice } from 'obsidian'
import { ZettelService } from '../services/ZettelService'
import { FileCreator } from '../services/file/FileCreator'
import { CreateNoteWithSuggestModal } from '../ui/modal/CreateNoteWithSuggestModal'

export default class CreateChildCommand {
  static register(plugin: any) {
    const service = new ZettelService(plugin.app, plugin.settings)

    plugin.addCommand({
      id: 'zk-create-child',
      name: 'Create Child Zettel',
      callback: async () => {
        const activeFile = plugin.app.workspace.getActiveFile()
        if (!activeFile) return new Notice('No active zettel')

        const parentId = service.extractZettelId(activeFile.basename)
        if (!parentId) return new Notice('Active file is not a zettel')

        const notesMap = await service.getValidZettels(plugin.settings.zettelTag)

        new CreateNoteWithSuggestModal(plugin.app, notesMap, async (title: string) => {
          const folder = service.getTargetFolder(plugin.settings.zettelsLocation)
          const childId = await service.generateChildId(parentId, folder)
          const path = `${folder.path}/${childId}.md`

          const creator = new FileCreator(
            plugin.app,
            path,
            title,
            () => {
              new Notice(`Created child zettel: ${childId}`)
            },
            plugin.settings.noteTemplatePath
          )

          const result = await creator.create()
          if (result.success && result.file) {
            await service.addParentLink(result.file, activeFile)
          }
        }).open()
      },
    })
  }
}
