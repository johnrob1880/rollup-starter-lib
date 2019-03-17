import { stringifyRules } from './rules';
import { createSheet } from './sheet';

const _cssRules = new Map();

const css = (strings, ...values) => {
    let strCss = '';
    let className = `s_${Math.random().toString(36).substr(2, 9)}`;

    for (let i = 0; i < strings.length; i++) {
        if (i > 0) {
            strCss += values[i - 1];
        }
        strCss += strings[i];
    }

    let rules = stringifyRules(strCss, className);
    _cssRules.set(className, rules);

    return className;
}

const injectRules = (id) => {
    let rules = _cssRules.slice(0);

    if (id) {
        rules = rules.filter(f => f.id === id);    
    }
    
    rules.forEach((value, key) => {
        if (document.getElementById(key)) {
            // Already mounted
            return;
        }
        var sheet = createSheet(key, value);
        document.head.appendChild(sheet);
    });
}

const unmountRules = (id) => {

    let styles = Array.prototype.slice.call(document.head.getElementsByTagName('style'), 0);
    
    if (id) {
        styles = styles.filter(f => f.id === id);
    }
    _cssRules.forEach((value, key) => {
        var node = styles.filter(f => f.id === key)[0];

        if (node) {
            document.head.removeChild(node);
        }
    });
    _cssRules.clear();
}

const isHtmlTag = (input) => {
    return document.createElement(input).toString() != "[object HTMLUnknownElement]";
}

const create = (el) => {

    const cssHandler = {
        get: function (obj, prop) {

            if (prop === 'inject') {
                return function (arg) {
                    injectRules(arg)
                }
            }

            if (prop === 'unmount') {
                return function (arg) {
                    unmountRules(arg);
                }
            }

            if (isHtmlTag(prop)) {

                return (...props) => {

                    let element = el(prop, props);

                    return (strings, ...values) => {

                        let cls = css(strings, values);

                        element.classList.add(cls);

                        obj['_restyled'] = cls;
    
                        return element;
                    }
                }                
            }
            return obj[prop];
        }
    }

    const cssProxy = new Proxy(el, cssHandler);

    return cssProxy;
}

const mergeRules = (ns, ...rules) => {
    
    return `.${ns}{` + (rules || []).reduce((prev, current) => {
        prev += current.replace(`.${ns}{`, '').replace(/\}$/, '');
        return prev;
    }, '') + '}';
}

const globalCss = (strings, ...values) => {
    let strCss = '';
    let className = `__global__`;

    for (let i = 0; i < strings.length; i++) {
        if (i > 0) {
            strCss += values[i - 1];
        }
        strCss += strings[i];
    }

    let rules = stringifyRules(strCss, className);

    if (_cssRules.has(className)) {
        _cssRules.set(className, mergeRules(className, _cssRules.get(className), rules));
    } else {
        _cssRules.set(className, rules);
    }
}

export {
    css,
    injectRules,
    unmountRules,
    create,
    globalCss
}