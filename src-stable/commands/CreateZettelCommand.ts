import { Notice } from "obsidian";
import { ZettelId } from "../core/ZettelID";
import { BoxManager } from "../core/BoxManager";
export class CreateZettelCommand {
  static register(plugin:any){
    plugin.addCommand({ id: "zk-create-zettel", name: "Zettel: Create new note in default box", callback: async ()=> {
      const bm = new BoxManager(plugin);
      await bm.load();
      const boxes = bm.getBoxes();
      const box = boxes[0];
      if(!box) return new Notice("No box configured");
      const id = new ZettelId(new Date().toISOString().replace(/[^0-9]/g,'').slice(0,17));
      const title = `${id.toString()} New note`;
      const path = `${box.folder}/${title}.md`;
      try{ await plugin.app.vault.create(path, `# ${title}\n`); new Notice(`Created ${title}`); } catch(err){ console.error(err); new Notice("Failed to create zettel"); }
    }});
  }
}
export default CreateZettelCommand
