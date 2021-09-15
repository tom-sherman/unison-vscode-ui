import * as vscode from 'vscode';
import * as API from './api';

export class CodebaseProvider
	implements vscode.TreeDataProvider<vscode.TreeItem>
{
	constructor(private readonly apiClient: API.ApiClient) {}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(
		element?: CodebaseTreeviewChild
	): Promise<vscode.TreeItem[]> {
		const namespace = element ? `.${element?.namespaceListingFQN}` : '.';
		const listing = await this.apiClient.list(namespace);
		return listing.namespaceListingChildren.map((child) =>
			mapListingChildToTreeItem(child, listing)
		);
	}
}

const mapListingChildToTreeItem = (
	child: API.NamespaceChild,
	listing: API.NamespaceListing
): CodebaseTreeviewChild => {
	switch (child.tag) {
		case 'Subnamespace':
			return new CodebaseTreeviewChild(
				child.contents.namespaceName,
				child,
				`${listing.namespaceListingFQN}.${child.contents.namespaceName}`
			);

		case 'TermObject':
			return new CodebaseTreeviewChild(child.contents.termName, child);
	}
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
	}
}
