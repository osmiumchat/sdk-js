import { tangle } from '@osmiumchat/proto';
import { kClient } from './symbols.js';

type UpdateKey = Exclude<{
    [K in keyof tangle.client.updates.IUpdate]:
        NonNullable<tangle.client.updates.IUpdate[K]> extends object ? K : never
}[keyof tangle.client.updates.IUpdate], undefined>;

type UpdateValue<K extends UpdateKey> = NonNullable<tangle.client.updates.IUpdate[K]>;

type Extractor<K extends UpdateKey> =
    (value: UpdateValue<K>) => object | object[] | null | undefined;

const extractors = new Map<string, Array<(v: any) => object | object[] | null | undefined>>();

/**
 * Declare which object(s) to inject `kClient` onto when a given update key is dispatched.
 * Return the object directly, an array of them, or null/undefined to skip.
 *
 * @example
 *   registerInjection('messageCreated', (v) => v.message);
 */
export function registerInjection<K extends UpdateKey>(updateKey: K, extractor: Extractor<K>): void {
    const list = extractors.get(updateKey);
    if (list) {
        list.push(extractor);
    } else {
        extractors.set(updateKey, [extractor]);
    }
}

/** Attaches the client to any objects found in the update value for the given key, using registered extractors. */
export function attachClient(updateKey: string, updateValue: unknown, client: unknown): void {
    const list = extractors.get(updateKey);
    if (!list) return;
    for (const extract of list) {
        const result = extract(updateValue);
        if (!result) continue;
        if (Array.isArray(result)) {
            for (const obj of result) (obj as any)[kClient] = client;
        } else {
            (result as any)[kClient] = client;
        }
    }
}
