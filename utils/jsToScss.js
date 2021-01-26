/**
 * @name jsToSassVariables
 * @param {Object} obj
 * @returns {String}
 */
function jsToSassVariables(obj) {
    const { stringify, parse } = JSON
  
    // remove null, undefined values and functions
    const objStr = stringify(obj)
  
    const objParsed = parse(objStr, (key, value) => {
      if (key.length === 0) return value
  
      // lists
      if (Array.isArray(value)) {
        return value.join(', ')
      }
  
      if (typeof value === 'number' || typeof value === 'boolean') {
        return value.toString()
      }
  
      // object to sass   map
      if (value instanceof Object) {
        let subkeys = '('
        subkeys += Object.keys(value)
          .map(subkey => `"${subkey}": ${value[subkey] || ''}`)
          .join(', ')
        subkeys += ')'
        return subkeys
      }
  
      // default
      return value
    })
  
    const objAsStrings = Object.keys(objParsed).map(varName => {
      return `$${varName}: unquote(${JSON.stringify(objParsed[varName])})`
    })
  
    const resString = objAsStrings.join('; ') + ';'
  
    return resString
  }
  
  module.exports = jsToSassVariables;