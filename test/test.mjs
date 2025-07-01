// test/test.mjs

import {fn, fnRegister} from "../src/index.mjs";

fnRegister.before(/fn2/, () => {
    console.log("before");
});

fnRegister.afterReturning(/fn2/, () => {
    console.log("afterReturning");
});

fnRegister.error(/fn2/, () => {
    console.log("error");
});

const fn1 = fn("fn1", () => {
    console.log("fn1 is called");
});

fn1();

const fn2 = fn("fn2", () => {
    console.log("fn2 is called");
    // throw new Error("fn2 is called");
});

fn2();
