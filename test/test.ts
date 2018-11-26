import {PromiseCaching} from "../src/index";
import {isNumber} from "util";

describe('PromiseCaching', function () {
    this.slow(10000);
    async function sleep(ms: number): Promise<void> {
        return new Promise<void>(resolve => setTimeout(resolve.bind(this), ms));
    }

    // dummy values
    const DUMMY_KEY_A: string = 'key';
    const DUMMY_VALUE_A: number = 32;
    const DUMMY_VALUE_B: number = 86;

    describe('#get(key, expire?, generator?)', function () {

        // promise - resolves in 'duration' ms with value 'DUMMY_VALUE_A'
        let generatorCalls: number = 0;

        async function generator(duration: number): Promise<number> {
            ++generatorCalls;
            await sleep(duration);
            return DUMMY_VALUE_A;
        }

        beforeEach(function () {
            this.cache = new PromiseCaching({returnExpired: false});
            this.cacheExpired = new PromiseCaching({returnExpired: true});
            generatorCalls = 0;
        });

        it('cache is kept in memory for \'expire\' ms AFTER generator is resolved', async function () {

            this.timeout(200);

            // registers 'DUMMY_VALUE_A' as 'mykey' - generation takes 100ms, expiration is 100ms
            this.cache.get('mykey', 100, () => generator(100));

            // checks that in 150ms the cache is still valid
            // it means that the cache validity is counted as the cache is done generating
            await sleep(150);
            const d = await this.cache.get('mykey');
            if (d !== DUMMY_VALUE_A)
                throw new Error("Incorrect value");
        });


        it('cache is only generated once', async function () {

            this.timeout(120);

            let promises: Array<Promise<number>> = [];
            for (let i = 0; i < 200; i++) {
                promises.push(this.cache.get('mykey', 100, () => generator(100)));
            }

            const d = await Promise.all(promises);

            for (let i = 0; i < d.length; ++i)
                if (d[i] != DUMMY_VALUE_A)
                    throw new Error("Expected DUMMY_VALUE_A");

            if (generatorCalls !== 1)
                throw new Error("Expected " + DUMMY_VALUE_A);
        });


        it('error is thrown when no generator and expired cache', function (done) {

            this.cache.get('mykey', 100)
                .then(() => {
                    done(new Error("Should not resolve"));
                })
                .catch((error: Error) => {
                    done();
                });
        });


        it('cache is destroyed after expiration time', async function () {
            this.cache.get('mykey', 100, () => generator(0));
            await sleep(200);
            // 'mykey' has expired now
            this.cache.get('mykey', 100, () => generator(0));
            await sleep(50);
            if (generatorCalls != 2)
                throw new Error("Cache should have been regenerated");
        });


        it('works with any key', async function () {

            let k1: any = {a: 1};
            this.cache.get(k1, 100, () => generator(50));

            const data = await this.cache.get(k1, 100);
            if (data !== DUMMY_VALUE_A)
                throw new Error("Expected " + DUMMY_VALUE_A);
        });


        it('return immediately when \'returnExpired\' is set to true', async function () {
            let timeUnit: number = 50;
            const genFunc: () => Promise<number> = generator.bind(this, timeUnit);
            await this.cacheExpired.get(DUMMY_KEY_A, timeUnit, () => genFunc());
            await sleep(2 * timeUnit);
            // expired
            let t1 = Date.now();
            await this.cacheExpired.get(DUMMY_KEY_A, timeUnit, () => genFunc());
            let duration = Date.now() - t1;
            if (duration >= timeUnit)
                throw new Error("Should have returned expired cache");
        });


        it('return a new promise when \'returnExpired\' is set to false', async function () {
            let timeUnit: number = 50;
            const genFunc: () => Promise<number> = () => generator(timeUnit);
            await this.cache.get(DUMMY_KEY_A, timeUnit, () => genFunc());
            await sleep(2 * timeUnit);
            // expired
            let t1 = Date.now();
            await this.cache.get(DUMMY_KEY_A, timeUnit, () => genFunc());
            let duration = Date.now() - t1;
            if (duration < timeUnit)
                throw new Error("Should not have returned expired cache");
        });

    });

    describe('#store(key, expire, value)', function () {

        it('should allow manual data storage', async function () {
            let timeUnit: number = 50;
            let p: PromiseCaching = new PromiseCaching({ returnExpired: false });
            p.store<number>(DUMMY_KEY_A, timeUnit * 2, DUMMY_VALUE_A);
            // not expired
            if (await p.get<number>(DUMMY_KEY_A) !== DUMMY_VALUE_A)
                throw new Error("Value expected");
        });

        it('manual data storage should expire', async function () {
            let timeUnit: number = 50;
            let p: PromiseCaching = new PromiseCaching({ returnExpired: false });
            p.store<number>(DUMMY_KEY_A, timeUnit * 2, DUMMY_VALUE_A);
            await sleep(timeUnit * 2);
            // expired
            let val: number = await p.get<number>(DUMMY_KEY_A, timeUnit, async () => DUMMY_VALUE_B);
            if (val !== DUMMY_VALUE_B)
                throw new Error("Value should have expired");
        });


    });
});
