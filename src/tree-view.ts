import * as vscode from 'vscode';
import * as API from './api';

export class CodebaseProvider
	implements vscode.TreeDataProvider<vscode.TreeItem>
{
	_onDidChangeTreeData: vscode.EventEmitter<
		CodebaseTreeviewChild | undefined | null | void
	> = new vscode.EventEmitter<
		CodebaseTreeviewChild | undefined | null | void
	>();
	onDidChangeTreeData: vscode.Event<
		CodebaseTreeviewChild | undefined | null | void
	> = this._onDidChangeTreeData.event;

	constructor(private readonly apiClient: API.ApiClient) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(
		element?: CodebaseTreeviewChild
	): Promise<vscode.TreeItem[]> {
		const namespace = element ? `.${element?.namespaceListingFQN}` : '.';
		const listing = await this.apiClient.list(namespace);
		return listing.namespaceListingChildren
			.map((child) => mapListingChildToTreeItem(child, listing))
			.filter((child): child is CodebaseTreeviewChild => Boolean(child));
	}
}

const mapListingChildToTreeItem = (
	child: API.NamespaceChild,
	listing: API.NamespaceListing
): CodebaseTreeviewChild | null => {
	switch (child.tag) {
		case 'Subnamespace':
			return new CodebaseTreeviewChild(
				child.contents.namespaceName,
				child,
				`${listing.namespaceListingFQN}.${child.contents.namespaceName}`
			);

		case 'TermObject':
			return new CodebaseTreeviewChild(child.contents.termName, child);

		case 'TypeObject':
			return new CodebaseTreeviewChild(child.contents.typeName, child);

		case 'PatchObject':
			return null;
	}

	// Only reachable if we forget a child type
	throw new Error('Unimplemented ' + (child as any).tag);
};

class CodebaseTreeviewChild extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly unisonChild: API.NamespaceChild,
		public readonly namespaceListingFQN?: string
	) {
		super(
			label,
			namespaceListingFQN
				? vscode.TreeItemCollapsibleState.Collapsed
				: vscode.TreeItemCollapsibleState.None
		);

		this.id = getNamespaceChildId(unisonChild);
	}
}

function getNamespaceChildId(child: API.NamespaceChild): string {
	switch (child.tag) {
		case 'Subnamespace':
			return child.contents.namespaceHash;

		case 'TermObject':
			return `${child.contents.termName}${child.contents.termHash}`;

		case 'TypeObject':
			return `${child.contents.typeName}${child.contents.typeHash}`;

		case 'PatchObject':
			throw new Error('Id is not implemented for PatchObject');
	}
}
