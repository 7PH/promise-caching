# promise-caching <img src="https://api.travis-ci.com/7PH/promise-caching.svg?branch=master">

Asynchronous in-memory cache-system working with promises

Typical use-case: you have a function returning a promise with high computing cost.

## time chart

Here is a chart of what's happening when you set 'returnExpired' to false

![Time chart](/doc/time-chart.png?raw=true "Time chart")

When you set 'returnExpired' to true, retrieving an expired promise won't hang. Instead, it will return the expired promise and regenerate a new result in background.

## Usage

Here is an example of how you can use promise-caching.

```typescript
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
function getRandomCached(key: any) {
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
```
