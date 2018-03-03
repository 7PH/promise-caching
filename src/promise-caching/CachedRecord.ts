
export interface CachedRecord<T> {
    state: 'generating' | 'generated';
    created: number;
    promise: Promise<T>;
}
