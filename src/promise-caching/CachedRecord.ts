import Timer = NodeJS.Timer;

export interface CachedRecord<T> {

    key: string;

    expired: boolean;

    expire?: Timer;

    promise: Promise<T>;

    nextPromise?: Promise<T>;
}
