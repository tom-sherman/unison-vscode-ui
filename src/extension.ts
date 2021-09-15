// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createApiClient } from './api';
import { CodebaseProvider } from './tree-view';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let codebaseProvider: null | CodebaseProvider = null;

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

		const apiClient = createApiClient(unisonUrl);

		codebaseProvider = new CodebaseProvider(apiClient);

		const treeView = vscode.window.createTreeView('codebase', {
			treeDataProvider: codebaseProvider,
		});

		context.subscriptions.push(treeView);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
