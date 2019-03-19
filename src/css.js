import { buildRules, stringifyRules } from './rules';
import { createSheet, getSheet } from './sheet';
import { isHtmlTag, isElement } from './utils';
import classNames from './classNames';

const _themes = new Map();
const _cssRules = new Map();
const _globalRules = new Map();

const css = (props) => (strings, ...values) => {
    const { className, base } = props || {};
    
    if (_cssRules.has(className)) {
        console.log(`warning: over-writing existing rules for ${className}. If this was not intended, use the base property.`);
    }
    let mergeBase = !!base;

    let cls = className || `s_${Math.random().toString(36).substr(2, 9)}`;
    let rules = stringifyRules(buildRules(strings, values), mergeBase ? `${base}${cls}` : cls);
    if (mergeBase) {
        let baseRules = _cssRules.get(base) || '';
        rules = mergeRules(base, baseRules, rules);
    }

    _cssRules.set(mergeBase ? base : cls, rules);
    return styleProxy(cls, base);
}

const injectRules = (id, base) => {

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

const unmountRules = (className, base) => {

    let allRules = new Map([..._globalRules, ..._cssRules]);

    let styles = Array.prototype.slice.call(document.head.getElementsByTagName('style'), 0);

    if (base) {
        styles = styles.filter(f => f.id === base);
    } else if (className) {
        styles = styles.filter(f => f.id === className);
    }

    allRules.forEach((value, key) => {
        var node = styles.filter(f => f.id === key)[0];

        if (node) {
            if (base && base !== className) {
                let regExp = new RegExp(`\.${base}${className}{[^}]*}`, 'gi');
                let matches = regExp.exec(node.innerHTML);
                Array.prototype.slice.call(matches,0).forEach( match => {
                    node.innerHTML = node.innerHTML.replace(match, '');
                });
            } else {
                document.head.removeChild(node);
                if (_cssRules.has(key)) {
                    _cssRules.delete(key);
                } else if (_globalRules.has(key)) {
                    _globalRules.delete(key);
                }
            }
        }        
    });
}

const extend = (el, prop, style, props) => {    
    let rs = create(el);
    let elem = rs[prop](Object.assign({}, props, {
        className: classNames(style.className, props && props.className || '')
    }));  
    return elem;
}

const themeProxy = (name) => {
    return {
        apply: () => {
            let sheet;
            _themes.forEach((value, key) => {
                sheet = getSheet(key);
                if (sheet) {
                    sheet.parentNode.removeChild(sheet);
                }
            });
            sheet = createSheet(name, _themes.get(name));
            document.head.insertBefore(sheet, document.head.firstElementChild);
            return name;
        }
    }
}

const theme = (name) => (strings, ...values) => {
    let rules = buildRules(strings, values);
    rules = `:root{${stringifyRules(rules, name)}}`;
    _themes.set(name, rules);
    return themeProxy(name);
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

            if (prop === 'theme') {
                return function () {
                    return applyTheme.apply(this, arguments);
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

const styleProxy = (cls, base) => {
    return {
        className: cls,
        injectRules: () => { injectRules.call(null, cls, base); return styleProxy(cls) },
        unmountRules: () => { unmountRules.call(null, cls, base); return styleProxy(cls) },
        applyRules: (el) => { selectorOrElement(el).forEach(elem => elem.classList.add(cls)) }
    }
}

const mergeRules = (ns, ...rules) => {    
    return (rules || []).reduce((prev, current) => {
        //prev += current.replace(`.${ns}{`, '').replace(/\}$/, '');
        prev += current.replace(':host', ns);
        return prev;
    }, '');
}

const globalCss = cls => (strings, ...values) => {
    let merge = false;
    if (cls) {
        if (_globalRules.has(cls)) {
            merge = true;
        }
    }
    let className = cls ||  `g_${Math.random().toString(36).substr(2, 9)}`;
   
    let rules = stringifyRules(buildRules(strings, values), className);

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
    globalCss,
    theme
}