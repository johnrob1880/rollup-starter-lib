import { el, mount } from 'redom';
import { create, css, globalCss } from './../src/index';

const restyled = create(el)

class App {
    constructor() {
        this.el = el('.example', this.button = restyled.button({
            textContent: 'Change Theme',
            onclick: this.changeTheme.bind(this)
        })`
            :this {
                background-color: var(--primary-color, #cdcdcd);
                color: var(--text-on-primary, black);
            }
        `, this.button2 = el('button.unstyled', {
            textContent: 'Unstyled'
        }));

        
    }
    onmount() {
        this.theme = globalCss('theme')`
        :root {
            --primary-color: red;
            --text-on-primary: white;
        }
        `;

        restyled.injectRules();

    }
    changeTheme() {
        
        restyled.unmountRules('theme');

        this.theme = globalCss('theme')`
        :root {
            --primary-color: blue;
            --text-on-primary: white;
        }
        `;
        this.theme.injectRules();

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