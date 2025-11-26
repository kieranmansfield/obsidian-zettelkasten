import { App, Modal, Setting, TFile, TFolder } from "obsidian";
import type ZettelkastenPlugin from "../../main";
import { FileSuggest } from "./FileSuggest";
import { FolderSuggest } from "./FolderSuggest";
import { SearchQuerySuggest } from "./SearchQuerySuggest";

export class BookmarkModal extends Modal {
	plugin: ZettelkastenPlugin;
	type: "file" | "search" | "graph" | "folder";
	path?: string;
	title: string;
	query?: string;
	onSubmit: (bookmark: {
		type: "file" | "search" | "graph" | "folder";
		path?: string;
		title: string;
		query?: string;
	}) => void;

	constructor(
		app: App,
		plugin: ZettelkastenPlugin,
		onSubmit: (bookmark: {
			type: "file" | "search" | "graph" | "folder";
			path?: string;
			title: string;
			query?: string;
		}) => void,
		initialType?: "file" | "search" | "graph" | "folder",
		initialPath?: string,
		initialQuery?: string,
		initialTitle?: string
	) {
		super(app);
		this.plugin = plugin;
		this.type = initialType || "file";
		this.path = initialPath;
		this.query = initialQuery;
		this.title = initialTitle || "";
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Add bookmark" });

		// Type selection
		new Setting(contentEl)
			.setName("Type")
			.setDesc("Select the type of bookmark")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("file", "File")
					.addOption("search", "Search")
					.addOption("graph", "Graph")
					.addOption("folder", "Folder")
					.setValue(this.type)
					.onChange((value: "file" | "search" | "graph" | "folder") => {
						this.type = value;
						this.updateInputFields();
					});
			});

		// Container for dynamic fields
		const fieldsContainer = contentEl.createDiv({ cls: "bookmark-fields" });

		// Initial render of fields
		this.renderFields(fieldsContainer);

		// Buttons
		const buttonContainer = contentEl.createDiv({
			cls: "modal-button-container",
		});

		const submitButton = buttonContainer.createEl("button", {
			text: "Add bookmark",
			cls: "mod-cta",
		});

		submitButton.addEventListener("click", () => {
			if (this.validateAndSubmit()) {
				this.close();
			}
		});

		const cancelButton = buttonContainer.createEl("button", {
			text: "Cancel",
		});

		cancelButton.addEventListener("click", () => {
			this.close();
		});
	}

	private renderFields(container: HTMLElement) {
		container.empty();

		// Path or query field depending on type
		if (this.type === "file") {
			new Setting(container).setName("File path").addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.path = value;
					// Auto-fill title from file name if title is empty
					if (!this.title) {
						const fileName =
							value.split("/").pop()?.replace(".md", "") || "";
						this.title = fileName;
						this.updateTitleField();
					}
				};
				new FileSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("path/to/file.md")
					.setValue(this.path || "")
					.onChange((value) => {
						this.path = value;
						// Auto-fill title from file name if title is empty
						if (!this.title) {
							const fileName =
								value.split("/").pop()?.replace(".md", "") ||
								"";
							this.title = fileName;
							this.updateTitleField();
						}
					});
			});
		} else if (this.type === "search") {
			new Setting(container).setName("Search query").addText((text) => {
				const onSelect = (value: string) => {
					text.setValue(value);
					this.query = value;
				};
				new SearchQuerySuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("Enter search query")
					.setValue(this.query || "")
					.onChange((value) => {
						this.query = value;
					});
			});
		} else if (this.type === "folder") {
			new Setting(container).setName("Folder path").addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.path = value;
					// Auto-fill title from folder name if title is empty
					if (!this.title) {
						const folderName = value.split("/").pop() || "";
						this.title = folderName;
						this.updateTitleField();
					}
				};
				new FolderSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("path/to/folder")
					.setValue(this.path || "")
					.onChange((value) => {
						this.path = value;
						// Auto-fill title from folder name if title is empty
						if (!this.title) {
							const folderName = value.split("/").pop() || "";
							this.title = folderName;
							this.updateTitleField();
						}
					});
			});
		}

		// Title field (for all types)
		const titleSetting = new Setting(container)
			.setName("Display name")
			.addText((text) => {
				text.setPlaceholder("Enter display name")
					.setValue(this.title)
					.onChange((value) => {
						this.title = value;
					});
				// Store reference for updating
				(container as any).titleInput = text;
			});
	}

	private updateInputFields() {
		const fieldsContainer = this.contentEl.querySelector(
			".bookmark-fields"
		) as HTMLElement;
		if (fieldsContainer) {
			this.renderFields(fieldsContainer);
		}
	}

	private updateTitleField() {
		const fieldsContainer = this.contentEl.querySelector(
			".bookmark-fields"
		) as HTMLElement;
		if (fieldsContainer && (fieldsContainer as any).titleInput) {
			(fieldsContainer as any).titleInput.setValue(this.title);
		}
	}

	private validateAndSubmit(): boolean {
		// Validate based on type
		if (this.type === "file" && !this.path) {
			// Error: file path required
			return false;
		}
		if (this.type === "search" && !this.query) {
			// Error: search query required
			return false;
		}
		if (this.type === "folder" && !this.path) {
			// Error: folder path required
			return false;
		}
		if (!this.title) {
			// Error: title required
			return false;
		}

		this.onSubmit({
			type: this.type,
			path: this.path,
			title: this.title,
			query: this.query,
		});

		return true;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
