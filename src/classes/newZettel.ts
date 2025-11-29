import {
	App,
	EditorPosition,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	FuzzySuggestModal,
	TFile,
} from "obsidian";

// Constants for ID manipulation
const lettersIDComponentSuccessors: Record<string, string> = {
	a: "b",
	b: "c",
	c: "d",
	d: "e",
	e: "f",
	f: "g",
	g: "h",
	h: "i",
	i: "j",
	j: "k",
	k: "l",
	l: "m",
	m: "n",
	n: "o",
	o: "p",
	p: "q",
	q: "r",
	r: "s",
	s: "t",
	t: "u",
	u: "v",
	v: "w",
	w: "x",
	x: "y",
	y: "z",
	z: "a",
};

const idOnlyRegex = /([0-9]+|[a-z]+)/g;
const checkSettingsMessage =
	"Please check the Zettel ID format and separator in settings.";

// Settings interface for NewZettel
interface NewZettelSettings {
	matchRule: "strict" | "separator" | "fuzzy";
	separator: string;
	addTitle: boolean;
	addAlias: boolean;
	templateFile: string;
	templateRequireTitle: boolean;
	templateRequireLink: boolean;
	useLinkAlias: boolean;
}

// Default settings
const DEFAULT_NEWZETTEL_SETTINGS: NewZettelSettings = {
	matchRule: "separator",
	separator: " ",
	addTitle: true,
	addAlias: false,
	templateFile: "",
	templateRequireTitle: false,
	templateRequireLink: false,
	useLinkAlias: false,
};

// Modal for creating a new zettel with options
class NewZettelModal extends Modal {
	private onSubmit: (
		title: string,
		options: { openNewZettel: boolean },
	) => void;
	private defaultOptions: { openNewZettel: boolean };

	constructor(
		app: App,
		onSubmit: (title: string, options: { openNewZettel: boolean }) => void,
		defaultOptions: { openNewZettel: boolean } = { openNewZettel: true },
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.defaultOptions = defaultOptions;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Create New Zettel" });

		const form = contentEl.createEl("form");
		form.style.display = "flex";
		form.style.flexDirection = "column";
		form.style.gap = "1em";

		const inputContainer = form.createDiv();
		inputContainer.createEl("label", { text: "Zettel Title:" });
		const input = inputContainer.createEl("input", {
			type: "text",
			placeholder: "Enter zettel title",
		});
		input.style.width = "100%";
		input.style.marginTop = "0.5em";

		const checkboxContainer = form.createDiv();
		const checkbox = checkboxContainer.createEl("input", {
			type: "checkbox",
		});
		checkbox.checked = this.defaultOptions.openNewZettel;
		checkboxContainer.createEl("label", { text: " Open new zettel" });
		checkbox.style.marginRight = "0.5em";

		const buttonContainer = form.createDiv();
		buttonContainer.style.display = "flex";
		buttonContainer.style.gap = "0.5em";
		buttonContainer.style.justifyContent = "flex-end";

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
				this.onSubmit(title, {
					openNewZettel: checkbox.checked,
				});
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

// Setting tab for NewZettel
class LuhmanSettingTab extends PluginSettingTab {
	plugin: NewZettel;

	constructor(app: App, plugin: NewZettel) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "New Zettel Settings" });

