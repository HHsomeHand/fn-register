// test/test-remove.mjs

import {ALL_FUNCTIONS, fn, fnRegister} from "../src";

const fn1 = fn("fn1", () => {
    console.log("fn1");
});

{

    const removeHandler = fnRegister.before(ALL_FUNCTIONS, () => {
        console.log("before");
    });

    fn1();

    removeHandler();

    fn1();

}

console.log("=========")

{

    fnRegister.before(ALL_FUNCTIONS, () => {
        console.log("before2");
    });

    const removeHandler = fnRegister.before(ALL_FUNCTIONS, () => {
        console.log("before1");
    });

    fn1();

    console.log("=========")

    removeHandler();

    fn1();

}


