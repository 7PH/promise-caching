import {PromiseCaching} from "../src/index";
import {isNumber} from "util";

describe('PromiseCaching', function () {
    this.slow(10000);
    async function sleep(ms: number): Promise<void> {
        return new Promise<void>(resolve => setTimeout(resolve.bind(this), ms));
    }

    describe('#get(key, expire?, generator?)', function () {

        // dummy values
        const DUMMY_KEY_A: string = 'key';
        const DUMMY_VALUE_A: number = 32;

        // promise - resolves in 'duration' ms with value 'DUMMY_VALUE_A'
        let generatorCalls: number = 0;
        let generator: (duration: number) => Promise<number> = (duration: number) => {
            ++ generatorCalls;
            return new Promise<number>(resolve => {
                setTimeout(() => {
                    return resolve(DUMMY_VALUE_A)
                }, duration);
            });
        };

        it('cache is kept in memory for \'expire\' ms AFTER generator is resolved', function (done) {
            this.timeout(200);

            let p: PromiseCaching = new PromiseCaching();

            // registers 'DUMMY_VALUE_A' as 'mykey' - generation takes 100ms, expiration is 100ms
            p.get<number>('mykey', 100, generator.bind(this, 100));

            // checks that in 150ms the cache is still valid
            // it means that the cache validity is counted as the cache is done generating
            setTimeout(() => {
                p.get<number>('mykey')
                    .then((d) => {
                        if (d === DUMMY_VALUE_A) {
                            done();
                        } else {
                            done(new Error("Incorrect value"));
                        }
                    })
                    .catch((e) => {
                        done(e);
                    });
            }, 150);
        });




        it('cache is only generated once', function (done) {
            let p: PromiseCaching = new PromiseCaching();
            generatorCalls = 0;

            let promises: Array<Promise<number>> = [];
            for (let i = 0; i < 200; i ++) {
                promises.push(
                    p.get<number>(
                        'mykey',
                        100,
                        generator.bind(this, 100)
                    )
                );
            }
            Promise.all(promises).then((d) => {
                for (let i = 0; i < d.length; ++ i) {
                    if (d[i] != DUMMY_VALUE_A) return done(new Error("Expected DUMMY_VALUE_A"));
                }
                if (generatorCalls == 1) done();
                else done(new Error("Expected " + DUMMY_VALUE_A));
            }).catch(done);

            this.timeout(120);
        });




        it('error is thrown when no generator and expired cache', function (done) {
            let p: PromiseCaching = new PromiseCaching();
            p.get<number>('mykey', 100)
                .then(() => {
                    done(new Error("Should not resolve"));
                }).catch((error) => {
                done();
            });
        });



        it('cache is destroyed after expiration time', function (done) {
            let p: PromiseCaching = new PromiseCaching();
            generatorCalls = 0;
            p.get<number>('mykey', 100, generator.bind(this, 0));
            setTimeout(() => {
                // 'mykey' has expired now
                p.get<number>('mykey', 100, generator.bind(this, 0));

                setTimeout(() => {
                    if (generatorCalls == 2) {
                        done();
                    } else {
                        done(new Error("Cache should have been regenerated"));
                    }
                }, 50);
            },200);
        });



        it('works with any key', function (done) {
            let p: PromiseCaching = new PromiseCaching();
            let k1: any = {a: 1};

            generatorCalls = 0;
            p.get<number>(k1, 100, generator.bind(this, 50));

            p.get<number>(k1, 100)
                .then(data => {
                    if (data == DUMMY_VALUE_A) done();
                    else done(new Error("Expected " + DUMMY_VALUE_A));
                }).catch(done);

        });


        it('return immediately when \'returnExpired\' is set to true', async function () {
            let timeUnit: number = 50;
            let p: PromiseCaching = new PromiseCaching({ returnExpired: true });
            const genFunc: () => Promise<number> = generator.bind(this, timeUnit);
            await p.get<number>(DUMMY_KEY_A, timeUnit, () => genFunc());
            await sleep(2 * timeUnit);
            // expired
            let t1 = Date.now();
            await p.get<number>(DUMMY_KEY_A, timeUnit, () => genFunc())
            let duration = Date.now() - t1;
            if (duration >= timeUnit)
                throw new Error("Should have returned expired cache");
        });


        it('return a new promise when \'returnExpired\' is set to false', async function () {
            let timeUnit: number = 50;
            let p: PromiseCaching = new PromiseCaching({ returnExpired: false });
            const genFunc: () => Promise<number> = generator.bind(this, timeUnit);
            await p.get<number>(DUMMY_KEY_A, timeUnit, () => genFunc());
            await sleep(2 * timeUnit);
            // expired
            let t1 = Date.now();
            await p.get<number>(DUMMY_KEY_A, timeUnit, () => genFunc())
            let duration = Date.now() - t1;
            if (duration < timeUnit)
                throw new Error("Should not have returned expired cache");
        });


    });
});
