const reStyle = /<style>([\s\S]+)<\/style>/
const reScript = /<script>([\s\S]+)<\/script>/
const reTemplate = /<template(|\s*[^>]+)>([\s\S]+)<\/template>/

export default (code) => {
  const styleMatch = reStyle.exec(code)
  const scriptMatch = reScript.exec(code)
  const templateMatch = reTemplate.exec(code)

  let style = styleMatch ? styleMatch[1].trim() : ''
  let script = scriptMatch ? scriptMatch[1].trim() : ''
  let template = templateMatch ? templateMatch[2].trim() : ''
  let templateAttr = templateMatch ? templateMatch[1].trim() : ''

  // case where `<template>` absent
  if (template === '') {
    template = code.replace(reStyle, '').replace(reScript, '')
  }

  if (script === '') {
    script = 'module.exports = {}'
  } else {
    script = script.replace(/export\s+default/, 'module.exports =')
  }

  return {
    style,
    script,
    template,
    effectOnly: templateAttr.indexOf('demo-only') > -1
  }
}
