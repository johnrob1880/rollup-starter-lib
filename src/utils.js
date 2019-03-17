const isString = (test) => typeof test === 'string' || test instanceof String;
const isObject = (test) => test && typeof test === 'object' && test.constructor === Object;


export {
    isString,
    isObject
}