import { IDInspectorModal } from '../ui/modals/IDInspectorModal'
import { ZettelService } from '../services/ZettelService'

export default class InspectCommand {
  static register(plugin: any) {
    const service = new ZettelService(plugin.app, plugin.settings)

    plugin.addCommand({
      id: 'zk-open-inspector',
      name: 'Zettel: Open ID Inspector',
      callback: async () => {
        const zettels = await service.findChildFiles('')
        if (!zettels.length) return new Notice('No zettels found')

        const modal = new IDInspectorModal(plugin.app, zettels[0])
        modal.openModal()
      },
    })
  }
}
