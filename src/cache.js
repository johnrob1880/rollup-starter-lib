const cssRules = new Map();
const globalRules = new Map();
const themes = new Map();

export default () => {
    if (typeof window !== undefined) {
        window.restyled = window.restyled || {};
        window.restyled.cssRules = window.restyled.cssRules || new Map();
        window.restyled.globalRules = window.restyled.globalRules || new Map();
        window.restyled.themes = window.restyled.themes || new Map();

        return window.restyled;
    }

    return {
        cssRules,
        globalRules,
        themes
    }
}

