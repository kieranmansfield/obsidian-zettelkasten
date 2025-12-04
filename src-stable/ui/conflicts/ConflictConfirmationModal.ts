import { App, Modal, Setting } from "obsidian";
export class ConflictConfirmationModal extends Modal {
  constructor(app:App, private items:any[], private onResolve:(ok:boolean)=>void){ super(app); }
  onOpen(){ const { contentEl } = this; contentEl.empty(); contentEl.createEl('h2',{text:'Conflicts detected'}); contentEl.createEl('p',{text:'The following destination filenames conflict with existing files or with other planned renames.'}); const list = contentEl.createDiv(); list.style.maxHeight='40vh'; list.style.overflow='auto'; if(this.items.length===0) list.createEl('div',{text:'(no conflicts)'}); else { for(const it of this.items){ const row = list.createDiv(); row.createEl('div',{text:`${it.oldPath} → ${it.newPath} ${it.reason?`(${it.reason})`:''}`}); } } new Setting(contentEl).addButton(b=>b.setButtonText('Cancel').setWarning().onClick(()=>{ this.onResolve(false); this.close(); })).addButton(b=>b.setButtonText('Proceed (Apply changes)').setCta().onClick(()=>{ this.onResolve(true); this.close(); })); }
  onClose(){ this.contentEl.empty(); }
}
export default ConflictConfirmationModal
