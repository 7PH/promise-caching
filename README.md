# Promise-Caching

Let's suppose you have a high cost function that returns a promise. This library allows you to:

- cache its result for a specified amount of time
- decide whether you want to return the expired cache or force regeneration when it expires

## Time chart

Here is a chart of what's happening when you set 'returnExpired' to false

![Time chart](/doc/time-chart.png?raw=true "Time chart")

When you set 'returnExpired' to true, retrieving an expired promise won't hang. Instead, it will return the expired promise and regenerate a new result in background.

## Usage

Here is a TypeScript example of how you can use PromseCaching.

```typescript
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

    // you can use whatever key you want for caching
    let key: any = {a: 1};

    await cache.get(key, 2000, () => getRandom());
    await cache.get(key, 2000, () => getRandom());
})();
```