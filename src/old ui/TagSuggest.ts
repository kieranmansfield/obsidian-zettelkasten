import { AbstractInputSuggest, App } from "obsidian";

export class TagSuggest extends AbstractInputSuggest<string> {
	private onSelectCallback: (value: string) => void;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		onSelect: (value: string) => void,
	) {
		super(app, inputEl);
		this.onSelectCallback = onSelect;
	}

	getSuggestions(inputStr: string): string[] {
		const allTags = new Set<string>();
		const lowerCaseInputStr = inputStr.toLowerCase();

		// Get all tags from metadata cache
		const allFiles = this.app.vault.getMarkdownFiles();

		allFiles.forEach((file) => {
			const cache = this.app.metadataCache.getFileCache(file);

			// Get inline tags
			cache?.tags?.forEach((tag) => {
				const tagName = tag.tag.replace("#", "");
				allTags.add(tagName);
			});

			// Get frontmatter tags
			const frontmatterTags = cache?.frontmatter?.tags;
			if (frontmatterTags) {
				const tagsArray = Array.isArray(frontmatterTags)
					? frontmatterTags
					: [frontmatterTags];

				tagsArray.forEach((tag) => {
					const tagName = String(tag).replace("#", "");
					allTags.add(tagName);
				});
			}
		});

		// Filter tags by input string
		const filteredTags = Array.from(allTags)
			.filter((tag) => tag.toLowerCase().contains(lowerCaseInputStr))
			.sort();

		return filteredTags.slice(0, 10);
	}

	renderSuggestion(tag: string, el: HTMLElement): void {
		el.setText(tag);
	}

	selectSuggestion(tag: string): void {
		this.onSelectCallback(tag);
		this.close();
	}
}
