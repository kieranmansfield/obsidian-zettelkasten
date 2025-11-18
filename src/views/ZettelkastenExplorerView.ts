import { ItemView, WorkspaceLeaf, TFile, Notice, Menu } from "obsidian";
import type ZettelkastenPlugin from "../../main";

export const ZETTELKASTEN_EXPLORER_VIEW_TYPE = "zettelkasten-explorer-view";

type NoteType = "all" | "zettel" | "fleeting" | "moc" | "index";

interface ZettelNode {
	file: TFile;
	children: ZettelNode[];
	parent?: ZettelNode;
	level: number;
	id: string;
}

export class ZettelkastenExplorerView extends ItemView {
	plugin: ZettelkastenPlugin;
	private selectedNoteType: NoteType = "all";
	private rootNodes: ZettelNode[] = [];

	constructor(leaf: WorkspaceLeaf, plugin: ZettelkastenPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return ZETTELKASTEN_EXPLORER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Zettelkasten Explorer";
	}

	getIcon(): string {
		return "network";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("zettelkasten-explorer-view");

		// Create header with box selector
		this.createHeader(container);

		// Create tree container
		const treeContainer = container.createDiv({
			cls: "zettelkasten-tree-container",
		});

		// Register event listeners for auto-refresh
		this.registerEvent(this.app.vault.on("create", () => this.refresh()));
		this.registerEvent(this.app.vault.on("delete", () => this.refresh()));
		this.registerEvent(this.app.vault.on("rename", () => this.refresh()));
		this.registerEvent(
			this.app.metadataCache.on("changed", () => this.refresh()),
		);

		// Initial render
		await this.refresh();
	}

	async onClose(): Promise<void> {
		// Cleanup if needed
	}

	private createHeader(container: HTMLElement): void {
		const header = container.createDiv({
			cls: "zettelkasten-explorer-header",
		});

		// Note type icon button group
		const buttonGroup = header.createDiv({
			cls: "zettelkasten-type-buttons",
		});

		const noteTypes: Array<{
			value: NoteType;
			label: string;
			icon: string;
		}> = [
			{ value: "all", label: "All notes", icon: "list" },
			{ value: "zettel", label: "Zettels", icon: "file-text" },
			{ value: "fleeting", label: "Fleeting notes", icon: "zap" },
			{ value: "moc", label: "MOCs", icon: "map" },
			{ value: "index", label: "Indexes", icon: "book-open" },
		];

		for (const type of noteTypes) {
			const button = buttonGroup.createEl("button", {
				cls: "zettelkasten-type-button",
				attr: {
					"aria-label": type.label,
				},
			});

			// Use Obsidian's setIcon helper if available, otherwise use lucide icons
			button.innerHTML = this.getIconSvg(type.icon);

			if (this.selectedNoteType === type.value) {
				button.addClass("is-active");
			}

			button.addEventListener("click", async () => {
				this.selectedNoteType = type.value;

				// Update active state
				buttonGroup
					.querySelectorAll(".zettelkasten-type-button")
					.forEach((btn) => {
						btn.removeClass("is-active");
					});
				button.addClass("is-active");

				await this.refresh();
			});
		}
	}

	async refresh(): Promise<void> {
		// Build tree structure
		await this.buildTree();

		// Render tree
		this.renderTree();
	}

