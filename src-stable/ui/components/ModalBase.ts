import { Modal, App } from "obsidian";
export class ModalBase extends Modal {
  constructor(app: App){ super(app); }
  protected title(text:string){ this.titleEl.setText(text); }
  protected clear(){ this.contentEl.empty(); }
  protected addHeader(text:string){ this.contentEl.createEl("h3",{text}); }
}
export default ModalBase
