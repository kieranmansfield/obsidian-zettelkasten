import { App, FuzzySuggestModal, FuzzyMatch, TFile, Scope } from "obsidian";

/**
 * Modal for creating a new note with autocomplete to detect existing notes
 * Uses FuzzySuggestModal for a quick switcher-like interface
 */
export class CreateNoteWithSuggestModal extends FuzzySuggestModal<string> {
	private notesMap: Map<string, TFile>;
	private onSubmit: (title: string, existingFile?: TFile) => void;
	private isProcessing = false;
	private showFilename: boolean;

	constructor(
		app: App,
		notesMap: Map<string, TFile>,
		onSubmit: (title: string, existingFile?: TFile) => void,
		showFilename: boolean = false,
	) {
		super(app);
		this.notesMap = notesMap;
		this.onSubmit = onSubmit;
		this.showFilename = showFilename;
		this.setPlaceholder("Enter note title...");
		this.setInstructions([
			{ command: "↵", purpose: "create or open note" },
			{ command: "esc", purpose: "cancel" },
		]);
	}

	onOpen() {
		super.onOpen();

		// Unregister default Enter handler and add our own
		const scope = this.scope as any;
		if (scope.keys) {
			scope.keys = scope.keys.filter((k: any) => k.key !== "Enter");
		}

		this.scope.register([], "Enter", (evt: KeyboardEvent) => {
			evt.preventDefault();
			evt.stopPropagation();

			// Prevent multiple executions
			if (this.isProcessing) {
				return false;
			}
			this.isProcessing = true;

			const inputValue = this.inputEl.value.trim();

			// Check if there's a selected suggestion (highlighted item)
			const modalEl = this.modalEl as any;
			const selectedEl = modalEl?.querySelector(
				".suggestion-item.is-selected",
			);
			let selectedTitle: string | undefined;

			if (selectedEl) {
				// Get the title from the selected suggestion
				const titleEl = selectedEl.querySelector(".suggestion-title");
				if (titleEl) {
					selectedTitle = titleEl.textContent || undefined;
				}
			}

			// If no input and no selection, do nothing
			if (!inputValue && !selectedTitle) {
				this.isProcessing = false;
				return false;
			}

			// Determine which file to open
			let fileToOpen: TFile | undefined;

			if (selectedTitle) {
				// Use the highlighted/selected suggestion
				fileToOpen = this.notesMap.get(selectedTitle);
			} else if (inputValue) {
				// No selection - check for exact match
				for (const [title, file] of this.notesMap.entries()) {
					if (title.toLowerCase() === inputValue.toLowerCase()) {
						fileToOpen = file;
						break;
					}
				}
			}

			this.close();

			// Use setTimeout to ensure modal closes before opening file
			setTimeout(() => {
				if (fileToOpen) {
					// Pass both the title and the existing file
					const cache =
						this.app.metadataCache.getFileCache(fileToOpen);
					const title =
						cache?.frontmatter?.title || fileToOpen.basename;
					this.onSubmit(title, fileToOpen);
				} else if (inputValue) {
					this.onSubmit(inputValue);
				}
			}, 50);

			return false;
		});
	}

	getItems(): string[] {
		return Array.from(this.notesMap.keys()).sort();
	}

	getItemText(item: string): string {
		return item;
	}

	renderSuggestion(value: FuzzyMatch<string>, el: HTMLElement) {
		const file = this.notesMap.get(value.item);
		if (!file) return;

		const cache = this.app.metadataCache.getFileCache(file);
		const title = cache?.frontmatter?.title || file.basename;

		// Main title
		const titleEl = el.createDiv({ cls: "suggestion-title" });
		titleEl.setText(title);

		// Highlight matches
		const matches = value.match.matches;
		if (matches && matches.length > 0) {
			const start = matches[0][0];
			const end = matches[0][1];
			const range = new Range();
			const text = titleEl.firstChild;

			if (text) {
				range.setStart(text, start);
				range.setEnd(text, end);
				range.surroundContents(document.createElement("b"));
			}
		}

		// Show filename beneath title if enabled
		if (this.showFilename) {
			const filenameEl = el.createDiv({
				cls: "suggestion-note-filename",
			});
			filenameEl.setText(file.basename);
		}
	}

	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
		const file = this.notesMap.get(item);
		if (file) {
			this.app.workspace.getLeaf().openFile(file);
		}
	}
}
