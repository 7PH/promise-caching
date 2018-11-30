# promise-caching

<img src="https://api.travis-ci.com/7PH/promise-caching.svg?branch=master">


Asynchronous in-memory cache-system working with promises

Typical use-case: you have a function returning a promise with high computing cost.

## Execution chart

Here is an execution chart of what is happening when you set 'returnExpired' to false

```text
 [id] |-------------> time
  0   | ====>1
  1   |  ===>1
  2   |   ==>1
  3   |    =>1
  4   |     >1
  5   |      >1
  6   |       >1
  7   |        >1
  8   |         >1
  9   |          ====>2
 10   |           ===>2
 11   |            ==>2
 12   |             =>2
 13   |              >2
 14   |               >2
 15   |                >2
 16   |                 >2
```

When you set 'returnExpired' to true, retrieving an expired promise won't hang. Instead, it will return the expired promise and regenerate a new result in background.

```text
 [id] |-------------> time
  0   | ====>1
  1   |  ===>1
  2   |   ==>1
  3   |    =>1
  4   |     >1
  5   |      >1
  6   |       >1
  7   |        >1
  8   |         >1
  9   |          >1
 10   |           >1
 11   |            >1
 12   |             >1
 13   |              >1
 14   |               >2
 15   |                >2
 16   |                 >2
```

To build these execution charts, use 

```bash
RETURN_EXPIRED=false    npm run execution-chart
RETURN_EXPIRED=true     npm run execution-chart
```

## Usage

Here is an example of how you can use promise-caching.

```typescript
import {PromiseCaching} from "../src";

// asynchronous sleep function
async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve.bind(this), ms));
}

// the high cost function
async function getRandom() {
    await sleep(1000);
    return Math.random();
}

// your cache instance
let cache: PromiseCaching = new PromiseCaching({ returnExpired: true });


(async () => {

    // cache did not exist. this call takes 1 second
    await cache.get('random', 2000, getRandom);

    // starting from now, cache will be valid 2 seconds

    // this call will be instantaneous
    await cache.get('random', 2000, getRandom);

    // we wait for the cache to expire
    await sleep(2000);

    // the cache has expired now
    await cache.get('random', 2000, getRandom);

    // if 'returnExpired' is true,
    //      the value will be instantaneously returned and the cache
    //      will be generated in the background

    // if 'returnExpired' is false,
    //      the promise will be resolved when the new generation is done

    // you can use whatever key you want for caching
    let key: any = {a: 1};

    await cache.get(key, 2000, getRandom);
    await cache.get(key, 2000, getRandom);
})();
```
