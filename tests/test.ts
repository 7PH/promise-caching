import * as assert from "assert";
import {PromiseCaching} from "../src/index";

describe('PromiseCaching', function () {
    this.slow(10000);


    describe('#get(key, expire?, generator?)', function () {


        // promise - resolves in 'duration' ms with value '32'
        let generatorCalls: number = 0;
        let generator: (duration: number) => Promise<number> = (duration: number) => {
            ++ generatorCalls;
            return new Promise<number>(resolve => {
                setTimeout(() => {
                    return resolve(32)
                }, duration);
            });
        };

        it('cache is kept in memory for \'expire\' ms >after< generator has resolved', function (done) {
            this.timeout(200);

            let p: PromiseCaching = new PromiseCaching();

            // registers '32.0' as 'mykey' - generation takes 100ms, expiration is 100ms
            p.get<number>('mykey', 100, generator.bind(this, 100));

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
                    if (d[i] != 32) return done(new Error("Expected 32"));
                }
                if (generatorCalls == 1) done();
                else done(new Error("Expected 32"));
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
                    if (data == 32) done();
                    else done(new Error("Expected 32"));
                }).catch(done);

        });


    });
});
