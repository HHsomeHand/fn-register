// lib/log.js
import {ALL_FUNCTIONS, fnRegister} from "../src";

let LOG_TAG = "溯水流光: ";

let isLog = true;

const callStack = [];

/*
output:

callstack:
    fn1
    fn2
    fn3
 */
function getCallStackString() {
    const sep = "\n\t";
    return `callstack:${sep}` + callStack.join(sep) + "\n\n";
}

export function logStack(msg, logMethod = console.log) {
    if (isLog) {
        logMethod(LOG_TAG + msg + "\n" + getCallStackString());
    }
}

export function logError(msg) {
    logStack(msg, console.error);
}

export function logWarn(msg) {
    logStack(msg, console.warn);
}

export function setGlobalLogTag(logTag) {
    LOG_TAG = logTag;
}

export function initLogLib() {
    fnRegister.before(ALL_FUNCTIONS, (options) => {
        let {tag, fn, args, stop} = options;

        callStack.push(tag);
    });


    fnRegister.afterReturning(ALL_FUNCTIONS, (options) => {
        callStack.pop();
    });

    fnRegister.error(ALL_FUNCTIONS, (options) => {
        let {tag, fn, error} = options;

        logError("错误: " + error.message);
    });

}