	private async buildTree(): Promise<void> {
		this.rootNodes = [];
		const nodeMap = new Map<string, ZettelNode>();

		// Get all relevant files
		const files = await this.getRelevantFiles();

		// Create nodes for all files
		for (const file of files) {
			const id = this.extractZettelId(file.basename);
			if (!id) continue;

			const node: ZettelNode = {
				file,
				children: [],
				level: 0,
				id,
			};
			nodeMap.set(file.path, node);
		}

		// Build parent-child relationships based on filename patterns
		// Only for zettels: child filenames start with parent filename
		for (const node of nodeMap.values()) {
			// Look for potential parent by checking if another file's basename
			// is a prefix of this file's basename
			for (const potentialParent of nodeMap.values()) {
				if (potentialParent === node) continue;

				// Check if this node's basename starts with the potential parent's basename
				// e.g., "20251114032153981g" starts with "20251114032153981"
				// or "20251114032153981g1" starts with "20251114032153981g"
				if (
					node.file.basename.startsWith(
						potentialParent.file.basename,
					) &&
					node.file.basename !== potentialParent.file.basename
				) {
					// Make sure it's the closest parent (longest matching prefix)
					if (
						!node.parent ||
						potentialParent.file.basename.length >
							node.parent.file.basename.length
					) {
						// Remove from old parent if exists
						if (node.parent) {
							const idx = node.parent.children.indexOf(node);
							if (idx > -1) node.parent.children.splice(idx, 1);
						}

						potentialParent.children.push(node);
						node.parent = potentialParent;
					}
				}
			}

			// If no parent, it's a root node
			if (!node.parent) {
				this.rootNodes.push(node);
			}
		}

		// Calculate levels recursively from root nodes
		const calculateLevels = (node: ZettelNode, level: number) => {
			node.level = level;
			for (const child of node.children) {
				calculateLevels(child, level + 1);
			}
		};

		for (const rootNode of this.rootNodes) {
			calculateLevels(rootNode, 0);
		}

		// Sort nodes by ID
		this.sortNodes(this.rootNodes);
		for (const node of nodeMap.values()) {
			this.sortNodes(node.children);
		}
	}

	private sortNodes(nodes: ZettelNode[]): void {
		nodes.sort((a, b) => a.file.basename.localeCompare(b.file.basename));
	}

	private async getRelevantFiles(): Promise<TFile[]> {
		const allFiles = this.app.vault.getMarkdownFiles();
		const relevantFiles: TFile[] = [];

		for (const file of allFiles) {
			// Filter by note type if not "all"
			if (this.selectedNoteType !== "all") {
				const cache = this.app.metadataCache.getFileCache(file);
				const tags =
					cache?.tags?.map((t) => t.tag.replace("#", "")) || [];
				const frontmatterTags = cache?.frontmatter?.tags || [];

				const allTags = [
					...tags,
					...(Array.isArray(frontmatterTags)
						? frontmatterTags
						: [frontmatterTags].filter(Boolean)),
				].map((t) => String(t).replace("#", ""));

				// Get the tag for the selected note type
				let typeTag: string;
				switch (this.selectedNoteType) {
					case "zettel":
						typeTag = this.plugin.settings.zettelTag;
						break;
					case "fleeting":
						typeTag = this.plugin.settings.fleetingNotesTag;
						break;
					case "moc":
						typeTag = this.plugin.settings.mocsTag;
						break;
					case "index":
						typeTag = this.plugin.settings.indexesTag;
						break;
					default:
						continue;
				}

				if (!allTags.includes(typeTag)) {
					continue;
				}
			}

			relevantFiles.push(file);
		}

		return relevantFiles;
	}

	private renderTree(): void {
		const container = this.containerEl.querySelector(
			".zettelkasten-tree-container",
		);
		if (!container) return;

		container.empty();

		if (this.rootNodes.length === 0) {
			container.createDiv({
				cls: "zettelkasten-empty",
				text: "No zettels found",
			});
			return;
		}

		// Render each root node
		for (const node of this.rootNodes) {
			this.renderNode(container, node);
		}
	}

