import fetch from 'node-fetch';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

const Subnamespace = t.type(
	{
		tag: t.literal('Subnamespace'),
		contents: t.type({
			namespaceHash: t.string,
			namespaceName: t.string,
			namespaceSize: t.number,
		}),
	},
	'Subnamespace'
);

const TermObject = t.type(
	{
		tag: t.literal('TermObject'),
		contents: t.type({
			termHash: t.string,
			termName: t.string,
			termTag: t.union([t.string, t.null]),
		}),
	},
	'TermObject'
);

const TypeObject = t.type(
	{
		tag: t.literal('TypeObject'),
		contents: t.type({
			typeHash: t.string,
			typeName: t.string,
			typeTag: t.string,
		}),
	},
	'TypeObject'
);

const PatchObject = t.type(
	{
		tag: t.literal('PatchObject'),
		contents: t.type({
			patchName: t.string,
		}),
	},
	'PatchObject'
);

const NamespaceChild = t.union(
	[Subnamespace, TermObject, TypeObject, PatchObject],
	'NamespaceChild'
);
export type TNamespaceChild = t.TypeOf<typeof NamespaceChild>;

const NamespaceListing = t.type(
	{
		namespaceListingFQN: t.string,
		namespaceListingHash: t.string,
		namespaceListingChildren: t.array(NamespaceChild),
	},
	'NamespaceListing'
);
export type TNamespaceListing = t.TypeOf<typeof NamespaceListing>;

const TermToken = t.type(
	{
		segment: t.string,
	},
	'TermToken'
);

const TermDefinition = t.type(
	{
		signature: t.array(TermToken),
		termDefinition: t.type({
			contents: t.array(TermToken),
		}),
	},
	'TermDefinition'
);

const TypeDefinition = t.type(
	{
		typeDefinition: t.type({
			contents: t.array(TermToken),
		}),
	},
	'TypeDefinition'
);

const GetDefinitionResponse = t.type(
	{
		termDefinitions: t.record(t.string, TermDefinition),
		typeDefinitions: t.record(t.string, TypeDefinition),
	},
	'GetDefinitionResponse'
);
type TGetDefinitionResponse = t.TypeOf<typeof GetDefinitionResponse>;

function unwrapResult<T>(result: t.Validation<T>): T {
	if (isLeft(result)) {
		throw new Error(PathReporter.report(result).join('\n'));
	}

	return result.right;
}

interface GetDefinitionParams {
	names: string;
}
export interface ApiClient {
	list: (namespace: string) => Promise<TNamespaceListing>;
	getDefinition: (
		params: GetDefinitionParams
	) => Promise<TGetDefinitionResponse>;
}

export function createApiClient(apiRoot: string): ApiClient {
	return {
		list: async (namespace) => {
			const queryParams = `?namespace=${namespace}`;
			const res = await fetch(`${apiRoot}/list${queryParams}`);
			return unwrapResult(NamespaceListing.decode(await res.json()));
		},
		getDefinition: async ({ names }) => {
			const queryParams = `?names=${encodeURIComponent(names)}`;
			const res = await fetch(`${apiRoot}/getDefinition${queryParams}`);
			return unwrapResult(GetDefinitionResponse.decode(await res.json()));
		},
	};
}
