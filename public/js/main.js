(function () {
  'use strict';

  var HASH = '#'.charCodeAt(0);
  var DOT = '.'.charCodeAt(0);

  var TAG_NAME = 0;
  var ID = 1;
  var CLASS_NAME = 2;

  var parseQuery = function (query) {
    var tag = null;
    var id = null;
    var className = null;
    var mode = TAG_NAME;
    var offset = 0;

    for (var i = 0; i <= query.length; i++) {
      var char = query.charCodeAt(i);
      var isHash = char === HASH;
      var isDot = char === DOT;
      var isEnd = !char;

      if (isHash || isDot || isEnd) {
        if (mode === TAG_NAME) {
          if (i === 0) {
            tag = 'div';
          } else {
            tag = query.substring(offset, i);
          }
        } else if (mode === ID) {
          id = query.substring(offset, i);
        } else {
          if (className) {
            className += ' ' + query.substring(offset, i);
          } else {
            className = query.substring(offset, i);
          }
        }

        if (isHash) {
          mode = ID;
        } else if (isDot) {
          mode = CLASS_NAME;
        }

        offset = i + 1;
      }
    }

    return { tag: tag, id: id, className: className };
  };

  var createElement = function (query, ns) {
    var ref = parseQuery(query);
    var tag = ref.tag;
    var id = ref.id;
    var className = ref.className;
    var element = ns ? document.createElementNS(ns, tag) : document.createElement(tag);

    if (id) {
      element.id = id;
    }

    if (className) {
      if (ns) {
        element.setAttribute('class', className);
      } else {
        element.className = className;
      }
    }

    return element;
  };

  var unmount = function (parent, child) {
    var parentEl = getEl(parent);
    var childEl = getEl(child);

    if (child === childEl && childEl.__redom_view) {
      // try to look up the view if not provided
      child = childEl.__redom_view;
    }

    if (childEl.parentNode) {
      doUnmount(child, childEl, parentEl);

      parentEl.removeChild(childEl);
    }

    return child;
  };

  var doUnmount = function (child, childEl, parentEl) {
    var hooks = childEl.__redom_lifecycle;

    if (hooksAreEmpty(hooks)) {
      childEl.__redom_mounted = false;
      return;
    }

    var traverse = parentEl;

    if (childEl.__redom_mounted) {
      trigger(childEl, 'onunmount');
    }

    while (traverse) {
      var parentHooks = traverse.__redom_lifecycle || {};

      for (var hook in hooks) {
        if (parentHooks[hook]) {
          parentHooks[hook] -= hooks[hook];
        }
      }

      if (hooksAreEmpty(parentHooks)) {
        traverse.__redom_lifecycle = null;
      }

      traverse = traverse.parentNode;
    }
  };

  var hooksAreEmpty = function (hooks) {
    if (hooks == null) {
      return true;
    }
    for (var key in hooks) {
      if (hooks[key]) {
        return false;
      }
    }
    return true;
  };

  var hookNames = ['onmount', 'onremount', 'onunmount'];
  var shadowRootAvailable = typeof window !== 'undefined' && 'ShadowRoot' in window;

  var mount = function (parent, child, before, replace) {
    var parentEl = getEl(parent);
    var childEl = getEl(child);

    if (child === childEl && childEl.__redom_view) {
      // try to look up the view if not provided
      child = childEl.__redom_view;
    }

    if (child !== childEl) {
      childEl.__redom_view = child;
    }

    var wasMounted = childEl.__redom_mounted;
    var oldParent = childEl.parentNode;

    if (wasMounted && (oldParent !== parentEl)) {
      doUnmount(child, childEl, oldParent);
    }

    if (before != null) {
      if (replace) {
        parentEl.replaceChild(childEl, getEl(before));
      } else {
        parentEl.insertBefore(childEl, getEl(before));
      }
    } else {
      parentEl.appendChild(childEl);
    }

    doMount(child, childEl, parentEl, oldParent);

    return child;
  };

  var doMount = function (child, childEl, parentEl, oldParent) {
    var hooks = childEl.__redom_lifecycle || (childEl.__redom_lifecycle = {});
    var remount = (parentEl === oldParent);
    var hooksFound = false;

    for (var i = 0, list = hookNames; i < list.length; i += 1) {
      var hookName = list[i];

      if (!remount) { // if already mounted, skip this phase
        if (child !== childEl) { // only Views can have lifecycle events
          if (hookName in child) {
            hooks[hookName] = (hooks[hookName] || 0) + 1;
          }
        }
      }
      if (hooks[hookName]) {
        hooksFound = true;
      }
    }

    if (!hooksFound) {
      childEl.__redom_mounted = true;
      return;
    }

    var traverse = parentEl;
    var triggered = false;

    if (remount || (traverse && traverse.__redom_mounted)) {
      trigger(childEl, remount ? 'onremount' : 'onmount');
      triggered = true;
    }

    while (traverse) {
      var parent = traverse.parentNode;
      var parentHooks = traverse.__redom_lifecycle || (traverse.__redom_lifecycle = {});

      for (var hook in hooks) {
        parentHooks[hook] = (parentHooks[hook] || 0) + hooks[hook];
      }

      if (triggered) {
        break;
      } else {
        if (traverse === document ||
          (shadowRootAvailable && (traverse instanceof window.ShadowRoot)) ||
          (parent && parent.__redom_mounted)
        ) {
          trigger(traverse, remount ? 'onremount' : 'onmount');
          triggered = true;
        }
        traverse = parent;
      }
    }
  };

  var trigger = function (el, eventName) {
    if (eventName === 'onmount' || eventName === 'onremount') {
      el.__redom_mounted = true;
    } else if (eventName === 'onunmount') {
      el.__redom_mounted = false;
    }

    var hooks = el.__redom_lifecycle;

    if (!hooks) {
      return;
    }

    var view = el.__redom_view;
    var hookCount = 0;

    view && view[eventName] && view[eventName]();

    for (var hook in hooks) {
      if (hook) {
        hookCount++;
      }
    }

    if (hookCount) {
      var traverse = el.firstChild;

      while (traverse) {
        var next = traverse.nextSibling;

        trigger(traverse, eventName);

        traverse = next;
      }
    }
  };

  var setStyle = function (view, arg1, arg2) {
    var el = getEl(view);

    if (arg2 !== undefined) {
      el.style[arg1] = arg2;
    } else if (typeof arg1 === 'string') {
      el.setAttribute('style', arg1);
    } else {
      for (var key in arg1) {
        setStyle(el, key, arg1[key]);
      }
    }
  };

  /* global SVGElement */

  var xlinkns = 'http://www.w3.org/1999/xlink';

  var setAttr = function (view, arg1, arg2) {
    var el = getEl(view);
    var isSVG = el instanceof SVGElement;

    var isFunc = typeof arg2 === 'function';

    if (arg2 !== undefined) {
      if (arg1 === 'style') {
        setStyle(el, arg2);
      } else if (isSVG && isFunc) {
        el[arg1] = arg2;
      } else if (arg1 === 'dataset') {
        setData(el, arg2);
      } else if (!isSVG && (arg1 in el || isFunc)) {
        el[arg1] = arg2;
      } else {
        if (isSVG && (arg1 === 'xlink')) {
          setXlink(el, arg2);
          return;
        }
        el.setAttribute(arg1, arg2);
      }
    } else {
      for (var key in arg1) {
        setAttr(el, key, arg1[key]);
      }
    }
  };

  function setXlink (el, obj) {
    for (var key in obj) {
      el.setAttributeNS(xlinkns, key, obj[key]);
    }
  }

  function setData (el, obj) {
    for (var key in obj) {
      el.dataset[key] = obj[key];
    }
  }

  var text = function (str) { return document.createTextNode((str != null) ? str : ''); };

  var parseArguments = function (element, args) {
    for (var i = 0, list = args; i < list.length; i += 1) {
      var arg = list[i];

      if (arg !== 0 && !arg) {
        continue;
      }

      var type = typeof arg;

      // support middleware
      if (type === 'function') {
        arg(element);
      } else if (type === 'string' || type === 'number') {
        element.appendChild(text(arg));
      } else if (isNode(getEl(arg))) {
        mount(element, arg);
      } else if (arg.length) {
        parseArguments(element, arg);
      } else if (type === 'object') {
        setAttr(element, arg);
      }
    }
  };

  var ensureEl = function (parent) { return typeof parent === 'string' ? html(parent) : getEl(parent); };
  var getEl = function (parent) { return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el); };
  var isNode = function (a) { return a && a.nodeType; };

  var htmlCache = {};

  var memoizeHTML = function (query) { return htmlCache[query] || (htmlCache[query] = createElement(query)); };

  var html = function (query) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    var element;

    var type = typeof query;

    if (type === 'string') {
      element = memoizeHTML(query).cloneNode(false);
    } else if (isNode(query)) {
      element = query.cloneNode(false);
    } else if (type === 'function') {
      var Query = query;
      element = new (Function.prototype.bind.apply( Query, [ null ].concat( args) ));
    } else {
      throw new Error('At least one argument required');
    }

    parseArguments(getEl(element), args);

    return element;
  };

  html.extend = function (query) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    var clone = memoizeHTML(query);

    return html.bind.apply(html, [ this, clone ].concat( args ));
  };

  var el = html;

  var setChildren = function (parent) {
    var children = [], len = arguments.length - 1;
    while ( len-- > 0 ) children[ len ] = arguments[ len + 1 ];

    var parentEl = getEl(parent);
    var current = traverse(parent, children, parentEl.firstChild);

    while (current) {
      var next = current.nextSibling;

      unmount(parent, current);

      current = next;
    }
  };

  function traverse (parent, children, _current) {
    var current = _current;

    var childEls = new Array(children.length);

    for (var i = 0; i < children.length; i++) {
      childEls[i] = children[i] && getEl(children[i]);
    }

    for (var i$1 = 0; i$1 < children.length; i$1++) {
      var child = children[i$1];

      if (!child) {
        continue;
      }

      var childEl = childEls[i$1];

      if (childEl === current) {
        current = current.nextSibling;
        continue;
      }

      if (isNode(childEl)) {
        var next = current && current.nextSibling;
        var exists = child.__redom_index != null;
        var replace = exists && next === childEls[i$1 + 1];

        mount(parent, child, current, replace);

        if (replace) {
          current = next;
        }

        continue;
      }

      if (child.length != null) {
        current = traverse(parent, child, current);
      }
    }

    return current;
  }

  var propKey = function (key) { return function (item) { return item[key]; }; };

  var ListPool = function ListPool (View, key, initData) {
    this.View = View;
    this.initData = initData;
    this.oldLookup = {};
    this.lookup = {};
    this.oldViews = [];
    this.views = [];

    if (key != null) {
      this.key = typeof key === 'function' ? key : propKey(key);
    }
  };
  ListPool.prototype.update = function update (data, context) {
    var ref = this;
      var View = ref.View;
      var key = ref.key;
      var initData = ref.initData;
    var keySet = key != null;

    var oldLookup = this.lookup;
    var newLookup = {};

    var newViews = new Array(data.length);
    var oldViews = this.views;

    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var view = (void 0);

      if (keySet) {
        var id = key(item);

        view = oldLookup[id] || new View(initData, item, i, data);
        newLookup[id] = view;
        view.__redom_id = id;
      } else {
        view = oldViews[i] || new View(initData, item, i, data);
      }
      view.update && view.update(item, i, data, context);

      var el = getEl(view.el);

      el.__redom_view = view;
      newViews[i] = view;
    }

    this.oldViews = oldViews;
    this.views = newViews;

    this.oldLookup = oldLookup;
    this.lookup = newLookup;
  };

  var List = function List (parent, View, key, initData) {
    this.__redom_list = true;
    this.View = View;
    this.initData = initData;
    this.views = [];
    this.pool = new ListPool(View, key, initData);
    this.el = ensureEl(parent);
    this.keySet = key != null;
  };
  List.prototype.update = function update (data, context) {
      if ( data === void 0 ) data = [];

    var ref = this;
      var keySet = ref.keySet;
    var oldViews = this.views;

    this.pool.update(data, context);

    var ref$1 = this.pool;
      var views = ref$1.views;
      var lookup = ref$1.lookup;

    if (keySet) {
      for (var i = 0; i < oldViews.length; i++) {
        var oldView = oldViews[i];
        var id = oldView.__redom_id;

        if (lookup[id] == null) {
          oldView.__redom_index = null;
          unmount(this, oldView);
        }
      }
    }

    for (var i$1 = 0; i$1 < views.length; i$1++) {
      var view = views[i$1];

      view.__redom_index = i$1;
    }

    setChildren(this, views);

    if (keySet) {
      this.lookup = lookup;
    }
    this.views = views;
  };

  List.extend = function (parent, View, key, initData) {
    return List.bind(List, parent, View, key, initData);
  };

  const compressRules = str => {
    return str.replace(/(\r\n|\n|\r|(\s\s+))/gm, '').replace(/\:(\s)+/g, ':').replace(' {', '{');
  };

  const stringifyRules = (rules, styleId) => {
    let cssRules = [];

    if (!Array.isArray(rules)) {
      cssRules.push(rules);
    } else {
      cssRules = rules;
    }

    let strRules = cssRules.reduce((prev, current) => {
      prev += compressRules(current.replace(/\:this/g, `.${styleId}`));
      return prev;
    }, '');
    return strRules;
  };

  const buildRules = (strings, values) => {
    let strCss = '';

    for (let i = 0; i < strings.length; i++) {
      if (i > 0) {
        strCss += values[i - 1];
      }

      strCss += strings[i];
    }

    return strCss;
  };

  const createSheet = (id, rules) => {
    let sheet = document.createElement('style');
    sheet.type = 'text/css';
    sheet.innerHTML = rules;
    sheet.id = id;
    return sheet;
  };

  const getSheet = id => {
    let sheet;
    Array.prototype.slice.call(document.head.getElementsByTagName('style')).forEach(s => {
      if (s.id === id) {
        sheet = s;
      }
    });
    return sheet;
  };

  const isString = test => typeof test === 'string' || test instanceof String;

  const isObject = test => test && typeof test === 'object' && test.constructor === Object;

  const isHtmlTag = input => {
    return document.createElement(input).toString() != "[object HTMLUnknownElement]";
  };

  const isElement = target => target instanceof Element || target instanceof HTMLDocument;

  function classNames(...args) {
    const classes = [];
    let i,
        len = args.length,
        arg;

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

  const _themes = new Map();

  const _cssRules = new Map();

  const _globalRules = new Map();

  const css = props => (strings, ...values) => {
    const {
      className,
      base
    } = props || {};

    if (_cssRules.has(className)) {
      console.log(`warning: over-writing existing rules for ${className}. If this was not intended, use the base property.`);
    }

    let mergeBase = !!base;
    let cls = className || `s_${Math.random().toString(36).substr(2, 9)}`;
    let rules = stringifyRules(buildRules(strings, values), mergeBase ? `${base}${cls}` : cls);
    let originalRules = rules;

    if (mergeBase) {
      let baseRules = _cssRules.get(base) || '';
      rules = mergeRules(base, baseRules, rules);
    }

    _cssRules.set(mergeBase ? base : cls, rules);

    return styleProxy(cls, base, originalRules);
  };

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
  };

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
          Array.prototype.slice.call(matches, 0).forEach(match => {
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
  };

  const extend = (el, prop, style, props) => {
    let rs = create(el);
    let elem = rs[prop](Object.assign({}, props, {
      className: classNames(style.className, props && props.className || '')
    }));
    return elem;
  };

  const themeProxy = name => {
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
    };
  };

  const theme = name => (strings, ...values) => {
    let rules = buildRules(strings, values);
    rules = `:root{${stringifyRules(rules, name)}}`;

    _themes.set(name, rules);

    return themeProxy(name);
  };

  const create = el => {
    const cssHandler = {
      get: function (obj, prop) {
        if (prop === 'injectRules') {
          return function () {
            return injectRules.apply(this, arguments);
          };
        }

        if (prop === 'unmountRules') {
          return function () {
            return unmountRules.apply(this, arguments);
          };
        }

        if (prop === 'theme') {
          return function () {
            return applyTheme.apply(this, arguments);
          };
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
            };
          };
        }

        return obj[prop];
      }
    };
    const cssProxy = new Proxy(el, cssHandler);
    return cssProxy;
  };

  const selectorOrElement = target => {
    if (typeof target === 'string') {
      return Array.prototype.slice.call(document.querySelectorAll(target));
    } else if (isElement(target)) {
      return [target];
    } else {
      return Array.prototype.slice.call(target);
    }
  };

  const inlineStyle = (...rules) => {
    let str = '';
    (rules || []).forEach(rule => {
      str += rule.replace(/^\.[^\{]+/g, '').replace(/\}/g, '').replace(/\{/g, '');
    });
    return str;
  };

  const cssName = name => {
    return name.replace(/-([a-z])/g, function (g) {
      return g[1].toUpperCase();
    });
  };

  const styleObject = (...rules) => {
    let style = {};
    let styles = inlineStyle(...rules);
    let arr = styles.split(';');
    arr.filter(c => !!c).forEach(rule => {
      let split = rule.split(':');
      style[cssName(split[0])] = split[1];
    });
    return style;
  };

  const styleProxy = (cls, base, rules) => {
    let id = base ? `${base}${cls}` : cls;
    return {
      className: id,
      subClass: base ? cls : '',
      rules: () => rules,
      style: () => styleObject(rules),
      inlineStyle: () => inlineStyle(rules),
      injectRules: () => {
        injectRules.call(null, cls, base);
        return styleProxy(cls, base, rules);
      },
      unmountRules: () => {
        unmountRules.call(null, cls, base);
        return styleProxy(cls, base, rules);
      },
      applyRules: el => {
        selectorOrElement(el).forEach(elem => elem.classList.add(cls));
        return styleProxy(cls, base, rules);
      }
    };
  };

  const mergeRules = (ns, ...rules) => {
    return (rules || []).reduce((prev, current) => {
      prev += current.replace(':host', ns);
      return prev;
    }, '');
  };

  const restyled = create(el);
  const childStyle = css({
    className: 'wild-style'
  })`
:this {
    border: 3px solid green;
}
`;
  const defaultTheme = theme('default')`
    --primary-color: #dddddd;
    --primary-color-active: #cccccc;
    --text-on-primary: #000;
    --text-on-primary-active: #000;
`;
  const brightTheme = theme('bright')`
    --primary-color: red;
    --primary-color-active: maroon;
    --text-on-primary: white;
    --text-on-primary-active: yellow;
`;
  const label1 = css({
    className: '--orange',
    base: 'labels'
  })`
    :this {
        color: orange;
        background-color: transparent;
    }
`; // no reference needed, injected with restyled.injectRules() call.

  css({
    className: '--blue',
    base: 'labels'
  })`
    :this {
        color: blue;
        background-color: #ebebeb;
    }
`;

  class App {
    constructor() {
      this.el = el('.example', this.button = restyled.button({
        textContent: 'Change Theme',
        className: childStyle.className,
        onclick: this.changeTheme.bind(this)
      })`
            :this {
                background-color: var(--primary-color, #cdcdcd);
                color: var(--text-on-primary, black);
            }
            :this:hover {
                background-color: var(--primary-color-active, #dddddd);
                color: var(--text-on-primary-active, black);
            }
        `, this.button2 = el('button.unstyled', {
        textContent: 'Unstyled'
      }), this.button3 = this.button.extend({
        textContent: 'Extended'
      })`
            :this {
                padding: 20px;
            }
        `, this.orangeLabel = el(`label.labels--orange`, {
        textContent: 'Orange Label'
      }), el(`label.labels--blue`, {
        textContent: 'Blue Label'
      }));
      this.theme = 'default';
    }

    onmount() {
      restyled.injectRules();
      defaultTheme.apply();
      setTimeout(() => {
        label1.unmountRules();
        this.orangeLabel.textContent = 'Plain Label!';
      }, 2000);
    }

    changeTheme() {
      if (this.theme === 'default') {
        this.theme = brightTheme.apply();
      } else {
        this.theme = defaultTheme.apply();
      }

      let newStyle = css()`
            :this {
                background-color: yellow;
                color: black;
            }
        `;
      newStyle.injectRules();
      newStyle.applyRules(this.button2);
    }

  }

  mount(document.body, new App());

}());
//# sourceMappingURL=main.js.map
