import { AbstractInputSuggest, App, TAbstractFile, TFile } from "obsidian";

export class FileSuggest extends AbstractInputSuggest<TFile> {
	private onSelectCallback: (value: string) => void;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		onSelect: (value: string) => void,
	) {
		super(app, inputEl);
		this.onSelectCallback = onSelect;
	}

	getSuggestions(inputStr: string): TFile[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles();
		const files: TFile[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		abstractFiles.forEach((file: TAbstractFile) => {
			if (
				file instanceof TFile &&
				file.path.toLowerCase().contains(lowerCaseInputStr)
			) {
				files.push(file);
			}
		});

		return files.slice(0, 10);
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFile): void {
		this.onSelectCallback(file.path);
		this.close();
	}
}
