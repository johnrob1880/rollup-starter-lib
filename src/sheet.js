const createSheet = (id, rules) => {
    let sheet = document.createElement('style');
    sheet.datset['restyled'] = true;
    sheet.type = 'text/css';
    sheet.innerHTML = rules
    sheet.id = id;

    return sheet;
}

const getSheet = (id) => {
    let sheet;
    Array.prototype.slice.call(document.head.getElementsByTagName('style')).forEach( s => {
        if (s.id === id) {
            sheet = s;
        }
    });
    return sheet;
}

const getSheets = () => {
    return Array.prototype.slice.call(document.head.getElementsByTagName('style'));
}

export { 
    createSheet,
    getSheet,
    getSheets
}