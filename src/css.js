import { stringifyRules } from './rules';
import { createSheet } from './sheet';
import { isHtmlTag, isElement } from './utils';
import classNames from './classNames';

const _cssRules = new Map();
const _globalRules = new Map();

const css = cls => (strings, ...values) => {
    let strCss = '';
    let merge = false
    if (cls) {
        if (_cssRules.has(cls)) {
            merge = true;
        }
    }
    let className = cls || `s_${Math.random().toString(36).substr(2, 9)}`;

    for (let i = 0; i < strings.length; i++) {
        if (i > 0) {
            strCss += values[i - 1];
        }
        strCss += strings[i];
    }

    let rules = stringifyRules(strCss, className);
    if (merge) {
        rules = mergeRules(className, _cssRules.get(className), rules);
    }
    _cssRules.set(className, rules);
    return styleProxy(className);
}

const injectRules = (id) => {

    // Global rules should be first in order to cascade properly
    let allRules = new Map([..._globalRules, ..._cssRules]);

    allRules.forEach((value, key) => {
        if (document.getElementById(key)) {            
            return; // Already mounted
        }
        if (id && key !== id) {
            return;
        }
        var sheet = createSheet(key, value);
        document.head.appendChild(sheet);
    });
}

const unmountRules = (className) => {

    let allRules = new Map([..._globalRules, ..._cssRules]);

    let styles = Array.prototype.slice.call(document.head.getElementsByTagName('style'), 0);

    if (className) {
        styles = styles.filter(f => f.id === className);
    }
    
    allRules.forEach((value, key) => {
        var node = styles.filter(f => f.id === key)[0];

        if (node) {
            document.head.removeChild(node);
            if (_cssRules.has(key)) {
                _cssRules.delete(key);
            } else if (_globalRules.has(key)) {
                _globalRules.delete(key);
            }
        }        
    });
}

const extend = (el, prop, style, props) => {    
    let rs = create(el);
    let elem = rs[prop](Object.assign({}, props, {
        className: classNames(style.className, props && props.className || '')
    }));
    console.log('extended', elem);    
    return elem;
}

const create = (el) => {

    const cssHandler = {
        get: function (obj, prop) {

            if (prop === 'injectRules') {
                return function () {
                    return injectRules.apply(this, arguments);
                }
            }

            if (prop === 'unmountRules') {
                return function () {
                   return unmountRules.apply(this, arguments);
                }
            }

            if (isHtmlTag(prop)) {

                return (...props) => {

                    let element = el(prop, props);

                    return (strings, ...values) => {

                        let style = css()(strings, values);

                        element.classList.add(style.className);

                        obj['_restyled'] = style.className;

                        element.injectRules = () => injectRules.call(null, style.className);
                        element.unmountRules = () => unmountRules.call(null, style.className);
                        element.extend = extend.bind(null, el, prop, style);
    
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

const selectorOrElement = (target) => {
    if (typeof target === 'string') {
        return Array.prototype.slice.call(document.querySelectorAll(target));
    } else if (isElement(target)) {
        return [target];
    } else {
        return Array.prototype.slice.call(target);
    }
}

const styleProxy = (cls) => {
    return {
        className: cls,
        injectRules: () => { injectRules.call(null, cls); return styleProxy(cls) },
        unmountRules: () => { unmountRules.call(null, cls); return styleProxy(cls) },
        applyRules: (el) => { selectorOrElement(el).forEach(elem => elem.classList.add(cls)) }
    }
}

const mergeRules = (ns, ...rules) => {
    
    return `.${ns}{` + (rules || []).reduce((prev, current) => {
        prev += current.replace(`.${ns}{`, '').replace(/\}$/, '');
        return prev;
    }, '') + '}';
}

const globalCss = cls => (strings, ...values) => {
    let strCss = '';
    let merge = false;
    if (cls) {
        if (_globalRules.has(cls)) {
            merge = true;
        }
    }
    let className = cls ||  `g_${Math.random().toString(36).substr(2, 9)}`;

    for (let i = 0; i < strings.length; i++) {
        if (i > 0) {
            strCss += values[i - 1];
        }
        strCss += strings[i];
    }

    let rules = stringifyRules(strCss, className);

    if (merge) {
        rules = mergeRules(className, _globalRules.get(className), rules);
    }

    _globalRules.set(className, rules);    

    return styleProxy(className);
}

export {
    css,
    injectRules,
    unmountRules,
    create,
    globalCss
}