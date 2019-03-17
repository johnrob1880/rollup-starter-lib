const compressRules = (str) => {
    return str.replace(/(\r\n|\n|\r|(\s\s+))/gm, '').replace(/\:(\s)+/g, ':').replace(' {', '{')
}

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
    }, '')

    return strRules;
}

export {
    stringifyRules,
    compressRules
}