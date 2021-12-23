// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createApiClient } from './api';
import { CodebaseProvider } from './tree-view';

const BASE_URL_CONFIG_NAME = 'unison-ui.apiBaseUrl';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let codebaseProvider: null | CodebaseProvider = null;
	function setupCodebaseProvider(unisonUrl: string) {
		const apiClient = createApiClient(unisonUrl);

		codebaseProvider = new CodebaseProvider(apiClient);

		const treeView = vscode.window.createTreeView('codebase', {
			treeDataProvider: codebaseProvider,
		});

		context.subscriptions.push(treeView);
	}

	const configuration = vscode.workspace.getConfiguration();
	const savedUnisonUrl = configuration.get<string>(BASE_URL_CONFIG_NAME);

	if (savedUnisonUrl) {
		setupCodebaseProvider(savedUnisonUrl);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'unison-ui.configureCodebase',
			configureCodebaseCommand
		)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'unison-ui.refreshCodebase',
			refreshCodbeaseCommand
		)
	);

	async function refreshCodbeaseCommand() {
		if (codebaseProvider) {
			codebaseProvider.refresh();
		} else {
			vscode.window.showErrorMessage('Codebase not yet configured.');
		}
	}

	async function configureCodebaseCommand() {
		const unisonUrl = await vscode.window.showInputBox({
			title: 'Enter UCM URL',
		});

		if (unisonUrl === undefined) {
			vscode.window.showErrorMessage('Please enter a UCM URL.');
			return;
		}

		setupCodebaseProvider(unisonUrl);
		await configuration.update(BASE_URL_CONFIG_NAME, unisonUrl);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
