// src/index.ts
// 存储格式为 [{tag, fn, order}....]

interface IRegisterEntry<FnType = any> {
    tag: RegExp,
    fn: FnType,
    order: number,
}


interface IInterceptorOptions {
    tag: string, // 源函数的 tag
    fn: any, // 源函数
}

interface IBeforeOptions extends IInterceptorOptions {
    args: any[],
    stop: (result: any, options: {isExecuteAfterFns: boolean}) => void,
}

interface IAfterOptions extends IInterceptorOptions {
    result: { current: any },
    stop: (result: any) => void,
}

interface IAfterReturningOptions extends IAfterOptions {
    result: { current: any },
}

interface IErrorOptions extends IAfterOptions {
    error: any,
}


type BeforeFnType = (options: IBeforeOptions) => void;
type AfterReturningFnType = (options: IAfterReturningOptions) => void;
type ErrorFnType = (options: IErrorOptions) => void;


const beforeFns: IRegisterEntry<BeforeFnType>[] = [];
const afterReturningFns: IRegisterEntry[] = [];
const errorFns: IRegisterEntry[] = [];

export const ALL_FUNCTIONS = /.*/;

function addFn(arr: IRegisterEntry[], newItem: IRegisterEntry) {
    // 是否添加成功
    let isOptSuccess = false;

    for (const [index, item] of arr.entries()) {
        if (newItem.order <= item.order) {
            arr.splice(index, 0, newItem);

            isOptSuccess = true;
        }
    }

    // 用于处理 添加最大 order 的 item
    // 或是 第一次添加
    if (!isOptSuccess) {
        arr.push(newItem);

        isOptSuccess = true;
    }
}

export const fnRegister = {
    /**
     * fnRegister.before(tag, fn, options)
     * 注册前置处理函数 fn
     *
     * tag 为正则表达式, 匹配要处理的函数
     *
     * fn 为 (options) => {}
     *
     * (options) => {
     *     let {tag, fn, args, stop} = options;
     * }
     *
     * before.fn.options 内容为: 目标函数的 tag，目标 fn，参数数组 args (类似...args 获取的东西), stop函数
     *  - stop(result, options) 函数，终止函数处理链的调用, 可以传出返回值
     *      - stop.options 包含 isExecuteAfterFns 是否执行后置函数, 默认为 true
     *
     *
     *
     * before.options 包含:
     *  - order 指定顺序, 从小到大, 依次调用
     *
     * 前置处理函数可以用于修改 arg
     */
    before(tag: RegExp, fn: BeforeFnType, options: {order?: number} = {}) {
        const {order = 0} = options;

        addFn(beforeFns, {tag, fn, order});

        // 方便链式调用
        return this;
    },

    /**
     * fnRegister.afterReturning(tag, fn, option)
     * 注册后置处理函数 fn
     * 发生异常后, 将不会被调用
     *
     * tag 为正则表达式, 匹配要处理的函数
     *
     * fn 为 (options) => {}
     *
     * after.fn.options 内容为: 目标函数的 tag，目标 fn，返回值对象 result, stop函数
     *  - stop(result) 函数，终止函数处理链的调用, 可以传出返回值
     *  - result.current
     *
     * after.options 包含:
     *  - order 指定顺序, 从小到大, 依次调用
     *
     * 后置处理函数可以用于修改返回值
     */
    afterReturning(tag: RegExp, fn: AfterReturningFnType, options: {order?: number} = {}){
        const {order = 0} = options;

        addFn(afterReturningFns, {tag, fn, order});

        // 方便链式调用
        return this;
    },

    /**
     * fnRegister.error(tag, fn, option)
     * 注册后错误理函数 fn
     *
     * tag 为正则表达式, 匹配要处理的函数
     *
     * fn 为 (options) => {}
     *
     * error.fn.options 内容为: 目标函数的 tag，目标 fn，错误对象 error, stop函数
     *  - stop(result) 函数，终止函数处理链的调用, 可以传出返回值
     *
     * error.options 包含:
     *  - order 指定顺序, 从小到大, 依次调用
     *
     * 后置处理函数可以用于修改返回值
     */
    error(tag: RegExp, fn: ErrorFnType, options: {order?: number} = {}) {
        const {order = 0} = options;

        addFn(errorFns, {tag, fn, order});

        // 方便链式调用
        return this;
    }

};

/**
 * 我们 JS 这里可以对函数进行扩展，如
 *
 * let myFn = fn(tag，() => {})
 *
 * fn 用于包裹我们定义的方法。
 *
 * 这样看着冗余，但是这是必要的。这就跟 react hook 的 memo 一样。
 */
export function fn(tag: string, targetFn: any) {
    return (...args: any[]) => {
        // 返回值对象
        let l_resultObj = { current: undefined };

       try {
           // 是否在前置处理的时候, 就停止了
           let l_isBeforeStop = false;

           // 是否执行后置处理器
           let l_isExecuteAfterFns = true;

           // 前置处理
           {
               let isStop = false;

               function stop(result: any, {isExecuteAfterFns = true} = {}) {
                   isStop = true;

                   l_isBeforeStop = true;

                   l_resultObj.current = result;

                   l_isExecuteAfterFns = isExecuteAfterFns;
               }

               for (const [index, item] of beforeFns.entries()) {
                   // 不匹配则继续循环
                   if (!item.tag.test(tag)) {
                       continue;
                   }

                   const result = item.fn({tag, fn: targetFn, args, stop});

                   if (isStop) {
                       break;
                   }
               }
           } // END of 前置处理

           if (!l_isBeforeStop) {
               l_resultObj.current = targetFn(...args);
           }

           // 后置处理
           if (l_isExecuteAfterFns) {
               let isStop = false;

               function stop(result: any) {
                   isStop = true;

                   l_resultObj.current = result;
               }

               for (const [index, item] of afterReturningFns.entries()) {
                   // 不匹配则继续循环
                   if (!item.tag.test(tag)) {
                       continue;
                   }

                   const result = item.fn({tag, l_resultObj, stop});

                   if (isStop) {
                       break;
                   }
               }
           } // END of 后置处理
       } catch(e) {
           let isStop = false;

           function stop(result: any) {
               isStop = true;

               l_resultObj.current = result;
           }

           for (const [index, item] of errorFns.entries()) {
               // 不匹配则继续循环
               if (!item.tag.test(tag)) {
                   continue;
               }

               const result = item.fn({tag, e, stop});

               if (isStop) {
                   break;
               }
           }
       }

       return l_resultObj.current;
    }
}
