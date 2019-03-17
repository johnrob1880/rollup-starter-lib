const createSheet = (id, rules) => {
    let sheet = document.createElement('style');
    sheet.type = 'text/css';
    sheet.innerHTML = rules
    sheet.id = id;

    return sheet;
}

export { 
    createSheet
}