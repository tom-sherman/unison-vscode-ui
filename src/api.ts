import fetch from 'node-fetch';

export interface NamespaceListing {
	namespaceListingFQN: string;
	namespaceListingHash: string;
	namespaceListingChildren: NamespaceChild[];
}

export type NamespaceChild =
	| {
			tag: 'Subnamespace';
			contents: {
				namespaceHash: string;
				namespaceName: string;
				namespaceSize: number;
			};
	  }
	| {
			tag: 'TermObject';
			contents: {
				termHash: string;
				termName: string;
			};
	  };

const apiRoot = 'http://127.0.0.1:53404/vVr1STfv3IBpl7VmVC6JwCzKz60CYBbC/api';

export function list(namespace: string): Promise<NamespaceListing> {
	const queryParams = `?namespace=${namespace}`;
	return fetch(`${apiRoot}/list${queryParams}`).then((res) => {
		console.log(namespace);
		return res.json() as Promise<NamespaceListing>;
	});
}
