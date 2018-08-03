

export interface IPromiseCaching {

    get<T>(key: any, expire?: number, generator?: () => Promise<T>): Promise<T>;

    store<T>(key: any, expire: number, value: T): void;
}