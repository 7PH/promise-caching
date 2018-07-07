import {PromiseCaching} from "../src";


async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve.bind(this), ms));
}

// your cache object
let cache: PromiseCaching = new PromiseCaching({ returnExpired: true });

(async () => {

    // high cost function which take 1s to complete
    async function getRandom() {
        await sleep(1000);
        return Math.random();
    }

    // cache did not exist. this call takes 1 second
    await cache.get('random', 2000, () => getRandom());

    // starting from now, cache will be valid 2 seconds

    // this call will be instantaneous
    await cache.get('random', 2000, () => getRandom());

    // we wait for the cache to expire
    await sleep(2000);

    // the cache has expired now
    await cache.get('random', 2000, () => getRandom());

    // if 'returnExpired' is true,
    //      the value will be instantaneously returned and the cache
    //      will be generated in the background

    // if 'returnExpired' is false,
    //      the promise will be resolved when the new generation is done

})();