import {CachedRecord} from "./CachedRecord";

export class PromiseCaching {

    private readonly cached: Map<any, CachedRecord> = new Map();

    private readCache(key: any): CachedRecord | undefined {
        return this.cached.get(key);
    }

    private regenCache<T>(key: any, expire: number, generator: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // init new cache that will be generated
            const cache: CachedRecord = {
                state: 'generating',
                created: 0,
                unresolved: [],
                data: null
            };
            this.cached.set(key, cache);

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
                        this.cached.delete(key);
                    }, expire);

                    // resolves this Promise
                    resolve(data);

                }).catch((e: any) => {
                    this.cached.delete(key);
                    reject(e);
                });
        });
    }

    public get<T>(key: any, expire?: number, generator?: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let cache: CachedRecord | undefined = this.readCache(key);

            if (cache == null) {
                if (generator != null) {
                    // SHOULD and CAN generate cache
                    return this.regenCache(key, expire || -1, generator)
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