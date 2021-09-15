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

export interface ApiClient {
	list: (namespace: string) => Promise<NamespaceListing>;
}

export function createApiClient(apiRoot: string): ApiClient {
	return {
		list: (namespace: string): Promise<NamespaceListing> => {
			const queryParams = `?namespace=${namespace}`;
			return fetch(`${apiRoot}/list${queryParams}`).then((res) => {
				console.log(namespace);
				return res.json() as Promise<NamespaceListing>;
			});
		},
	};
}
