import { App, FuzzySuggestModal, FuzzyMatch, TFile } from "obsidian";

// Modal for suggesting and selecting Zettel notes
export class ZettelSuggester extends FuzzySuggestModal<string> {
	private titles: Map<string, TFile>;
	private completion: (file: TFile) => void;
	private initialQuery: string;
	private showFilename: boolean;

	constructor(
		app: App,
		titles: Map<string, TFile>,
		search: string | undefined,
		completion: (file: TFile) => void,
		showFilename: boolean = false,
	) {
		super(app);
		this.initialQuery = search ?? "";
		this.titles = titles;
		this.completion = completion;
		this.showFilename = showFilename;
		this.emptyStateText = "No zettels found";
		this.setPlaceholder("Search for a zettel...");
	}

	onOpen() {
		super.onOpen();
		this.inputEl.value = this.initialQuery;
		const event = new Event("input");
		this.inputEl.dispatchEvent(event);
	}

	getItems(): string[] {
		return Array.from(this.titles.keys()).sort();
	}

	getItemText(item: string): string {
		return item;
	}

	renderSuggestion(value: FuzzyMatch<string>, el: HTMLElement) {
		const file = this.titles.get(value.item);
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

	onChooseItem(item: string, _evt: MouseEvent | KeyboardEvent) {
		this.completion(this.titles.get(item)!);
	}
}
