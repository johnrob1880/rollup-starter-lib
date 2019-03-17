import { isString, isObject } from './utils';

function classNames(...args) {
    const classes=[];
    let i, len = args.length, arg;
    for (i = 0; i < len; i++) {
        arg = args[i];
        if (isString(arg)) {
            classes.push(arg);
        } else if (isObject(arg)) {
            classes.push(classNames(...arg));
        } else if (isObject(arg)) {
            classes.push(classNames(...Object.keys(arg).filter(k => arg[k])));
        }
    }

    return classes.join(' ');
}

export default classNames;
