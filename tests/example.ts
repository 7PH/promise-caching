import {PromiseCaching} from "../src";


async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve.bind(this), ms));
}

// high cost function
async function getRandom() {
    await sleep(1000);
    return Math.random();
}

// cached function
async function getRandomCached(key: any) {
    return cache.get(key, 2000, getRandom);
}
// your cache instance
let cache: PromiseCaching = new PromiseCaching({ returnExpired: true });


(async () => {

    // cache did not exist. this call takes 1 second
    await getRandomCached('random');

    // starting from now, cache will be valid 2 seconds

    // this call will be instantaneous
    await getRandomCached('random');

    // we wait for the cache to expire
    await sleep(2000);

    // the cache has expired now
    await getRandomCached('random');

    // if 'returnExpired' is true,
    //      the value will be instantaneously returned and the cache
    //      will be generated in the background

    // if 'returnExpired' is false,
    //      the promise will be resolved when the new generation is done

    // you can use whatever key you want for caching
    let key: any = {a: 1};

    await getRandomCached(key);
    await getRandomCached(key);
})();