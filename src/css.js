import { buildRules, stringifyRules } from './rules';
import { createSheet, getSheet } from './sheet';
import { isHtmlTag, isElement } from './utils';
import classNames from './classNames';
import cache from './cache';

const css = (props) => (strings, ...values) => {
    const { className, base } = props || {};
    
    if (cache().cssRules.has(className)) {
        console.log(`warning: over-writing existing rules for ${className}. If this was not intended, use the base property.`);
    }
    let mergeBase = !!base;

    let cls = className || `s_${Math.random().toString(36).substr(2, 9)}`;
    let rules = stringifyRules(buildRules(strings, values), cls);
    let originalRules = rules;
    if (mergeBase) {
        let baseRules = cache().cssRules.get(base) || '';
        rules = mergeRules(base, baseRules, rules);
    }

    cache().cssRules.set(mergeBase ? base : cls, rules);
    return styleProxy(cls, base, originalRules);
}

const injectRules = (id) => {

    const inject = (map, name) => {
        console.log(`restyled: injecting ${map.size} ${name} rules.`);
        let sheet;
        map.forEach((value, key) => {
            if (id && key !== id) {
                return;
            }

            if (sheet = document.getElementById(key)) { 
                sheet.innerHTML = value;
                return; // Already mounted
            } 
            
            sheet = createSheet(key, value);
            document.head.appendChild(sheet);
        });
    }

    // Global rules should be first in order to cascade properly
    inject(cache().globalRules, 'global');
    inject(cache().cssRules, 'css');    
}

const unmountRules = (className, base) => {

    //let allRules = new Map([..._globalRules, ..._cssRules]);

    let styles = Array.prototype.slice.call(document.head.getElementsByTagName('style'), 0);

    if (base) {
        styles = styles.filter(f => f.id === base);
    } else if (className) {
        styles = styles.filter(f => f.id === className);
    }

    const unmount = (map, name) => {
        console.log(`restyled: unmounting ${map.size} ${name} rules.`);
        map.forEach((value, key) => {
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

                    if (cache().cssRules.has(key)) {
                        cache().cssRules.delete(key);
                    } else if (cache().globalRules.has(key)) {
                        cache().globalRules.delete(key);
                    }
                }
            }        
        });
    }

    unmount(cache().globalRules, 'global');
    unmount(cache().cssRules, 'css');
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
            cache().themes.forEach((value, key) => {
                sheet = getSheet(key);
                if (sheet) {
                    sheet.parentNode.removeChild(sheet);
                }
            });
            sheet = createSheet(name, cache().themes.get(name));
            document.head.insertBefore(sheet, document.head.firstElementChild);
            return name;
        }
    }
}

const theme = (name) => (strings, ...values) => {
    let rules = buildRules(strings, values);
    rules = `:root{${stringifyRules(rules, name)}}`;
    cache().themes.set(name, rules);
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

const inlineStyle = (...rules) => {
    let str = '';
    (rules || []).forEach( rule => {
        str += rule.replace(/^\.[^\{]+/g, '').replace(/\}/g, '').replace(/\{/g, '');
    })
    return str;
}

const cssName = (name) => {
    return name.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });    
}

const styleObject = (...rules) => {
    let style = {}
    let styles = inlineStyle(...rules);
    let arr = styles.split(';');
    arr.filter(c => !!c).forEach(rule => {
        let split = rule.split(':');
        style[cssName(split[0])] = split[1];
    })
    return style;
}

const styleProxy = (cls, base, rules) => {
    return {
        className: cls,
        base: base, 
        rules: () => rules,
        style: () => styleObject(rules),
        inlineStyle: () => inlineStyle(rules),
        injectRules: () => { injectRules.call(null, cls, base); return styleProxy(cls, base, rules) },
        unmountRules: () => { unmountRules.call(null, cls, base); return styleProxy(cls, base, rules) },
        applyRules: (el) => { selectorOrElement(el).forEach(elem => elem.classList.add(cls)); return styleProxy(cls, base, rules) },
        create: (h) => { 
            return new Proxy(h, {
            get: (obj, prop) => {
                if (isHtmlTag(prop)) {
                    return (...props) => {
                        let element = h(prop, props);
                        element.className = `${cls}${element.className ? ' ' + element.className : ''}`;
                        return element;
                    }
                }
                return obj[prop];
            }
        })}
    }
}

const mergeRules = (ns, ...rules) => {    
    return (rules || []).reduce((prev, current) => {
        prev += current.replace(':host', ns);
        return prev;
    }, '');
}

const globalCss = cls => (strings, ...values) => {
    let merge = false;
    if (cls) {
        if (cache().globalCss.has(cls)) {
            merge = true;
        }
    }
    let className = cls ||  `g_${Math.random().toString(36).substr(2, 9)}`;
   
    let rules = stringifyRules(buildRules(strings, values), className);

    if (merge) {
        rules = mergeRules(className, cache().globalRules.get(className), rules);
    }

    cache().globalRules.set(className, rules);    

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