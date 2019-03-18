const isString = (test) => typeof test === 'string' || test instanceof String;
const isObject = (test) => test && typeof test === 'object' && test.constructor === Object;
const isHtmlTag = (input) => {
    return document.createElement(input).toString() != "[object HTMLUnknownElement]";
}
const isElement = (target) => target instanceof Element || target instanceof HTMLDocument;


export {
    isString,
    isObject,
    isHtmlTag,
    isElement
}