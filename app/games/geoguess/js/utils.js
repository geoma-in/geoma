// Utility helpers
function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]]
  }
  return array
}

function pickWrongOptions(allNames, correctName, count){
  const pool = allNames.filter(n=>n!==correctName)
  shuffle(pool)
  return pool.slice(0,count)
}

function getDistrictName(props) {
  // Directly targeting your GeoJSON keys
  return props.dist_name || props.DIST_NAME || '';
}

function getStateName(props) {
  return props.stat_name || props.STAT_NAME || '';
}

// Function to turn "ANANTNAG" into "Anantnag"
function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// OPTIMIZATION: Memoize property extraction with simple cache
const nameCache = new Map()
function getCachedName(props, extractor){
  if(!props) return ''
  const key = props // Use object reference as key
  if(nameCache.has(key)){
    return nameCache.get(key)
  }
  const result = extractor(props)
  nameCache.set(key, result)
  return result
}

window.Utils = { shuffle, pickWrongOptions, getDistrictName, getStateName, toTitleCase };
