import * as assert from "assert";
import {PromiseCaching} from "../";

describe('PromiseCaching', function () {
    this.slow(10000);


    describe('#get(key, expire?, generator?)', function () {


        // promise - resolves in 100ms with value '32'
        let generatorCalls: number = 0;
        let generator: () => Promise<number> = () => {
            ++ generatorCalls;
            return new Promise<number>(resolve => {
                setTimeout(() => {
                    return resolve(32)
                }, 100);
            });
        };

        it('cache is kept in memory for \'expire\' ms >after< generator is done', function (done) {
            this.timeout(200);

            let p: PromiseCaching = new PromiseCaching();

            // registers '32.0' as 'mykey' - generation takes 100ms, expiration is 100ms
            p.get<number>('mykey', 100, generator);

            // checks that in 150ms the cache is still valid
            // it means that the cache validity is counted as the cache is done generating
            setTimeout(() => {
                p.get<number>('mykey')
                    .then((d) => {
                        if (d === 32) {
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
            Promise.all([
                // registers '32.0' as 'mykey' - generation takes 100ms, expiration is 100ms
                p.get<number>('mykey', 100, generator),
                // generation is not done again - it wait for the first promise to resolve
                p.get<number>('mykey', 100, generator)
            ]).then((d) => {
                if (d[0] == 32 && d[1] == 32 && generatorCalls == 1) done();
                else done(new Error("Expected 32"));
            }).catch(done);

            this.timeout(120);
        });

    });
});
