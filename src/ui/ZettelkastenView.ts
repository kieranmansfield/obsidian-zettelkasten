import { ItemView, WorkspaceLeaf, TFolder, TFile, setIcon, getAllTags } from "obsidian";
import type ZettelkastenPlugin from "../../main";
import { VIEW_TYPE_NOTE_SEQUENCES } from "./NoteSequencesView";

export const VIEW_TYPE_ZETTELKASTEN = "zettelkasten-view";

interface MenuItem {
	name: string;
	icon: string;
	folderName: string;
	dashboardPath?: string;
	filterTags?: string[];
}

export class ZettelkastenView extends ItemView {
	private collapsedSections: Set<string> = new Set();
	plugin: ZettelkastenPlugin;
	private refreshTimeout: NodeJS.Timeout | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: ZettelkastenPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.registerEvents();
	}

	private registerEvents(): void {
		// Refresh panel when files are created, deleted, or modified
		this.registerEvent(
			this.app.vault.on("create", () => this.scheduleRefresh())
		);
		this.registerEvent(
			this.app.vault.on("delete", () => this.scheduleRefresh())
		);
		this.registerEvent(
			this.app.vault.on("rename", () => this.scheduleRefresh())
		);
		// Refresh when metadata changes (tags, frontmatter, etc.)
		this.registerEvent(
			this.app.metadataCache.on("changed", () => this.scheduleRefresh())
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
		container.addClass("zettelkasten-view");
		this.renderContent(container);
	}

	getViewType(): string {
		return VIEW_TYPE_ZETTELKASTEN;
	}

	getDisplayText(): string {
		return "Zettelkasten";
	}

	getIcon(): string {
		return "square-library";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("zettelkasten-view");
		this.renderContent(container);
	}

	private renderContent(container: HTMLElement): void {
		const menuItems: MenuItem[] = [
			{
				name: this.plugin.settings.panelInboxName || "Inbox",
				icon: "inbox",
				folderName: this.plugin.settings.inboxLocation || "Inbox",
				dashboardPath: this.plugin.settings.panelInboxDashboard,
				filterTags: this.plugin.settings.panelInboxFilterTags
			},
			{
				name: this.plugin.settings.panelZettelsName || "Zettels",
				icon: "file-text",
				folderName: this.plugin.settings.zettelsLocation || "Zettels",
				dashboardPath: this.plugin.settings.panelZettelsDashboard,
				filterTags: this.plugin.settings.panelZettelsFilterTags
			},
			{
				name: this.plugin.settings.panelReferencesName || "References",
				icon: "book-open",
				folderName: this.plugin.settings.referenceLocation || "References",
				dashboardPath: this.plugin.settings.panelReferencesDashboard,
				filterTags: this.plugin.settings.panelReferencesFilterTags
			},
		];

		menuItems.forEach((item) => {
			this.createMenuItem(container, item);
		});

		// Add Bookmarks section
		this.createBookmarksMenuItem(container);

		// Add Note Sequence section (if enabled)
		if (this.plugin.settings.panelShowNoteSequence) {
			this.createNoteSequenceMenuItem(container);
		}

		// Add Workspaces section (if enabled)
		if (this.plugin.settings.panelShowWorkspaces) {
			this.createWorkspacesMenuItem(container);
		}
	}

	private createBookmarksMenuItem(container: HTMLElement): void {
		const itemEl = container.createDiv({ cls: "zk-menu-item" });
		const bookmarksName = this.plugin.settings.panelBookmarksName || "Bookmarks";

		// Header with icon and name
		const headerEl = itemEl.createDiv({ cls: "zk-menu-header" });

		// Collapse icon
		const collapseIconEl = headerEl.createDiv({ cls: "zk-collapse-icon" });
		const isCollapsed = this.collapsedSections.has(bookmarksName);
		setIcon(collapseIconEl, isCollapsed ? "chevron-right" : "chevron-down");

		// Item icon
		const iconEl = headerEl.createDiv({ cls: "zk-menu-icon" });
		setIcon(iconEl, "bookmark");

		// Item name
		headerEl.createDiv({
			cls: "zk-menu-name",
			text: bookmarksName
		});

		// Content area (collapsible)
		const contentEl = itemEl.createDiv({ cls: "zk-menu-content" });
		if (isCollapsed) {
			contentEl.style.display = "none";
		}

		// Add click handler to header (only toggle collapse for bookmarks)
		headerEl.addEventListener("click", async (e) => {
			e.stopPropagation();

			const isCurrentlyCollapsed = this.collapsedSections.has(bookmarksName);

			if (isCurrentlyCollapsed) {
				this.collapsedSections.delete(bookmarksName);
				contentEl.style.display = "block";
				setIcon(collapseIconEl, "chevron-down");
			} else {
				this.collapsedSections.add(bookmarksName);
				contentEl.style.display = "none";
				setIcon(collapseIconEl, "chevron-right");
			}
		});

		// Display bookmarks
		this.displayBookmarks(contentEl);
	}

	private displayBookmarks(container: HTMLElement): void {
		const bookmarks = this.plugin.settings.panelBookmarks;

		if (bookmarks.length === 0) {
			container.createDiv({
				cls: "zk-no-files",
				text: "No bookmarks yet"
			});
			return;
		}

		bookmarks.forEach((bookmark) => {
			const bookmarkContainer = container.createDiv({
				cls: "zk-bookmark-item"
			});

			// Icon based on type
			const iconEl = bookmarkContainer.createDiv({
				cls: "zk-bookmark-icon"
			});

			let iconName = "file";
			switch (bookmark.type) {
				case "file":
					iconName = "file-text";
					break;
				case "search":
					iconName = "search";
					break;
				case "graph":
					iconName = "git-branch-plus";
					break;
				case "folder":
					iconName = "folder";
					break;
			}
			setIcon(iconEl, iconName);

			// Title
			const titleEl = bookmarkContainer.createDiv({
				text: bookmark.title
			});

			bookmarkContainer.addEventListener("click", async () => {
				await this.handleBookmarkClick(bookmark);
			});
		});
	}

	private async handleBookmarkClick(bookmark: {
		type: "file" | "search" | "graph" | "folder";
		path?: string;
		title: string;
		query?: string;
	}): Promise<void> {
		switch (bookmark.type) {
			case "file":
				if (bookmark.path) {
					const file = this.app.vault.getAbstractFileByPath(bookmark.path);
					if (file instanceof TFile) {
						await this.app.workspace.getLeaf(false).openFile(file);
					}
				}
				break;

			case "search":
				if (bookmark.query) {
					// Open search view with the query
					const searchLeaf = this.app.workspace.getLeavesOfType("search")[0];
					if (searchLeaf) {
						this.app.workspace.revealLeaf(searchLeaf);
						// @ts-ignore - accessing internal API
						searchLeaf.view.setQuery(bookmark.query);
					}
				}
				break;

			case "graph":
				// Open graph view
				this.app.workspace.getLeaf(false).setViewState({
					type: "graph",
					active: true,
				});
				break;

			case "folder":
				if (bookmark.path) {
					const folder = this.app.vault.getAbstractFileByPath(bookmark.path);
					if (folder instanceof TFolder) {
						// Reveal folder in file explorer
						// @ts-ignore - accessing internal API
						this.app.workspace.getLeavesOfType("file-explorer")[0]?.view.revealInFolder(folder);
					}
				}
				break;
		}
	}

	private createMenuItem(container: HTMLElement, item: MenuItem): void {
		const itemEl = container.createDiv({ cls: "zk-menu-item" });

		// Header with icon and name
		const headerEl = itemEl.createDiv({ cls: "zk-menu-header" });

		// Collapse icon (only show if file lists are enabled)
		const collapseIconEl = headerEl.createDiv({ cls: "zk-collapse-icon" });
		if (this.plugin.settings.panelShowFileLists) {
			const isCollapsed = this.collapsedSections.has(item.name);
			setIcon(collapseIconEl, isCollapsed ? "chevron-right" : "chevron-down");
		}

		// Item icon
		const iconEl = headerEl.createDiv({ cls: "zk-menu-icon" });
		setIcon(iconEl, item.icon);

		// Item name
		headerEl.createDiv({
			cls: "zk-menu-name",
			text: item.name
		});

		// Content area (collapsible)
		const contentEl = itemEl.createDiv({ cls: "zk-menu-content" });
		if (this.plugin.settings.panelShowFileLists) {
			const isCollapsed = this.collapsedSections.has(item.name);
			if (isCollapsed) {
				contentEl.style.display = "none";
			}
		} else {
			// Hide content area when file lists are disabled
			contentEl.style.display = "none";
		}

		// Add click handler to header
		headerEl.addEventListener("click", async (e) => {
			e.stopPropagation();

			// If file lists are enabled and clicking on the collapse icon, toggle collapse
			if (this.plugin.settings.panelShowFileLists &&
			    (e.target === collapseIconEl || collapseIconEl.contains(e.target as Node))) {
				const isCurrentlyCollapsed = this.collapsedSections.has(item.name);

				if (isCurrentlyCollapsed) {
					this.collapsedSections.delete(item.name);
					contentEl.style.display = "block";
					setIcon(collapseIconEl, "chevron-down");
				} else {
					this.collapsedSections.add(item.name);
					contentEl.style.display = "none";
					setIcon(collapseIconEl, "chevron-right");
				}
			} else if (!this.plugin.settings.panelShowFileLists ||
			           !(e.target === collapseIconEl || collapseIconEl.contains(e.target as Node))) {
				// Open the index file when not clicking collapse icon or when file lists are disabled
				await this.openIndexFile(item);
			}
		});

		// Display folder contents with filter tags (only if enabled)
		if (this.plugin.settings.panelShowFileLists) {
			this.displayFolderContents(contentEl, item);
		}
	}

	private async openIndexFile(item: MenuItem): Promise<void> {
		// Use dashboard path if specified, otherwise try default paths
		let filePath = item.dashboardPath;

		if (!filePath) {
			// Fallback to old logic
			const folderBasename = item.folderName.split('/').pop() || item.folderName;
			filePath = `${item.folderName}/${folderBasename}.md`;
		}

		const file = this.app.vault.getAbstractFileByPath(filePath);

		if (file instanceof TFile) {
			await this.app.workspace.getLeaf(false).openFile(file);
		} else {
			console.log("ZK Panel - Dashboard file not found:", filePath);
		}
	}

	private async displayFolderContents(container: HTMLElement, item: MenuItem): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(item.folderName);

		console.log("ZK Panel - Looking for folder:", item.folderName);

		if (!(folder instanceof TFolder)) {
			console.log("ZK Panel - Folder not found:", item.folderName);
			container.createDiv({
				cls: "zk-no-folder",
				text: "Folder not found"
			});
			return;
		}

		// Get the default folder note name for fallback exclusion
		const folderBasename = item.folderName.split('/').pop() || item.folderName;
		const excludeFileName = `${folderBasename}.md`;

		console.log("ZK Panel - Excluding file:", excludeFileName);

		// Get all files in folder (recursively)
		const files = this.getFilesInFolder(folder);

		console.log("ZK Panel - Files before filter:", files.map(f => f.basename));

		// Filter files by tags if specified (only if tags array is not empty)
		let filteredFiles = files;
		if (item.filterTags && item.filterTags.length > 0) {
			filteredFiles = await this.filterFilesByTags(files, item.filterTags);
		}
		// If no tags specified, show all files

		// Exclude the dashboard file if it exists
		if (item.dashboardPath) {
			const dashboardFileName = item.dashboardPath.split('/').pop() || '';
			filteredFiles = filteredFiles.filter(file => file.name !== dashboardFileName);
		} else {
			// Fallback: exclude the folder note
			filteredFiles = filteredFiles.filter(file => file.name !== excludeFileName);
		}

		console.log("ZK Panel - Files after exclusion:", filteredFiles.map(f => f.basename));

		if (filteredFiles.length === 0) {
			container.createDiv({
				cls: "zk-no-files",
				text: "No files found"
			});
			return;
		}

		// Display files using Obsidian's tree item styling
		filteredFiles.forEach(file => {
			const displayName = this.cleanFileName(file.basename);

			// Create tree item structure like file explorer
			const treeItem = container.createDiv({
				cls: "tree-item nav-file"
			});

			const treeItemSelf = treeItem.createDiv({
				cls: "tree-item-self nav-file-title"
			});

			// Add file icon (conditionally based on settings)
			if (this.plugin.settings.panelShowFileIcons) {
				const treeItemIcon = treeItemSelf.createDiv({
					cls: "tree-item-icon nav-file-title-icon"
				});
				setIcon(treeItemIcon, "file");
			}

			// Add file name
			const treeItemInner = treeItemSelf.createDiv({
				cls: "tree-item-inner nav-file-title-content",
				text: displayName
			});

			treeItemSelf.addEventListener("click", async () => {
				await this.app.workspace.getLeaf(false).openFile(file);
			});
		});
	}

	private cleanFileName(filename: string): string {
		// Remove emoji prefix (any emoji at the start followed by space)
		// This regex matches emoji characters and removes them if at the start
		let cleaned = filename.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+\s*/gu, '');

		// Also remove common emoji patterns like "📝 " or similar
		cleaned = cleaned.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');

		return cleaned;
	}

	private getFilesInFolder(folder: TFolder): TFile[] {
		const files: TFile[] = [];

		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === "md") {
				files.push(child);
			} else if (child instanceof TFolder) {
				files.push(...this.getFilesInFolder(child));
			}
		}

		return files;
	}

	private async filterFilesByTags(files: TFile[], tags: string[]): Promise<TFile[]> {
		const filteredFiles: TFile[] = [];
		const matchMode = this.plugin.settings.panelTagMatchMode;

		console.log("ZK Panel - Filter tags:", tags);
		console.log("ZK Panel - Match mode:", matchMode);
		console.log("ZK Panel - Total files to filter:", files.length);

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache) {
				console.log("ZK Panel - No cache for:", file.path);
				continue;
			}

			const fileTags = getAllTags(cache);
			console.log("ZK Panel - File:", file.basename, "Tags:", fileTags);

			if (!fileTags) continue;

			let matches = false;

			if (matchMode === "all") {
				// ALL tags must match (AND)
				matches = tags.every(tag => {
					const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
					return fileTags.includes(normalizedTag);
				});
			} else {
				// ANY tag matches (OR) - default
				matches = tags.some(tag => {
					const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
					return fileTags.includes(normalizedTag);
				});
			}

			if (matches) {
				console.log("ZK Panel - Match found! File:", file.basename);
				filteredFiles.push(file);
			}
		}

		console.log("ZK Panel - Filtered files count:", filteredFiles.length);
		return filteredFiles;
	}

	private createNoteSequenceMenuItem(container: HTMLElement): void {
		const itemEl = container.createDiv({ cls: "zk-menu-item" });
		const sequenceName = this.plugin.settings.panelNoteSequenceName || "Note Sequence";

		// Header with icon and name
		const headerEl = itemEl.createDiv({ cls: "zk-menu-header" });

		// No collapse icon for this item - it opens a view
		headerEl.createDiv({ cls: "zk-collapse-icon" });

		// Item icon
		const iconEl = headerEl.createDiv({ cls: "zk-menu-icon" });
		setIcon(iconEl, "list-ordered");

		// Item name
		headerEl.createDiv({
			cls: "zk-menu-name",
			text: sequenceName
		});

		// Add click handler to open Note Sequences view
		headerEl.addEventListener("click", async () => {
			await this.openNoteSequencesView();
		});
	}

	private async openNoteSequencesView(): Promise<void> {
		const { workspace } = this.app;

		// Check if view already exists
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_NOTE_SEQUENCES)[0];

		if (!leaf) {
			// Create new leaf in main area
			const newLeaf = workspace.getLeaf(true);
			if (newLeaf) {
				await newLeaf.setViewState({
					type: VIEW_TYPE_NOTE_SEQUENCES,
					active: true,
				});
				leaf = newLeaf;
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	private createWorkspacesMenuItem(container: HTMLElement): void {
		const itemEl = container.createDiv({ cls: "zk-menu-item" });
		const workspacesName = this.plugin.settings.panelWorkspacesName || "Workspaces";

		// Header with icon and name
		const headerEl = itemEl.createDiv({ cls: "zk-menu-header" });

		// No collapse icon for this item
		headerEl.createDiv({ cls: "zk-collapse-icon" });

		// Item icon
		const iconEl = headerEl.createDiv({ cls: "zk-menu-icon" });
		setIcon(iconEl, "layout-dashboard");

		// Item name
		headerEl.createDiv({
			cls: "zk-menu-name",
			text: workspacesName
		});

		// Add click handler (disabled for now)
		headerEl.addEventListener("click", async () => {
			console.log("Workspaces clicked (disabled)");
		});

		// Add disabled styling
		itemEl.addClass("zk-menu-item-disabled");
	}

	async onClose(): Promise<void> {
		// Clear any pending refresh timeout
		if (this.refreshTimeout) {
			clearTimeout(this.refreshTimeout);
			this.refreshTimeout = null;
		}
	}
}
