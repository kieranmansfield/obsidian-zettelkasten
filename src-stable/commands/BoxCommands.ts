import { BoxManager } from "../core/BoxManager";
import { Notice } from "obsidian";
export class BoxCommands {
  static register(plugin:any){
    plugin.addCommand({ id:'zk-list-boxes', name:'Zettel: List Boxes (console)', callback: async ()=>{ const bm = new BoxManager(plugin); await bm.load(); console.log('Boxes:', bm.getBoxes()); new Notice('Boxes logged to console'); }});
    plugin.addCommand({ id:'zk-create-box', name:'Zettel: Create Box Slipbox (if missing)', callback: async ()=>{ const bm = new BoxManager(plugin); await bm.load(); if(bm.getBoxes().length===0){ bm.addBox({ id:'default', name:'Slipbox', folder:'Slipbox' }); await bm.save(); new Notice('Created default Slipbox'); } else new Notice('Boxes already exist'); }});
  }
}
export default BoxCommands
