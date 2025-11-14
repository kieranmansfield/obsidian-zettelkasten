import { App, Modal, TFile, Notice } from "obsidian";

export interface NavigationOption {
	direction: string;
	label: string;
	file: TFile | null;
	disabled: boolean;
}

export class NavigatorModal extends Modal {
	private options: NavigationOption[];
	private onNavigate: (file: TFile) => void;
	private currentTitle: string;

	constructor(
		app: App,
		currentTitle: string,
		options: NavigationOption[],
		onNavigate: (file: TFile) => void,
	) {
		super(app);
		this.currentTitle = currentTitle;
		this.options = options;
		this.onNavigate = onNavigate;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("zettelkasten-navigator");

		// Title
		const titleEl = contentEl.createEl("h3", {
			text: this.currentTitle,
			cls: "navigator-title",
		});

		// Navigation grid
		const gridEl = contentEl.createDiv({ cls: "navigator-grid" });

		// Create navigation buttons in a cross pattern
		// Row 1: Up
		const row1 = gridEl.createDiv({ cls: "navigator-row" });
		row1.createDiv({ cls: "navigator-spacer" });
		this.createNavigationButton(row1, "up", "↑ Up");
		row1.createDiv({ cls: "navigator-spacer" });

		// Row 2: Left, Center, Right
		const row2 = gridEl.createDiv({ cls: "navigator-row" });
		this.createNavigationButton(row2, "left", "← Left");
		row2.createDiv({ cls: "navigator-center" }).setText("Current");
		this.createNavigationButton(row2, "right", "→ Right");

		// Row 3: Down
		const row3 = gridEl.createDiv({ cls: "navigator-row" });
		row3.createDiv({ cls: "navigator-spacer" });
		this.createNavigationButton(row3, "down", "↓ Down");
		row3.createDiv({ cls: "navigator-spacer" });

		// Add styles
		this.addStyles();
	}

	private createNavigationButton(
		parent: HTMLElement,
		direction: string,
		label: string,
	) {
		const option = this.options.find((o) => o.direction === direction);
		if (!option) return;

		const button = parent.createEl("button", {
			text: label,
			cls: "navigator-button",
		});

		if (option.disabled || !option.file) {
			button.addClass("navigator-button-disabled");
			button.disabled = true;
			if (option.label) {
				button.setAttribute("title", option.label);
			}
		} else {
			button.setAttribute("title", option.label);
			button.addEventListener("click", () => {
				if (option.file) {
					this.onNavigate(option.file);
					this.close();
				}
			});
		}
	}

	private addStyles() {
		// Add inline styles for the navigator
		const styleEl = document.createElement("style");
		styleEl.textContent = `
			.zettelkasten-navigator {
				padding: 20px;
			}
			.navigator-title {
				text-align: center;
				margin-bottom: 20px;
				font-weight: 600;
			}
			.navigator-grid {
				display: flex;
				flex-direction: column;
				gap: 10px;
				max-width: 400px;
				margin: 0 auto;
			}
			.navigator-row {
				display: flex;
				gap: 10px;
				justify-content: center;
			}
			.navigator-button {
				min-width: 100px;
				padding: 10px 20px;
				font-size: 14px;
				cursor: pointer;
				border-radius: 4px;
				border: 1px solid var(--background-modifier-border);
				background: var(--interactive-normal);
				color: var(--text-normal);
			}
			.navigator-button:hover:not(.navigator-button-disabled) {
				background: var(--interactive-hover);
			}
			.navigator-button-disabled {
				opacity: 0.3;
				cursor: not-allowed;
			}
			.navigator-center {
				min-width: 100px;
				padding: 10px 20px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: 500;
				color: var(--text-muted);
			}
			.navigator-spacer {
				min-width: 100px;
			}
		`;
		this.contentEl.appendChild(styleEl);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
