import { el, mount } from 'redom';
import { create, css, theme } from './../src/index';

const restyled = create(el);

const childStyle = css({
    className: 'wild-style'
})`
:this {
    border: 3px solid green;
}
`
const defaultTheme = theme('default')`
    --primary-color: #dddddd;
    --primary-color-active: #cccccc;
    --text-on-primary: #000;
    --text-on-primary-active: #000;
`
const brightTheme = theme('bright')`
    --primary-color: red;
    --primary-color-active: maroon;
    --text-on-primary: white;
    --text-on-primary-active: yellow;
`


const orangeLabel = css({className: 'label--orange', base: 'labels'})`
    :this {
        color: orange;
        background-color: transparent;
    }
    :this:hover {
        color: red;
    }
`

css({className: 'tropical-label'})`
    :this {
        display: inline-block;
        border: 1px solid green;
        padding: 6px 12px;
    }
    :this:hover {
        color: purple;
        background-color: ${orangeLabel.style().color};
    }
`;

const labelFactory = orangeLabel.create(el);

// css factory example
const tropicalLabel  = labelFactory.label({
    className: 'tropical-label', 
    textContent: 'Hola', 
    onclick: () => alert('hola')
});


const blueLabel = css({className: 'label--blue', base: 'labels'})`
    :this {
        color: blue;        
    }
    :this:hover {
        background-color: #ebebeb;
    }
`


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
        }),
        this.button3 = this.button.extend({
            textContent: 'Extended'
        })`
            :this {
                padding: 20px;
            }
        `,
        orangeLabel,
        tropicalLabel,
        el(`label.label--orange`, { textContent: 'Orange Label'}),
        el(`label.${blueLabel.className}`, { textContent: 'Blue Label'})
        );

        this.theme = 'default';
        
    }
    onmount() {
        restyled.injectRules();
        defaultTheme.apply();
      
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