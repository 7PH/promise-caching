
export interface CachedRecord<T> {
    expired: boolean;
    promise: Promise<T>;
    nextPromise?: Promise<T>;
}
