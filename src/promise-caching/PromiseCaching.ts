import {CachedRecord} from "./CachedRecord";

export class PromiseCaching {

    private readonly cached: Map<any, CachedRecord<any>> = new Map();

    private readCache<T>(key: any): CachedRecord<T> | undefined {
        return this.cached.get(key);
    }

    /**
     * Regenerates cache
     * @param key
     * @param {number} expire
     * @param {() => Promise<T>} generator
     * @returns {Promise<T>}
     */
    private regenCache<T>(key: any, expire: number, generator: () => Promise<T>): Promise<T> {
        let promise: Promise<T> = new Promise<T>((resolve, reject) => {
            // generate it
            generator()
                .then((data: T) => {

                    // updates cache data
                    cache.state = 'generated';
                    cache.created = Date.now();

                    // trigger the cache deletion
                    setTimeout(() => {
                        this.cached.delete(key);
                    }, expire);

                    // resolves this Promise
                    resolve(data);

                }).catch((e: any) => {
                    this.cached.delete(key);
                    reject(e);
                });
        });

        // init new cache that will be generated
        const cache: CachedRecord<T> = {
            state: 'generating',
            created: 0,
            promise: promise
        };
        this.cached.set(key, cache);

        return promise;
    }

    /**
     * Get a value from the cache. Generate it if expired or non existent
     * @param key Key
     * @param {number} expire Expire time in milliseconds
     * @param {() => Promise<T>} generator Generator function
     * @returns {Promise<T>} Value
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
            return cache.promise;
        }
    }
}