import { App, Modal } from "obsidian";

/**
 * Modal for creating a new note with a title input
 */
export class CreateNoteModal extends Modal {
	private onSubmit: (title: string) => void;

	constructor(app: App, onSubmit: (title: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Create new note" });

		const form = contentEl.createEl("form");
		form.setCssProps({
			display: "flex",
			flexDirection: "column",
			gap: "1em",
		});

		const inputContainer = form.createDiv();
		inputContainer.createEl("label", { text: "Note title:" });
		const input = inputContainer.createEl("input", {
			type: "text",
			placeholder: "Enter note title",
		});
		input.setCssProps({
			width: "100%",
			marginTop: "0.5em",
		});

		const buttonContainer = form.createDiv();
		buttonContainer.setCssProps({
			display: "flex",
			gap: "0.5em",
			justifyContent: "flex-end",
		});

		const submitButton = buttonContainer.createEl("button", {
			text: "Create",
			type: "submit",
		});
		submitButton.addClass("mod-cta");

		const cancelButton = buttonContainer.createEl("button", {
			text: "Cancel",
			type: "button",
		});

		form.addEventListener("submit", (e) => {
			e.preventDefault();
			const title = input.value.trim();
			if (title) {
				this.close();
				this.onSubmit(title);
			}
		});

		cancelButton.addEventListener("click", () => {
			this.close();
		});

		input.focus();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
