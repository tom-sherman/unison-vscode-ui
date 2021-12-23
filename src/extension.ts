// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { interpret, Interpreter } from 'xstate';
import { createApiClient } from './api';
import { Context, createExtensionMachine, Event } from './state/extension';
import { CodebaseProvider } from './tree-view';

let service: null | Interpreter<
	Context,
	any,
	Event,
	{
		value: any;
		context: Context;
	}
> = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const machine = createExtensionMachine({
		context,
		workspaceConfig: vscode.workspace.getConfiguration(),
	});

	service = interpret(machine)
		.onTransition((state) => {
			console.log('Entere state: ', state.value);

			// Doing a mutable dance here because context.subscriptions is readonly and I'm not sure if re-assignment would break something
			context.subscriptions.splice(0, context.subscriptions.length);
			state.context.subscriptions.forEach((subscription) => {
				context.subscriptions.push(subscription);
			});
		})
		.start();

	service.send('ACTIVATE');

	context.subscriptions.push(
		vscode.commands.registerCommand('unison-ui.configureCodebase', () =>
			service!.send('CONFIGURE')
		)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('unison-ui.refreshCodebase', () =>
			service!.send('REFRESH')
		)
	);
}

// this method is called when your extension is deactivated
export function deactivate() {
	service?.stop();
}