		new Setting(containerEl)
			.setName("Match Rule")
			.setDesc("How to match zettel IDs in filenames")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("strict", "Strict")
					.addOption("separator", "Separator")
					.addOption("fuzzy", "Fuzzy")
					.setValue(this.plugin.settings.matchRule)
					.onChange(async (value) => {
						this.plugin.settings.matchRule = value as
							| "strict"
							| "separator"
							| "fuzzy";
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Separator")
			.setDesc("Separator between ID and title")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.separator)
					.onChange(async (value) => {
						this.plugin.settings.separator = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Add Title")
			.setDesc("Include title in filename")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.addTitle)
					.onChange(async (value) => {
						this.plugin.settings.addTitle = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Add Alias")
			.setDesc("Add title as frontmatter alias")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.addAlias)
					.onChange(async (value) => {
						this.plugin.settings.addAlias = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Template File")
			.setDesc("Path to template file")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.templateFile)
					.onChange(async (value) => {
						this.plugin.settings.templateFile = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}

// ZettelSuggester import placeholder (should be imported from separate file)
class ZettelSuggester extends FuzzySuggestModal<string> {
	private titles: Map<string, TFile>;
	private completion: (file: TFile) => void;
	private initialQuery: string;

	constructor(
		app: App,
		titles: Map<string, TFile>,
		search: string | undefined,
		completion: (file: TFile) => void,
	) {
		super(app);
		this.initialQuery = search ?? "";
		this.titles = titles;
		this.completion = completion;
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

	onChooseItem(item: string, _evt: MouseEvent | KeyboardEvent) {
		this.completion(this.titles.get(item)!);
	}
}

export default class NewZettel extends Plugin {
	settings!: NewZettelSettings;

	incrementStringIDComponent(id: string): string {
		const comps = id.split("");
		const last = comps.pop()!;
		return comps.concat([lettersIDComponentSuccessors[last]]).join("");
	}

	incrementNumberIDComponent(id: string): string {
		return (parseInt(id) + 1).toString();
	}

	isNumber(string: string): boolean {
		return /^\d+$/.test(string);
	}

	incrementIDComponent(id: string): string {
		if (this.isNumber(id)) {
			return this.incrementNumberIDComponent(id);
		} else {
			return this.incrementStringIDComponent(id);
		}
	}

	incrementID(id: string): string {
		const parts = id.match(idOnlyRegex)!;
		const lastPart = parts.pop()!;
		return parts.concat([this.incrementIDComponent(lastPart)]).join("");
	}

	parentID(id: string): string {
		const parts = id.match(idOnlyRegex)!;
		if (parts) {
			parts.pop();
			return parts.join("");
		} else {
			return "";
		}
	}

	nextComponentOf(id: string): string {
		const parts = id.match(idOnlyRegex)!;
		const lastPart = parts.pop()!;
		if (this.isNumber(lastPart)) {
			return "a";
		} else {
			return "1";
		}
	}

	firstChildOf(parentID: string): string {
		return parentID + this.nextComponentOf(parentID);
	}

	fileToId(filename: string): string {
		const ruleRegexes: Record<string, RegExp> = {
			strict: /^((?:[0-9]+|[a-z]+)+)$/,
			separator: new RegExp(
				`^((?:[0-9]+|[a-z]+)+)${this.settings.separator}.*`,
			),
			fuzzy: /^((?:[0-9]+|[a-z]+)+).*/,
		};
		const match = filename.match(ruleRegexes[this.settings.matchRule]);
		if (match) {
			return match[1];
		}
		return "";
	}

	idExists(id: string): boolean {
		const fileMatcher = (file: TFile) =>
			this.fileToId(file.basename) === id;
		return (
			this.app.vault.getMarkdownFiles().filter(fileMatcher).length != 0
		);
	}

	firstAvailableID(startingID: string): string {
		let nextID = startingID;
		while (this.idExists(nextID)) {
			nextID = this.incrementID(nextID);
		}
		return nextID;
	}

	makeNoteForNextSiblingOf(sibling: TFile): string {
		const nextID = this.firstAvailableID(
			this.incrementID(this.fileToId(sibling.basename)),
		);
		return nextID;
	}

	makeNoteForNextChildOf(parent: TFile): string {
		const childID = this.firstAvailableID(
			this.firstChildOf(this.fileToId(parent.basename)),
		);
		return childID;
	}

	async makeNote(
		path: string,
		title: string,
		fileLink: string,
		placeCursorAtStartOfContent: boolean,
		openZettel = false,
		successCallback: () => void = () => {
			return;
		},
	) {
		const useTemplate =
			this.settings.templateFile &&
			this.settings.templateFile.trim() != "";
		const app = this.app;
		let titleContent = null;
		if (title && title.length > 0) {
			titleContent =
				(useTemplate == false ? "# " : "") + title.trimStart();
		} else {
			titleContent = "";
		}

		let file = null;
		const backlinkRegex = /{{link}}/g;
		const titleRegex = /{{title}}/g;
		if (useTemplate) {
			let template_content = "";
			try {
				template_content = await this.app.vault.adapter.read(
					this.settings.templateFile.trim(),
				);
			} catch {
				new Notice(
					`[LUHMAN] Couldn't read template file. Make sure the path and file are valid/correct. Current setting: ${this.settings.templateFile.trim()}`,
					15000,
				);
				return;
			}

			const testTitle =
				this.settings.templateRequireTitle == false ||
				titleRegex.test(template_content);
			const testLink =
				this.settings.templateRequireLink == false ||
				backlinkRegex.test(template_content);
			if (testTitle == false || testLink == false) {
				new Notice(
					`[LUHMAN] Template Malformed. Missing {{${testTitle ? "" : "title"}${
						testTitle == false && testLink == false
							? "}} and {{"
							: ""
					}${testLink ? "" : "link"}}} placeholder. Please add ${
						testTitle == false && testLink == false ? "them" : "it"
					} to the template and try again...`,
					15000,
				);
				return;
			}

			const file_content = template_content
				.replace(titleRegex, titleContent)
				.replace(backlinkRegex, fileLink);
			file = await this.app.vault.create(path, file_content);
			successCallback();
		} else {
			const fullContent = titleContent + "\n\n" + fileLink;
			file = await this.app.vault.create(path, fullContent);

			successCallback();
		}

		if (this.settings.addAlias && file) {
			await this.app.fileManager.processFrontMatter(
				file,
				(frontMatter) => {
					frontMatter = frontMatter || {};
					frontMatter.aliases = frontMatter.aliases || [];
					frontMatter.aliases.push(title);
					return frontMatter;
				},
			);
		}

		const active = app.workspace.getLeaf();
		if (active == null) {
			return;
		}
		if (openZettel == false) return;

		await active.openFile(file);

		const editor = app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (editor == null) {
			return;
		}

		if (
			placeCursorAtStartOfContent &&
			(!this.settings.templateFile ||
				this.settings.templateFile.trim() == "")
		) {
			let line = 2;
			if (this.settings.addAlias) {
				line += 4;
			}
			const position: EditorPosition = { line, ch: 0 };
			editor.setCursor(position);
		} else {
			editor.exec("goEnd");
		}
	}

	isZettelFile(name: string): boolean {
		const mdRegex = /(.*)\.md$/;
		const matchedName = mdRegex.exec(name)?.[1] || null;
		return matchedName != null && this.fileToId(matchedName) !== "";
	}

	makeNoteFunction(idGenerator: (file: TFile) => string, openNewFile = true) {
		const file = this.app.workspace.getActiveFile();
		if (file == null) {
			return;
		}
		if (this.isZettelFile(file.name)) {
			const fileLink = "[[" + file.basename + "]]";

			const editor =
				this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			if (editor == null) {
				return;
			}

			const selection = editor.getSelection();

			const nextID = idGenerator.bind(this, file)();
			const nextPath = (title: string) =>
				file?.path
					? this.app.fileManager.getNewFileParent(file.path).path +
						"/" +
						nextID +
						(this.settings.addTitle
							? this.settings.separator + title
							: "") +
						".md"
					: "";
			const useLinkAlias = this.settings.useLinkAlias;
			const newLink = (title: string) => {
				const alias = useLinkAlias ? `|${title}` : "";

				return `[[${nextID}${
					this.settings.addTitle
						? this.settings.separator + title
						: ""
				}${alias}]]`;
			};

			if (selection) {
				// This current solution eats line returns spaces but thats
				// fine as it is turning the selection into a title so it makes sense
				const selectionTrimStart = selection.trimStart();
				const selectionTrimEnd = selectionTrimStart.trimEnd();
				const spaceBefore =
					selection.length - selectionTrimStart.length;
				const spaceAfter =
					selectionTrimStart.length - selectionTrimEnd.length;
				const title = selectionTrimEnd
					.split(/\s+/)
					.map((w) => w[0].toUpperCase() + w.slice(1))
					.join(" ");
				const selectionPos = editor!.listSelections()[0];
				/* By default the anchor is what ever position the selection started
	       how ever replaceRange does not accept it both ways and
	       gets weird if we just pass in the anchor then the head
	       so here we create a vertual anchor and head position to pass in */
				const anchorCorrect =
					selectionPos.anchor.line == selectionPos.head.line // If the anchor and head are on the same line
						? selectionPos.anchor.ch <= selectionPos.head.ch // Then if anchor is before the head
						: selectionPos.anchor.line < selectionPos.head.line; // else they are not on the same line and just check if anchor is before head

				// if anchorCorrect use as is, else switch
				const virtualAnchor = anchorCorrect
					? selectionPos.anchor
					: selectionPos.head;
				const virtualHead = anchorCorrect
					? selectionPos.head
					: selectionPos.anchor;
				this.makeNote(
					nextPath(title),
					title,
					fileLink,
					true,
					openNewFile,
					() => {
						editor!.replaceRange(
							" ".repeat(spaceBefore) +
								newLink(title) +
								" ".repeat(spaceAfter),
							virtualAnchor,
							virtualHead,
						);
					},
				);
			} else {
				new NewZettelModal(
					this.app,
					(title: string, options) => {
						this.makeNote(
							nextPath(title),
							title,
							fileLink,
							true,
							options.openNewZettel,
							this.insertTextIntoCurrentNote(newLink(title)),
						);
					},
					{
						openNewZettel: openNewFile,
					},
				).open();
			}
		} else {
			new Notice(
				`Couldn't find ID in "${file.basename}". ${checkSettingsMessage}`,
			);
		}
	}

	async renameZettel(id: string, toId: string) {
		const zettel = this.app.vault
			.getMarkdownFiles()
			.filter((file) => this.fileToId(file.basename) === id)
			.first();
		if (zettel) {
			const id = this.fileToId(zettel.basename);
			const rest = zettel.basename.split(id)[1];
			this.app.fileManager.renameFile(
				zettel,
				zettel.parent?.path + toId + rest + "." + zettel.extension,
			);
		} else {
			new Notice(
				`Couldn't find file for ID ${id}. ${checkSettingsMessage}`,
			);
		}
	}

	async moveChildrenDown(id: string) {
		const children = this.getDirectChildZettels(id);
		for (const child of children) {
			await this.moveZettelDown(this.fileToId(child.basename));
		}
	}

	async moveZettelDown(id: string) {
		this.moveChildrenDown(id);
		await this.renameZettel(id, this.firstAvailableID(id));
	}

	async outdentZettel(id: string) {
		const newID = this.incrementID(this.parentID(id));
		if (this.idExists(newID)) {
			await this.moveZettelDown(newID);
		}

		for (const child of this.getDirectChildZettels(id)) {
			const newChildID: string = this.firstAvailableID(
				this.firstChildOf(newID),
			);
			await this.renameZettel(this.fileToId(child.basename), newChildID);
		}

		await this.renameZettel(id, newID);
	}

	async onload() {
		console.log("loading New Zettel");
		await this.loadSettings();
		this.addSettingTab(new LuhmanSettingTab(this.app, this));

		this.addCommand({
			id: "new-sibling-note",
			name: "New Sibling Zettel Note",
			icon: "file-symlink",
			callback: () => {
				this.makeNoteFunction(this.makeNoteForNextSiblingOf);
			},
		});

		this.addCommand({
			id: "new-child-note",
			name: "New Child Zettel Note",
			icon: "file-down",
			callback: () => {
				this.makeNoteFunction(this.makeNoteForNextChildOf);
			},
		});

		this.addCommand({
			id: "new-sibling-note-dont-open",
			name: "New Sibling Zettel Note (Don't Open)",
			icon: "file-symlink",
			callback: () => {
				this.makeNoteFunction(this.makeNoteForNextSiblingOf, false);
			},
		});

		this.addCommand({
			id: "new-child-note-dont-open",
			name: "New Child Zettel Note (Don't Open)",
			icon: "file-down",
			callback: () => {
				this.makeNoteFunction(this.makeNoteForNextChildOf, false);
			},
		});

		this.addCommand({
			id: "insert-zettel-link",
			name: "Insert Zettel Link",
			icon: "link-2",
			callback: async () => {
				const titles = await this.getAllNoteTitles();
				new ZettelSuggester(
					this.app,
					titles,
					this.currentlySelectedText(),
					(file) => {
						const doInsert = this.insertTextIntoCurrentNote(
							`[[${file.basename}]]`,
						);
						if (doInsert == undefined)
							new Notice(
								"Error inserting link, Code: 6a46de1d-a8da-4dae-af41-9d444eaf3d4d",
							);
						else doInsert();
					},
				).open();
			},
		});

		this.addCommand({
			id: "open-zettel",
			name: "Open Zettel",
			icon: "folder-open",
			callback: async () => {
				const titles = await this.getAllNoteTitles();

				new ZettelSuggester(
					this.app,
					titles,
					this.currentlySelectedText(),
					(file) => {
						this.app.workspace.getLeaf().openFile(file);
					},
				).open();
			},
		});

		this.addCommand({
			id: "open-parent-zettel",
			name: "Open Parent Zettel",
			icon: "folder-open",
			callback: () => {
				const file = this.currentFile();
				if (file) {
					const id = this.fileToId(file.basename);
					const parentId = this.parentID(id);
					if (parentId === "") {
						new Notice(
							`No parent found for "${file.basename}". ${checkSettingsMessage}`,
						);
						return;
					}
					this.openZettel(parentId);
				} else {
					new Notice("No file open");
				}
			},
		});

		this.addCommand({
			id: "outdent-zettel",
			name: "Outdent Zettel",
			icon: "outdent",
			callback: () => {
				const file = this.currentFile();
				if (file) {
					this.outdentZettel(this.fileToId(file.basename));
				}
			},
		});
	}

	onunload() {
		console.log("unloading New Zettel");
	}

	currentFile(): TFile | undefined {
		return (
			this.app.workspace.getActiveViewOfType(MarkdownView)?.file ||
			undefined
		);
	}

	openZettel(id: string) {
		const file = this.app.vault
			.getMarkdownFiles()
			.filter((file) => this.fileToId(file.basename) == id)
			.first();
		if (file) {
			this.app.workspace.getLeaf().openFile(file);
		}
	}

	currentlySelectedText(): string | undefined {
		return this.app.workspace
			.getActiveViewOfType(MarkdownView)
			?.editor.getSelection();
	}

	insertTextIntoCurrentNote(text: string) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (view) {
			const editor = view!.editor;

			let position: EditorPosition;
			let prefix = "";

			if (editor.getSelection()) {
				const selectionPos = editor.listSelections()[0];
				const positionCH = Math.max(
					selectionPos.head.ch,
					selectionPos.anchor.ch,
				);
				position = {
					line: selectionPos.anchor.line,
					ch: positionCH + 1,
				};
				prefix = " ";
			} else {
				position = editor.getCursor();
			}

			return () => {
				editor.replaceRange(prefix + text, position, position);
			};
		}
	}

	getZettels(): TFile[] {
		const fileToId = (file: TFile) => this.fileToId(file.basename);
		return this.app.vault.getMarkdownFiles().filter((file) => {
			const ignore = !file.path.match(/^(_layouts|templates|scripts)/);
			return ignore && fileToId(file) !== "";
		});
	}

	getDirectChildZettels(ofParent: string): TFile[] {
		return this.getZettels().filter((file) => {
			return this.parentID(this.fileToId(file.basename)) == ofParent;
		});
	}

	async getAllNoteTitles(): Promise<Map<string, TFile>> {
		const regex = /# (.+)\s*/;
		const titles: Map<string, TFile> = new Map();
		for (const file of this.getZettels()) {
			const text = await this.app.vault.cachedRead(file);
			const match = text.match(regex);
			if (match) {
				titles.set(match[1], file);
			}
		}

		return titles;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_NEWZETTEL_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
