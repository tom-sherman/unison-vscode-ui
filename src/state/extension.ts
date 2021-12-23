import * as vscode from 'vscode';
import { Actor, assign, createMachine } from 'xstate';
import { createApiClient } from '../api';
import { CodebaseProvider } from '../tree-view';
import { assertEventType } from './util';

export interface Context {
	subscriptions: {
		dispose(): any;
	}[];
	codebaseProvider: CodebaseProvider | null;
}

export type Event =
	| {
			type:
				| 'done.invoke.getBaseUrlFromWorkspaceConfig'
				| 'done.invoke.getBaseUrlFromUser';
			data: {
				baseUrl: string | undefined;
			};
	  }
	| {
			type: 'READY';
			baseUrl: string;
	  }
	| {
			type: 'REFRESH';
	  }
	| {
			type: 'ACTIVATE';
	  }
	| {
			type: 'CONFIGURE';
	  };

interface MachineDependencies {
	workspaceConfig: vscode.WorkspaceConfiguration;
}

export const createExtensionMachine = ({
	workspaceConfig,
}: MachineDependencies) =>
	createMachine<Context, Event>(
		{
			id: 'extension',
			initial: 'idle',
			context: {
				subscriptions: [],
				codebaseProvider: null,
			},
			states: {
				idle: {
					on: {
						ACTIVATE: 'checking_saved_url',
					},
				},
				checking_saved_url: {
					invoke: {
						src: 'getBaseUrlFromWorkspaceConfig',
						onDone: [
							{
								target: 'setting_up',
								cond: (_, event) => Boolean(event.data.baseUrl),
							},
							{
								target: 'awaiting_configuration',
							},
						],
					},
				},
				awaiting_configuration: {
					on: {
						REFRESH: {
							target: 'awaiting_configuration',
							actions: 'showNotConfiguredError',
						},
						CONFIGURE: 'configuring',
					},
				},
				configuring: {
					invoke: {
						src: 'getBaseUrlFromUser',
						onDone: [
							{
								target: 'setting_up',
								cond: (_, event) => Boolean(event.data.baseUrl),
							},
							{
								target: 'awaiting_configuration',
							},
						],
					},
				},
				setting_up: {
					entry: 'setup',
					invoke: {
						src: 'persistBaseUrl',
						onDone: 'configured',
					},
				},
				configured: {
					on: {
						REFRESH: {
							target: 'configured',
							actions: 'refresh',
						},
						CONFIGURE: 'reconfiguring',
					},
				},
				reconfiguring: {
					invoke: {
						src: 'getBaseUrlFromUser',
						onDone: [
							{
								target: 'setting_up',
								cond: (_, event) => Boolean(event.data.baseUrl),
							},
							{
								target: 'configured',
							},
						],
					},
				},
			},
		},
		{
			services: {
				getBaseUrlFromWorkspaceConfig: async () => ({
					baseUrl: workspaceConfig.get<string>(BASE_URL_CONFIG_NAME),
				}),
				getBaseUrlFromUser: async () => {
					const unisonUrl = await vscode.window.showInputBox({
						title: 'Enter UCM URL',
					});

					if (unisonUrl === undefined) {
						vscode.window.showErrorMessage('Please enter a UCM URL.');
						return { baseUrl: undefined };
					}

					return { baseUrl: unisonUrl };
				},
				persistBaseUrl: async (_, event) => {
					assertEventType(event, [
						'done.invoke.getBaseUrlFromWorkspaceConfig',
						'done.invoke.getBaseUrlFromUser',
					]);

					await workspaceConfig.update(
						BASE_URL_CONFIG_NAME,
						event.data.baseUrl
					);
				},
			},
			actions: {
				setup: assign((ctx, event) => {
					assertEventType(event, [
						'done.invoke.getBaseUrlFromWorkspaceConfig',
						'done.invoke.getBaseUrlFromUser',
					]);

					if (!event.data.baseUrl) {
						return {};
					}

					const apiClient = createApiClient(event.data.baseUrl);

					const codebaseProvider = new CodebaseProvider(apiClient);

					const treeView = vscode.window.createTreeView('codebase', {
						treeDataProvider: codebaseProvider,
					});

					return {
						subscriptions: [...ctx.subscriptions, treeView],
						codebaseProvider,
					};
				}),
				refresh: (ctx) => {
					if (!ctx.codebaseProvider) {
						throw new Error('Expected codebaseProvider in context');
					}

					ctx.codebaseProvider.refresh();
				},
				showNotConfiguredError: () =>
					vscode.window.showErrorMessage('Codebase not yet configured.'),
			},
		}
	);

const BASE_URL_CONFIG_NAME = 'unison-ui.apiBaseUrl';
