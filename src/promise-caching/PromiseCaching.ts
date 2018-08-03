import {CachedRecord} from "./CachedRecord";
import {CachingConfig} from "./CachingConfig";
import {IPromiseCaching} from "./IPromiseCaching";

export class PromiseCaching implements IPromiseCaching {

    private readonly cached: Map<any, CachedRecord<any>> = new Map();

    public readonly config: CachingConfig;

    constructor(config?: Partial<CachingConfig>) {
        if (typeof config === 'undefined')
            config = {};

        this.config = {
            returnExpired: typeof config.returnExpired !== 'undefined' ? config.returnExpired : true
        }
    }

    /**
     *
     * @param key
     * @returns {CachedRecord<T> | undefined}
     */
    private readCache<T>(key: any): CachedRecord<T> | undefined {

        return this.cached.get(key);
    }

    /**
     *
     * @param key
     */
    private expireCache<T>(key: any): void {

        let value: CachedRecord<T> | undefined = this.readCache<T>(key);

        if (this.config.returnExpired) {

            if (typeof value !== 'undefined')
                value.expired = true;
        } else {

            this.cached.delete(key);
        }
    }

    /**
     *
     * @param entry
     * @param expire
     */
    private triggerCacheExpire<T>(entry: CachedRecord<T>, expire: number): void {

        if (typeof entry.expire !== 'undefined')
            clearTimeout(entry.expire);

        entry.expire = setTimeout(() => this.expireCache<T>(entry.key), expire);
    }

    /**
     *
     * @param key
     * @param {number} expire
     * @param {() => Promise<T>} generator
     * @returns {Promise<T>}
     */
    private regenCache<T>(key: any, expire: number, generator: () => Promise<T>): Promise<T> {
        let entry: CachedRecord<T>;

        let promise: Promise<T> = new Promise<T>(async (resolve, reject) => {
            // generate it
            generator()
                .then((data: T) => {

                    // trigger the cache expiring
                    this.triggerCacheExpire(entry, expire);

                    if (typeof entry.nextPromise !== 'undefined') {

                        entry.promise = entry.nextPromise;

                        delete entry.nextPromise;
                    }

                    // resolves this Promise
                    resolve(data);

                }).catch((e: any) => {
                    this.cached.delete(key);
                    reject(e);
                });
        });

        let oldEntry: CachedRecord<T> | undefined = this.cached.get(key);

        if (typeof oldEntry === 'undefined') {
            // init new cache that will be generated
            const cache: CachedRecord<T> = {
                key: key,
                expired: false,
                promise: promise
            };
            this.cached.set(key, cache);

        } else {

            oldEntry.nextPromise = promise;
        }

        entry = this.cached.get(key) as CachedRecord<T>;

        return promise;
    }

    /**
     *
     * @param key
     * @param {number} expire
     * @param {() => Promise<T>} generator
     * @returns {Promise<T>}
     */
    public get<T>(key: any, expire?: number, generator?: () => Promise<T>): Promise<T> {
        let cache: CachedRecord<T> | undefined = this.readCache<T>(key);

        if (cache == null) {
            if (generator != null) {
                // SHOULD and CAN generate cache
                return this.regenCache(key, expire || -1, generator);
            } else {
                // SHOULD but CANNOT generate cache
                return Promise.reject(new Error("Cache does not exists and generator was not provided"));
            }
        } else {
            if (cache.expired && generator != null && typeof cache.nextPromise === 'undefined') {
                // SHOULD and CAN generate cache
                this.regenCache(key, expire || -1, generator);
            }
            return cache.promise;
        }
    }

    /**
     * @TODO test
     * @param key
     * @param expire
     * @param value
     */
    public store<T>(key: any, expire: number, value: T): void {

        let record: CachedRecord<T> | undefined = this.cached.get(key);

        if (typeof record === 'undefined') {

            // record did not exist
            record = {key: key, expired: false, promise: Promise.resolve<T>(value)};
            this.cached.set(key, record);

        } else {

            // update record
            record.promise = Promise.resolve<T>(value);
        }

        this.triggerCacheExpire(record, expire);
    }
}