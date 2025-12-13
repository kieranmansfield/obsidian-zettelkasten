import { ItemView, WorkspaceLeaf, TFile, setIcon, Notice } from "obsidian";
import type ZettelkastenPlugin from "../../main";
import { SequenceReorderModal } from "./SequenceReorderModal";

export const VIEW_TYPE_NOTE_SEQUENCES = "note-sequences-view";

interface SequenceNode {
	file: TFile;
	zettelId: string;
	level: number;
	children: SequenceNode[];
}

interface ParentNote {
	file: TFile;
	zettelId: string;
	children: SequenceNode[];
}

export class NoteSequencesView extends ItemView {
	plugin: ZettelkastenPlugin;
	private refreshTimeout: NodeJS.Timeout | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: ZettelkastenPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.registerEvents();
	}

	private registerEvents(): void {
		// Refresh view when files are created, deleted, or modified
		this.registerEvent(
			this.app.vault.on("create", () => this.scheduleRefresh()),
		);
		this.registerEvent(
			this.app.vault.on("delete", () => this.scheduleRefresh()),
		);
		this.registerEvent(
			this.app.vault.on("rename", () => this.scheduleRefresh()),
		);
	}

	private scheduleRefresh(): void {
		// Debounce refreshes to avoid excessive updates
		if (this.refreshTimeout) {
			clearTimeout(this.refreshTimeout);
		}
		this.refreshTimeout = setTimeout(() => {
			this.refresh();
			this.refreshTimeout = null;
		}, 300);
	}

	public refresh(): void {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("note-sequences-view");
		this.renderContent(container);
	}

	getViewType(): string {
		return VIEW_TYPE_NOTE_SEQUENCES;
	}

	getDisplayText(): string {
		return "Note Sequences";
	}

	getIcon(): string {
		return "layers";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("note-sequences-view");
		this.renderContent(container);
	}

	private renderContent(container: HTMLElement): void {
		// Get all parent notes (notes that have sequences)
		const parentNotes = this.findParentNotes();

		if (parentNotes.length === 0) {
			container.createDiv({
				cls: "sequence-empty-state",
				text: "No note sequences found",
			});
			return;
		}

		// Create grid container
		const gridContainer = container.createDiv({ cls: "sequence-grid" });

		// Display each parent note as a card
		parentNotes.forEach((parent) => {
			this.createSequenceCard(gridContainer, parent);
		});
	}

	private findParentNotes(): ParentNote[] {
		const parentNotes: ParentNote[] = [];
		const zettelsFolder = this.plugin.settings.zettelsLocation;

		if (!zettelsFolder) {
			return parentNotes;
		}

		const folder = this.app.vault.getAbstractFileByPath(zettelsFolder);
		if (!folder) {
			return parentNotes;
		}

		// Get all files in zettels folder
		const allFiles = this.app.vault
			.getMarkdownFiles()
			.filter((file) => file.path.startsWith(zettelsFolder));

		// Find files that are parent-level zettels (just timestamp, no hierarchy suffix)
		const parentFiles = allFiles.filter((file) => {
			const zettelId = this.extractZettelId(file.basename);
			if (!zettelId) return false;

			// Check if this is a parent-level ID (no hierarchy suffix like 'a', '1a', etc.)
			const idWithoutPrefix = this.stripPrefix(zettelId);
			// Parent IDs should be just the timestamp (all digits)
			return /^\d+$/.test(idWithoutPrefix);
		});

		// Build hierarchy for each parent
		parentFiles.forEach((parentFile) => {
			const parentId = this.extractZettelId(parentFile.basename);
			if (!parentId) return;

			const children = this.buildHierarchy(parentId, allFiles);

			if (children.length > 0) {
				parentNotes.push({
					file: parentFile,
					zettelId: parentId,
					children: children,
				});
			}
		});

		// Sort by zettel ID (most recent first)
		parentNotes.sort((a, b) => b.zettelId.localeCompare(a.zettelId));

		return parentNotes;
	}

	private buildHierarchy(
		parentId: string,
		allFiles: TFile[],
	): SequenceNode[] {
		const children: SequenceNode[] = [];
		const parentIdWithoutPrefix = this.stripPrefix(parentId);

		// Find all children of this parent
		allFiles.forEach((file) => {
			const childId = this.extractZettelId(file.basename);
			if (!childId || childId === parentId) return;

			const childIdWithoutPrefix = this.stripPrefix(childId);

			// Check if this file is a direct child of the parent
			if (
				childIdWithoutPrefix.startsWith(parentIdWithoutPrefix) &&
				childIdWithoutPrefix.length > parentIdWithoutPrefix.length
			) {
				const suffix = childIdWithoutPrefix.substring(
					parentIdWithoutPrefix.length,
				);
				const level = this.calculateLevel(suffix);

				children.push({
					file: file,
					zettelId: childId,
					level: level,
					children: [],
				});
			}
		});

		// Sort children by ID
		children.sort((a, b) => a.zettelId.localeCompare(b.zettelId));

		return children;
	}

	private calculateLevel(suffix: string): number {
		if (!suffix) return 1;

		// Count transitions between letters and numbers
		let level = 1;
		let lastWasLetter = /[a-z]/.test(suffix[0]);

		for (let i = 1; i < suffix.length; i++) {
			const isLetter = /[a-z]/.test(suffix[i]);
			if (isLetter !== lastWasLetter) {
				level++;
				lastWasLetter = isLetter;
			}
		}

		return level;
	}

	private createSequenceCard(
		container: HTMLElement,
		parent: ParentNote,
	): void {
		const card = container.createDiv({ cls: "sequence-card" });

		// Card header with parent note
		const header = card.createDiv({ cls: "sequence-card-header" });

		const headerContent = header.createDiv({
			cls: "sequence-card-header-content",
		});

		// Parent icon
		const iconEl = headerContent.createDiv({ cls: "sequence-card-icon" });
		setIcon(iconEl, "layers");

		// Parent title/filename (clickable)
		const titleEl = headerContent.createDiv({ cls: "sequence-card-title" });
		const cache = this.app.metadataCache.getFileCache(parent.file);
		const title = (cache?.frontmatter?.title as string | undefined) || parent.file.basename;
		titleEl.setText(title);
		titleEl.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.app.workspace.getLeaf(false).openFile(parent.file);
		});

		// Action buttons container
		const actionsEl = headerContent.createDiv({
			cls: "sequence-card-actions",
		});

		// Open in new tab button
		const openBtn = actionsEl.createDiv({
			cls: "sequence-card-action-btn",
			attr: { "aria-label": "Open sequence in new tab" },
		});
		setIcon(openBtn, "external-link");
		openBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.openSequenceInNewTab(parent);
		});

		// Reorder button
		const reorderBtn = actionsEl.createDiv({
			cls: "sequence-card-action-btn",
			attr: { "aria-label": "Reorder sequence" },
		});
		setIcon(reorderBtn, "list-ordered");
		reorderBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.openReorderModal(parent);
		});

		// Card body with children
		const body = card.createDiv({ cls: "sequence-card-body" });

		if (parent.children.length === 0) {
			body.createDiv({
				cls: "sequence-card-empty",
				text: "No children",
			});
		} else {
			parent.children.forEach((child) => {
				this.createChildItem(body, child);
			});
		}
	}

	private createChildItem(container: HTMLElement, node: SequenceNode): void {
		const item = container.createDiv({
			cls: "sequence-child-item",
		});
		item.setCssProps({
			paddingLeft: `${12 + (node.level - 1) * 20}px`,
		});

		// Child title/filename (no icon)
		const titleEl = item.createDiv({ cls: "sequence-child-title" });
		const cache = this.app.metadataCache.getFileCache(node.file);
		const title = (cache?.frontmatter?.title as string | undefined) || node.file.basename;
		titleEl.setText(title);

		// Click handler to open the file
		item.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.app.workspace.getLeaf(false).openFile(node.file);
		});

		// Recursively render children
		if (node.children && node.children.length > 0) {
			node.children.forEach((child) => {
				this.createChildItem(container, child);
			});
		}
	}

	private async openSequenceInNewTab(parent: ParentNote): Promise<void> {
		await this.app.workspace.getLeaf(true).openFile(parent.file);
	}

	private openReorderModal(parent: ParentNote): void {
		// Get all children as flat list for the modal
		const childFiles = parent.children.map((child) => child.file);

		const modal = new SequenceReorderModal(
			this.app,
			parent.file,
			childFiles,
			(reorderedNotes, promoted, indentLevels, compactRequested) => {
				void this.handleSequenceReorder(
					parent.file,
					parent.zettelId,
					reorderedNotes,
					promoted,
					indentLevels,
					compactRequested,
				);
			},
		);

		modal.open();
	}

	private async handleSequenceReorder(
		parentFile: TFile,
		parentId: string,
		reorderedNotes: TFile[],
		promoted: TFile[],
		indentLevels: Map<TFile, number>,
		compactRequested: boolean,
	): Promise<void> {
		const folder = parentFile.parent || this.plugin.app.vault.getRoot();

		// Handle promoted notes first (notes that became siblings of parent)
		const tempPromotedPrefix = `_temp_promoted_${Date.now()}_`;
		const promotedTempNames = new Map<TFile, string>();

		// First, move promoted notes to temp names to avoid collisions
		for (let i = 0; i < promoted.length; i++) {
			const promotedFile = promoted[i];
			const tempPath = `${folder.path}/${tempPromotedPrefix}${i}.md`;
			await this.plugin.app.fileManager.renameFile(
				promotedFile,
				tempPath,
			);
			promotedTempNames.set(promotedFile, `${tempPromotedPrefix}${i}`);
		}

		// Then rename to final promoted names
		for (const promotedFile of promoted) {
			const grandparentId = this.getParentZettelId(parentId);
			if (grandparentId) {
				const newId = await this.generateChildZettelId(
					grandparentId,
					folder,
					promotedFile,
				);
				const newPath = `${folder.path}/${newId}.md`;
				await this.plugin.app.fileManager.renameFile(
					promotedFile,
					newPath,
				);
			} else {
				// No grandparent - promote to root level (new sequence)
				const newId = await this.generateZettelId();
				const newPath = `${folder.path}/${newId}.md`;
				await this.plugin.app.fileManager.renameFile(
					promotedFile,
					newPath,
				);
			}
		}

		// Handle regular children with proper IDs based on indent levels
		const tempChildPrefix = `_temp_child_${Date.now()}_`;
		const childTempNames = new Map<TFile, string>();

		// First pass: move to temp names
		for (let i = 0; i < reorderedNotes.length; i++) {
			const note = reorderedNotes[i];
			const tempPath = `${folder.path}/${tempChildPrefix}${i}.md`;
			await this.plugin.app.fileManager.renameFile(note, tempPath);
			childTempNames.set(note, `${tempChildPrefix}${i}`);
		}

		// Second pass: assign proper IDs based on hierarchy
		const actualParentId = this.stripPrefix(parentId);

		// Track counters for each parent at each level
		const counterMap = new Map<string, string>(); // Maps parent ID to next available letter/number

		// Track what the actual parent ID is for each note (to handle nesting)
		const noteParents = new Map<TFile, string>();
		const noteNewIds = new Map<TFile, string>();

		let lastLevel1Id = "";
		let lastLevel2Id = "";

		for (const note of reorderedNotes) {
			const level = indentLevels.get(note) || 1;
			let newId: string;
			let noteParentId: string;

			if (level === 1) {
				// Direct child of root parent - use letters
				noteParentId = actualParentId;
				const currentLetter = counterMap.get(noteParentId) || "a";

				// Check if we've exceeded the letter limit
				if (currentLetter === "z" && counterMap.has(noteParentId)) {
					new Notice(
						"Error: Maximum of 26 children (a-z) reached for this parent",
					);
					continue;
				}

				newId = actualParentId + currentLetter;
				const nextLetter = this.getNextLetter(currentLetter);

				// Only update counter if we haven't hit the limit
				if (nextLetter !== currentLetter) {
					counterMap.set(noteParentId, nextLetter);
				}

				lastLevel1Id = newId;
			} else if (level === 2) {
				// Child of previous level-1 child - use numbers
				if (!lastLevel1Id) {
					new Notice(
						"Error: Cannot create level 2 child without a level 1 parent",
					);
					continue;
				}

				noteParentId = lastLevel1Id;
				const currentNumber = counterMap.get(noteParentId) || "1";
				newId = lastLevel1Id + currentNumber;
				counterMap.set(
					noteParentId,
					(parseInt(currentNumber) + 1).toString(),
				);
				lastLevel2Id = newId;
			} else if (level === 3) {
				// Child of previous level-2 child - use letters again
				if (!lastLevel2Id) {
					new Notice(
						"Error: Cannot create level 3 child without a level 2 parent",
					);
					continue;
				}

				noteParentId = lastLevel2Id;
				const currentLetter = counterMap.get(noteParentId) || "a";

				// Check if we've exceeded the letter limit
				if (currentLetter === "z" && counterMap.has(noteParentId)) {
					new Notice(
						"Error: Maximum of 26 children (a-z) reached for this parent",
					);
					continue;
				}

				newId = lastLevel2Id + currentLetter;
				const nextLetter = this.getNextLetter(currentLetter);

				// Only update counter if we haven't hit the limit
				if (nextLetter !== currentLetter) {
					counterMap.set(noteParentId, nextLetter);
				}
			} else {
				new Notice(
					`Error: Invalid nesting level ${level}. Maximum depth is 3.`,
				);
				continue;
			}

			noteParents.set(note, noteParentId);
			noteNewIds.set(note, newId);

			// Add prefix if configured
			const prefix = (this.plugin.settings as { useZettelPrefix?: boolean; zettelPrefix?: string }).useZettelPrefix
				? (this.plugin.settings as { zettelPrefix?: string }).zettelPrefix
				: "";
			const finalId = prefix + newId;

			const newPath = `${folder.path}/${finalId}.md`;
			await this.plugin.app.fileManager.renameFile(note, newPath);
		}

		new Notice("Sequence reordered successfully!");
		this.refresh();
	}

	private getNextLetter(current: string): string {
		// Only support single letters a-z at each level
		if (current.length === 1) {
			if (current === "z") {
				// Can't go beyond 'z', return 'z' and caller should handle the error
				return "z";
			}
			return String.fromCharCode(current.charCodeAt(0) + 1);
		}

		// Multi-character letters are not supported in the zettelkasten hierarchy
		return current;
	}

	private getParentZettelId(zettelId: string): string | null {
		const idWithoutPrefix = this.stripPrefix(zettelId);

		// Remove the last segment (either letter or number sequence)
		const match = idWithoutPrefix.match(/^(.+?)([a-z]+|\d+)$/);
		if (match) {
			const prefix = this.plugin.settings.useZettelPrefix
				? this.plugin.settings.zettelPrefix
				: "";
			return prefix + match[1];
		}

		return null;
	}

	private async generateChildZettelId(
		parentId: string,
		folder: { path: string },
		childFile: TFile,
	): Promise<string> {
		const parentIdWithoutPrefix = this.stripPrefix(parentId);
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((f) => f.path.startsWith(folder.path));

		// Find all existing children
		const existingChildren = files.filter((file) => {
			const id = this.extractZettelId(file.basename);
			if (!id) return false;
			const idWithoutPrefix = this.stripPrefix(id);
			return (
				idWithoutPrefix.startsWith(parentIdWithoutPrefix) &&
				idWithoutPrefix.length > parentIdWithoutPrefix.length
			);
		});

		// Determine if we should use letter or number
		const shouldUseLetter = this.shouldUseLetterForChild(parentId);

		if (shouldUseLetter) {
			// Find highest letter
			let highestLetter = "a";
			existingChildren.forEach((file) => {
				const id = this.extractZettelId(file.basename);
				if (!id) return;
				const idWithoutPrefix = this.stripPrefix(id);
				const suffix = idWithoutPrefix.substring(
					parentIdWithoutPrefix.length,
				);
				const letterMatch = suffix.match(/^([a-z]+)/);
				if (letterMatch && letterMatch[1] > highestLetter) {
					highestLetter = letterMatch[1];
				}
			});

			const nextLetter = this.getNextLetter(highestLetter);
			const prefix = this.plugin.settings.useZettelPrefix
				? this.plugin.settings.zettelPrefix
				: "";
			return prefix + parentIdWithoutPrefix + nextLetter;
		} else {
			// Find highest number
			let highestNumber = 0;
			existingChildren.forEach((file) => {
				const id = this.extractZettelId(file.basename);
				if (!id) return;
				const idWithoutPrefix = this.stripPrefix(id);
				const suffix = idWithoutPrefix.substring(
					parentIdWithoutPrefix.length,
				);
				const numberMatch = suffix.match(/^(\d+)/);
				if (numberMatch) {
					const num = parseInt(numberMatch[1]);
					if (num > highestNumber) {
						highestNumber = num;
					}
				}
			});

			const prefix = this.plugin.settings.useZettelPrefix
				? this.plugin.settings.zettelPrefix
				: "";
			return prefix + parentIdWithoutPrefix + (highestNumber + 1);
		}
	}

	private shouldUseLetterForChild(parentId: string): boolean {
		const idWithoutPrefix = this.stripPrefix(parentId);

		// If parent ID ends with a number, child should use letter
		// If parent ID ends with letter, child should use number
		const lastChar = idWithoutPrefix[idWithoutPrefix.length - 1];
		return /\d/.test(lastChar);
	}

	private async generateZettelId(): Promise<string> {
		const format = this.plugin.settings.zettelIdFormat;
		const date = new Date();

		let timestamp = "";
		timestamp += date.getFullYear().toString();
		timestamp += (date.getMonth() + 1).toString().padStart(2, "0");
		timestamp += date.getDate().toString().padStart(2, "0");
		timestamp += date.getHours().toString().padStart(2, "0");
		timestamp += date.getMinutes().toString().padStart(2, "0");
		timestamp += date.getSeconds().toString().padStart(2, "0");

		if (format.includes("SSS")) {
			timestamp += date.getMilliseconds().toString().padStart(3, "0");
		}

		const prefix = this.plugin.settings.useZettelPrefix
			? this.plugin.settings.zettelPrefix
			: "";

		return prefix + timestamp;
	}

	private extractZettelId(filename: string): string | null {
		// Match timestamp pattern with optional prefix
		const withPrefixMatch = filename.match(
			/^([a-z]+\d{13,}(?:[a-z]+|\d+)*)/,
		);
		if (withPrefixMatch) {
			return withPrefixMatch[1];
		}

		// Try without prefix
		const withoutPrefixMatch = filename.match(/^(\d{13,}(?:[a-z]+|\d+)*)/);
		return withoutPrefixMatch ? withoutPrefixMatch[1] : null;
	}

	private stripPrefix(zettelId: string): string {
		const prefixMatch = zettelId.match(/^([a-z]+)/);
		if (prefixMatch) {
			return zettelId.substring(prefixMatch[1].length);
		}
		return zettelId;
	}

	async onClose(): Promise<void> {
		// Clear any pending refresh timeout
		if (this.refreshTimeout) {
			clearTimeout(this.refreshTimeout);
			this.refreshTimeout = null;
		}
	}
}
