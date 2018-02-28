
export interface CachedObject {
    state: 'generating' | 'generated';
    created: number;
    unresolved: ((d: any) => any)[];
    data: any;
}

export class PromiseCaching {

    private static readonly cached: Map<any, CachedObject> = new Map();

    private static readCache(key: any): CachedObject | undefined {
        return PromiseCaching.cached.get(key);
    }

    private static regenCache<T>(key: any, expire: number, generator: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // init new cache that will be generated
            const cache: CachedObject = {
                state: 'generating',
                created: 0,
                unresolved: [],
                data: null
            };
            PromiseCaching.cached.set(key, cache);

            // generated it
            generator()
                .then((data: T) => {

                    // updates cache data
                    cache.state = 'generated';
                    cache.created = Date.now();
                    cache.data = data;

                    // resolve pending promises
                    for (let i = 0; i < cache.unresolved.length; ++ i)
                        cache.unresolved[i](data);

                    cache.unresolved = [];

                    // trigger the cache deletion
                    setTimeout(() => {
                        PromiseCaching.cached.delete(key);
                    }, expire);

                    // resolves this Promise
                    resolve(data);

                }).catch((d: any) => {
                PromiseCaching.cached.delete(key);

                reject(d);
            });
        });
    }

    public static get<T>(key: any, expire?: number, generator?: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let cache: CachedObject | undefined = PromiseCaching.readCache(key);

            if (cache == null) {
                if (generator != null) {
                    // SHOULD and CAN generate cache
                    return PromiseCaching.regenCache(key, expire || -1, generator)
                        .then((data: T) => {
                            resolve(data);
                        }).catch((d: any) => {
                            reject(d);
                        });
                } else {
                    // SHOULD but CANNOT generate cache
                    return reject(new Error("Cache does not exists and generator was not provided"));
                }
            } else if (cache.state === 'generating') {
                cache.unresolved.push(resolve);
            } else {
                return resolve(cache.data);
            }
        });
    }
}