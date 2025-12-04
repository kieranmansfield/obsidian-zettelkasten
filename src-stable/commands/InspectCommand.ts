import { IDInspectorModal } from "../ui/inspector/IDInspectorModal";
import { BoxManager } from "../core/BoxManager";
export class InspectCommand {
  static register(plugin:any){
    plugin.addCommand({ id:'zk-open-inspector', name:'Zettel: Open ID Inspector', callback: async()=>{
      const bm = new BoxManager(plugin);
      await bm.load();
      const modal = new IDInspectorModal(plugin.app, bm, {} as any, {} as any);
      modal.open();
    }});
  }
}
export default InspectCommand
