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


const label1 = css({className: '--orange', base: 'labels'})`
    :this {
        color: orange;
        background-color: transparent;
    }
`

// no reference needed, injected with restyled.injectRules() call.
css({className: '--blue', base: 'labels'})`
    :this {
        color: blue;
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
        this.orangeLabel = el(`label.labels--orange`, { textContent: 'Orange Label'}),
        el(`label.labels--blue`, { textContent: 'Blue Label'})
        );

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