# restyled

CSS in JS styles for RE:DOM

## Installation

Install this package via npm:

```bash
npm install @johnrob1880/restyled
```

## Create

```js
import { el, mount } from 'redom'
import { create } from '@johnrob1880/restyled'

let restyled = create(el)

class App {
    constructor() {
        this.el = el('.app', this.button = restyled.button({
            textContent: 'Submit',
            // ... same props passed to redom el
        })`
            :this {
                display: inline-block;
                background-color: #000000;
                color: #fff;
                border: none;
                padding: 6px 16px;
            }
        `)
    }
    onmount() {
        // inject styles into the document's head section
        restyled.inject(); 
    }
    onunmount() {
        // remove styles from the document's head section
        restyled.unmount();
    }
}

mount(document.body, new App())
```

## CSS

```js 
    import { css, injectRules, unmountRules } from '@johnrob1880/restyled'

    let buttonStyles = css`
        :this {
            display: inline-block;
            background-color: #000000;
            color: #fff;
            border: none;
            padding: 6px 16px;
        }
    `

    class App {
        constructor() {
            this.el =  el('.app', this.button = el('button', {
                className = buttonStyles
            }))
        }
        onmount() {
            // inject styles into the document's head section
            injectRules()
        }
        onunmount() {
            // remove styles from the document's head section
            unmountRules()
        }
    }

    mount(document.body, new App())
```

## classNames utility

```js
    import { el, mount } from 'redom'
    import { classNames } from '@johnrob1880/restyled'

    let x = 1, y = 2

    let app = el('.app', el('button', {
        className: classNames('btn', 'primary', { 'disabled': x === y })
    }))

    mount(document.body, app)
```


## License

[MIT](LICENSE).
