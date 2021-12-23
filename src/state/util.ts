import { EventObject } from 'xstate';

export function assertEventType<
	TEvent extends EventObject,
	TType extends TEvent['type']
>(
	event: TEvent,
	type: TType
): asserts event is Extract<TEvent, { type: TType }>;
export function assertEventType<
	TEvent extends EventObject,
	TTypes extends readonly TEvent['type'][]
>(
	event: TEvent,
	type: TTypes
): asserts event is Extract<TEvent, { type: TTypes[number] }>;
export function assertEventType(
	event: EventObject,
	type: string | string[]
): void {
	if (typeof type === 'string' && event.type !== type) {
		throw new Error(
			`Expected event type "${type}", found type "${event.type}"`
		);
	}

	if (Array.isArray(type) && !type.includes(event.type)) {
		throw new Error(
			`Expected one of event type "${JSON.stringify(type)}", found type "${
				event.type
			}"`
		);
	}
}
