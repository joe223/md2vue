import indent from 'indent'

export function camelCase (str) {
  return str.replace(/[_.-](\w|$)/g, (_, x) => x.toUpperCase())
}

export function kebabCase (name) {
  return name
    .replace(/^[A-Z]/, m => m.toLowerCase())
    .replace(
      /([0-9a-zA-Z])[\b\s]*([0-9A-Z])/g,
      (m, g1, g2) => `${g1}-${g2.toLowerCase()}`
    )
}

export function pascalCase (name) {
  return kebabCase(name)
    .replace(/-([0-9a-zA-Z])/g, (m, g1) => g1.toUpperCase())
    .replace(/^[a-z]/, m => m.toUpperCase())
}

export const addESLint = (code) => `/* eslint-disable */
${code}
`

export const wrapCSSText = (css) => css.trim() ? `
<style>
${css.trim()}
</style>
` : ''

export const wrapScript = ({
  code = '',
  names = '',
  shadow = false,
  styles = [],
  documentInfo = {}
}) => {
  if (typeof documentInfo !== 'object') {
    const msg = '`documentInfo` is not an object'
    console.warn(msg)
    throw msg
  }

  styles = styles
    .map(style => `decodeURIComponent("${encodeURIComponent(style.replace(/\n/g, ' '))}")`)
    .join('\n, ')

  const shadowComponent = !shadow ? '' : `,
  'shadow-demo': {
    props: { name: String, index: Number },
    render: function (h) { return h('div', { class: 'vue-shadow-demo' }); },
    mounted: function () {
      var el = this.$el
      var name = this.name;
      var index = this.index;
      var style = ___styles[index]

      var objectProto = ({}).__proto__;
      var vueProto = this.__proto__;
      while (vueProto) {
        if (vueProto.__proto__ === objectProto) {
          break
        }
        vueProto = vueProto.__proto__;
      }
      var Vue = vueProto.constructor;
      var shadowRoot = el.attachShadow
        ? el.attachShadow({ mode: 'closed' })
        : el.createShadowRoot()
      var styleElem = document.createElement('style');
      styleElem.setAttribute('type', 'text/css');
      styleElem.innerHTML = cssReset + style

      shadowRoot.appendChild(styleElem);

      var div = document.createElement('div');
      shadowRoot.appendChild(div);

      new Vue({
        components: {\n${indent(names, 8)}
        }, 
        render (h) {
          return h(name)
        }
      }).$mount(div)
    }
  }
`
  const cssReset = `
    .vue-demo {
      color: initial;
      margin: initial;
      padding: initial;
      box-sizing: initial;
      border: initial;
      background: initial;
      font: initial;
      word-wrap: initial;
      word-spacing: initial;
      word-break: initial;
      white-space: initial;
      text-align: initial;
      text-indent: inherit;
    }
`

  return `
<script lang="buble">
var ___styles = [
${styles}
];
var cssReset = "${cssReset.replace(/\n\s*/g, '')}";
${code}
var __exports = ${toJSON(documentInfo)};
__exports.components = {\n${indent(names, 2)}${shadowComponent}
}
module.exports = __exports;
</script>`
}

export const wrapMarkup = (markup) => `<template>
<article class="markdown-body">
${markup}
</article >
</template>`

export const wrapVueCompiled = ({ tagName, compiled }) => {
  return `var ${camelCase(tagName)} = (function (module) {
${compiled}
  return module.exports;
})({});
`
}

export const wrapModule = ({ componentName, compiled, css }) => {
  componentName = kebabCase(componentName)
  css = encodeURIComponent(css.replace(/\n/g, ' '))
  let cssCode = css.trim() === '' ? '' : `
  var insert = function (css) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    var elem = document.createElement('style')
    elem.setAttribute('type', 'text/css')
    elem.innerHTML = decodeURIComponent(css)

    var head = document.getElementsByTagName('head')[0]
    head.appendChild(elem)
    return function () {
      head.removeChild(elem)
    }
  }
  exports.created = function () {
    var css = "${css}"
    if (css) {
      this._insertcss = insert(css)
    }
  }
  exports.destroyed = function () {
    this._insertcss && this._insertcss()
  }
`

  return `/* eslint-disable */
var moduleExports = (function (module) {
  'use strict';
${indent(compiled.replace(/(\/\/\n\s*)+/g, ''), '  ')}
  var exports = module.exports
  exports.name = "${componentName}"
${cssCode}
  module.exports.install = function (Vue) {
    Vue.component(exports.name, exports)
  }

  return module.exports;
})({});
typeof exports === 'object' && typeof module !== 'undefined' && (module.exports = moduleExports);
typeof window !== void 0 && window.Vue && Vue.use(moduleExports);
this["${pascalCase(componentName)}"] = moduleExports;
`
}

export const wrapHljsCode = (code, lang) => `<pre v-pre class="lang-${lang}"><code>${code}</code></pre>`

function toJSON (obj) {
  if (typeof obj === 'function') {
    obj = obj.toString().replace(/\n\s*/g, ';')
    // short style: `a(){}`
    if (/^function /.test(obj) === false) {
      obj = 'function ' + obj
    }

    return obj
  }

  if (obj && typeof obj === 'object') {
    const arr = Object.keys(obj).map(key => `"${key}": ${toJSON(obj[key])}`)
    return `{${arr.join(',')}}`
  }

  return JSON.stringify(obj)
}
