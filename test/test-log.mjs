// test/test-log.mjs

import {initLogLib, logStack} from "../lib/log.js";
import {fn} from "../src/index.mjs";

initLogLib();

let fn1 = fn('fn1', () => {
    logStack("你好, 世界");
});

let fn2 = fn('fn2', () => {
    fn1();
});

let fn3 = fn('fn3', () => {
    fn2();
})

fn('main', () => {
    fn3();

    logStack("test");
})();

