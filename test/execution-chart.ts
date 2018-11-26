import {PromiseCaching} from "../src";

const RETURN_EXPIRED: boolean = true;

const EXPIRE: number = 50;
const RESOLVE_DURATION: number = 50;
const TRIGGER_INTERVAL: number = 12;
const TEST_DURATION: number = 180;
const KEY: string = 'THEKEY';
const durations: number[] = [];

let cache: PromiseCaching = new PromiseCaching({returnExpired: RETURN_EXPIRED});


/**
 * Utility function
 *
 * @param ms
 */
async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve.bind(this), ms));
}

/**
 * Trigger cache
 */
async function trigger() {

    const index: number = durations.push(Date.now()) - 1;
    await cache.get(KEY, EXPIRE, sleep.bind(this, RESOLVE_DURATION));
    durations[index] = Date.now() - durations[index];
}

/**
 * Print results
 *
 * 1 space = 1 TRIGGER_INTERVAL
 */
function printResult() {

    let maxIdLength: number = 2;

    function formatId(id: number){
        let out: string = id.toString();
        while (out.length < maxIdLength)
            out = " " + out;
        return out;
    }

    process.stdout.write(" [id]" + " ".repeat(maxIdLength - 1) + "|-------------> time\n\r");
    for (let i: number = 0; i < durations.length; ++ i) {


        process.stdout.write(" " + formatId(i) + "   | ");
        process.stdout.write(" ".repeat(i));
        const intervals: number = Math.floor(durations[i] / TRIGGER_INTERVAL);
        process.stdout.write("=".repeat(intervals));
        process.stdout.write(">");
        process.stdout.write("\n");
    }
}

for (let i: number = 0; i < TEST_DURATION; i += TRIGGER_INTERVAL)
    setTimeout(trigger.bind(this), i);

setTimeout(printResult, 2 * RESOLVE_DURATION + TEST_DURATION);