	private renderNode(container: HTMLElement, node: ZettelNode): void {
		const nodeEl = container.createDiv({ cls: "zettelkasten-tree-node" });
		const indent = node.level * 20;
		nodeEl.style.marginLeft = `${indent}px`;

		// Expand/collapse icon
		const hasChildren = node.children.length > 0;

		const expandIcon = nodeEl.createSpan({
			cls: hasChildren
				? "zettelkasten-tree-icon collapse-icon"
				: "zettelkasten-tree-icon-spacer",
		});

		// Create children container first if needed (before click handler references it)
		let childrenContainer: HTMLElement | null = null;
		if (hasChildren) {
			childrenContainer = container.createDiv({
				cls: "zettelkasten-tree-children is-collapsed",
			});

			expandIcon.setText("▼");
			expandIcon.addClass("is-collapsed");

			expandIcon.addEventListener("click", (e) => {
				e.stopPropagation();
				expandIcon.toggleClass(
					"is-collapsed",
					!expandIcon.hasClass("is-collapsed"),
				);
				childrenContainer!.toggleClass(
					"is-collapsed",
					!childrenContainer!.hasClass("is-collapsed"),
				);
			});
		}

		// File name
		const cache = this.app.metadataCache.getFileCache(node.file);
		const title = cache?.frontmatter?.title || node.file.basename;

		const nameEl = nodeEl.createSpan({
			cls: "zettelkasten-tree-name",
			text: title,
		});

		// Click to open file
		nameEl.addEventListener("click", async () => {
			await this.app.workspace.getLeaf().openFile(node.file);
		});

		// Right-click context menu
		nodeEl.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			e.stopPropagation();

			const menu = new Menu();

			menu.addItem((item) => {
				item.setTitle("Add child note")
					.setIcon("file-plus")
					.onClick(async () => {
						await this.createChildNote(node);
					});
			});

			menu.addItem((item) => {
				item.setTitle("Add sibling note")
					.setIcon("file-plus")
					.onClick(async () => {
						await this.createSiblingNote(node);
					});
			});

			menu.showAtMouseEvent(e);
		});

		// Render children
		if (hasChildren && childrenContainer) {
			for (const child of node.children) {
				this.renderNode(childrenContainer, child);
			}
		}
	}

	private extractZettelId(filename: string): string | null {
		// Try common zettel ID patterns
		const patterns = [
			/^(\d{12,14})/, // 12-14 digit timestamp
			/^(\d{4}-\d{2}-\d{2}-\d{6})/, // YYYY-MM-DD-HHMMSS
			/^(\d{8,10})/, // 8-10 digit ID
		];

		for (const pattern of patterns) {
			const match = filename.match(pattern);
			if (match) return match[1];
		}

		return null;
	}

	private async createChildNote(parentNode: ZettelNode): Promise<void> {
		try {
			// Generate new zettel ID (timestamp-based)
			const now = new Date();
			const id =
				now.getFullYear().toString() +
				(now.getMonth() + 1).toString().padStart(2, "0") +
				now.getDate().toString().padStart(2, "0") +
				now.getHours().toString().padStart(2, "0") +
				now.getMinutes().toString().padStart(2, "0") +
				now.getSeconds().toString().padStart(2, "0") +
				now.getMilliseconds().toString().padStart(3, "0");

			const filename = `${id}.md`;
			const parentLink = `[[${parentNode.file.basename}]]`;

			// Create note with frontmatter
			const content = `---
up: ${parentLink}
---

# ${filename.replace(".md", "")}

`;

			const file = await this.app.vault.create(filename, content);
			await this.app.workspace.getLeaf().openFile(file);
			new Notice(`Created child note: ${filename}`);
		} catch (error) {
			new Notice(`Failed to create child note: ${error.message}`);
		}
	}

	private async createSiblingNote(siblingNode: ZettelNode): Promise<void> {
		try {
			// Generate new zettel ID (timestamp-based)
			const now = new Date();
			const id =
				now.getFullYear().toString() +
				(now.getMonth() + 1).toString().padStart(2, "0") +
				now.getDate().toString().padStart(2, "0") +
				now.getHours().toString().padStart(2, "0") +
				now.getMinutes().toString().padStart(2, "0") +
				now.getSeconds().toString().padStart(2, "0") +
				now.getMilliseconds().toString().padStart(3, "0");

			const filename = `${id}.md`;

			// If sibling has a parent, use the same parent
			let content: string;
			if (siblingNode.parent) {
				const parentLink = `[[${siblingNode.parent.file.basename}]]`;
				content = `---
up: ${parentLink}
---

# ${filename.replace(".md", "")}

`;
			} else {
				// Sibling is a root note, so new note is also root
				content = `---
---

# ${filename.replace(".md", "")}

`;
			}

			const file = await this.app.vault.create(filename, content);
			await this.app.workspace.getLeaf().openFile(file);
			new Notice(`Created sibling note: ${filename}`);
		} catch (error) {
			new Notice(`Failed to create sibling note: ${error.message}`);
		}
	}

	private getIconSvg(iconName: string): string {
		const icons: Record<string, string> = {
			list: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
			"file-text": `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
			zap: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
			map: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
			"book-open": `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
			"refresh-cw": `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
		};
		return icons[iconName] || "";
	}
}
