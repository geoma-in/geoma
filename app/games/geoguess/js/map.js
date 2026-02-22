/* Map module: loads GeoJSON and exposes highlight/reset utilities */
(function(window){
  // OPTIMIZATION: Pre-computed style objects (avoid recreating on each call)
  const STYLES = {
    default: { color: '#888', weight: 1, fillColor: '#ddd', fillOpacity: 0 },
    highlight: { color: '#f39c12', weight: 4, fillColor: '#f39c12', fillOpacity: 0.18 },
    correct: { color: '#1e8449', weight: 4, fillColor: '#2ecc71', fillOpacity: 0.2 },
    adjoining: { color: '#3498db', weight: 2, fillColor: '#3498db', fillOpacity: 0.25 }
  }
  
  // OPTIMIZATION: State-to-indices map for O(1) lookups instead of O(n)
  let stateIndex = {}
  
  // OPTIMIZATION: Cache layer visibility state to avoid redundant DOM ops
  let visibleState = null
  
  // OPTIMIZATION: Debounce timer for batched visibility updates
  let visibilityUpdatePending = false
  
  const MapModule = { map: null, geoLayer: null, features: [], layers: [], isReady: false }

  function buildStateIndex(){
    // Pre-compute which districts belong to each state
    stateIndex = {}
    MapModule.features.forEach((f, i) => {
      const state = f.properties.stat_name || f.properties.state || ''
      if(!stateIndex[state]) stateIndex[state] = []
      stateIndex[state].push(i)
    })
    console.log('MapModule: built state index with', Object.keys(stateIndex).length, 'states')
  }

  function init(){
    return new Promise((resolve,reject)=>{
      // If map already created, return existing instance to avoid re-initialization error
      if(MapModule.map){
        console.log('MapModule: init called but map already initialized')
        resolve(MapModule)
        return
      }
      MapModule.map = L.map('map',{zoomControl:true}).setView([22.5,80],5)
      // Use satellite imagery as basemap
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
        maxZoom: 10,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
      }).addTo(MapModule.map)

      fetch('/app/games/data/india_districts.geojson').then(r=>r.json()).then(geojson=>{
        // Incoming GeoJSON is expected to be in WGS84 (EPSG:4326).
        // No reprojection will be performed; ensure your source is lat/lng.
        MapModule.features = geojson.features || []
        console.log('MapModule: loaded geojson, features=', MapModule.features.length)
        if(MapModule.features.length>0){
          console.log('Sample properties keys:', Object.keys(MapModule.features[0].properties || {}))
        }
        // Create GeoJSON layer and add to map to trigger onEachFeature callback
        // This populates MapModule.layers with all individual district layers
        MapModule.geoLayer = L.geoJSON(geojson,{
          style: () => STYLES.default,
          onEachFeature: onEach
        }).addTo(MapModule.map)
        
        // OPTIMIZATION: Build state index for O(1) lookups
        buildStateIndex()
        
        // OPTIMIZATION: Mark module as ready for game logic
        MapModule.isReady = true
        
        // fit map to layer bounds if available (deferred to next frame)
        requestAnimationFrame(() => {
          try{ const b = MapModule.geoLayer.getBounds(); if(b && b.isValid()) MapModule.map.fitBounds(b) }catch(e){}
        })
        resolve(MapModule)
      }).catch(err=>{
        console.error('MapModule: failed to load geojson', err)
        reject(err)
      })
    })
  }

  function defaultStyle(){
    // transparent fill so basemap imagery remains visible; thin neutral stroke
    return STYLES.default
  }

  function highlightStyle(){
    // bold stroke and slight translucent fill to show highlight
    return STYLES.highlight
  }

  function correctStyle(){
    // green bold stroke and translucent fill for correct answer
    return STYLES.correct
  }

  function onEach(feature,layer){
    const idx = MapModule.layers.length
    feature.properties._idx = idx
    MapModule.layers.push(layer)
    layer.setStyle(defaultStyle())
  }

  function resetStyles(){
    MapModule.layers.forEach(l=>{ if(l.setStyle) l.setStyle(STYLES.default); if(l.bringToBack) l.bringToBack() })
    // Clear any district labels from previous round
    if(MapModule.labels){
      MapModule.labels.forEach(label => MapModule.map.removeLayer(label))
      MapModule.labels = []
    }
  }

  function setVisibleState(stateName){
    // OPTIMIZATION: Skip update if already visible (prevent redundant DOM ops)
    if(visibleState === stateName) return
    visibleState = stateName
    
    // OPTIMIZATION: Use requestAnimationFrame to batch visibility updates
    if(!visibilityUpdatePending){
      visibilityUpdatePending = true
      requestAnimationFrame(() => {
        const stateIndices = stateIndex[stateName] || []
        
        // Only iterate through states that need changes
        const states = Object.keys(stateIndex)
        for(let s = 0; s < states.length; s++){
          const state = states[s]
          const indices = stateIndex[state]
          if(state === stateName){
            // Add layers for current state
            for(let i = 0; i < indices.length; i++){
              const layer = MapModule.layers[indices[i]]
              if(layer && !MapModule.map.hasLayer(layer)) MapModule.map.addLayer(layer)
            }
          } else {
            // Remove layers for other states
            for(let i = 0; i < indices.length; i++){
              const layer = MapModule.layers[indices[i]]
              if(layer && MapModule.map.hasLayer(layer)) MapModule.map.removeLayer(layer)
            }
          }
        }
        visibilityUpdatePending = false
      })
    }
  }

  function labelDistrict(idx, districtName){
    // OPTIMIZATION: Defer label creation to avoid blocking map interaction
    requestAnimationFrame(() => {
      const layer = MapModule.layers[idx]
      if(!layer) return
      try{
        const bounds = layer.getBounds()
        const center = bounds.getCenter()
        const label = L.marker(center, {
          icon: L.divIcon({
            className: 'district-label-correct',
            html: `<div style="background:#2ecc71;color:#fff;padding:3px 6px;border-radius:4px;font-weight:bold;font-size:12px;border:2px solid #1e8449;">${districtName}</div>`,
            iconSize: null,
            popupAnchor: [0, -10]
          })
        }).addTo(MapModule.map)
        if(!MapModule.labels) MapModule.labels = []
        MapModule.labels.push(label)
      } catch(e){ console.log('Error labeling district', districtName, e) }
    })
  }

  function highlightIndex(idx) {
    resetStyles();
    const layer = MapModule.layers[idx];
    if (layer && layer.setStyle) {
      layer.setStyle(STYLES.highlight);
      if (layer.bringToFront) layer.bringToFront();
      
      try {
        MapModule.map.fitBounds(layer.getBounds(), {
          maxZoom: 9,
          // Offset for mobile UI: 320px represents the height of the bottom sheet
          paddingBottomRight: [0, 320], 
          padding: [20, 20]
        });
      } catch (e) { console.error("Zoom error", e); }
    }
  }

  function highlightDistrict(idx) {
    resetStyles();
    const feature = MapModule.features[idx];
    if (!feature) return;

    const stateName = (feature.properties.stat_name || feature.properties.state || '').toUpperCase();
    const currentLayer = MapModule.layers[idx];
    
    if (currentLayer && currentLayer.setStyle) {
      currentLayer.setStyle(STYLES.highlight);
      if (currentLayer.bringToFront) currentLayer.bringToFront();
    }

    const stateIndices = stateIndex[stateName] || [];

    if (stateIndices.length > 0) {
      requestAnimationFrame(() => {
        const group = L.featureGroup();
        stateIndices.forEach(i => {
          if (MapModule.layers[i]) group.addLayer(MapModule.layers[i]);
        });
        // centering without offsets since the map container itself is now the correct size
        MapModule.map.fitBounds(group.getBounds(), { maxZoom: 8, padding: [20, 20] });
      });
    }
  }

  function markCorrect(idx){
    const layer = MapModule.layers[idx]
    if(layer && layer.setStyle){
      layer.setStyle(STYLES.correct)
      if(layer.bringToFront) layer.bringToFront()
    }
  }

  function showAdjoiningDistricts(idx){
    // OPTIMIZATION: Use state index instead of re-filtering all features
    const feature = MapModule.features[idx]
    if(!feature) return
    const stateName = feature.properties.stat_name || feature.properties.state || ''
    
    // Get indices from pre-computed state index, exclude current district
    const stateIndices = (stateIndex[stateName] || []).filter(i => i !== idx)
    
    stateIndices.forEach(i => {
      const layer = MapModule.layers[i]
      if(layer && layer.setStyle){
        layer.setStyle(STYLES.adjoining)
      }
    })
  }

  function labelAdjoiningDistricts(idx){
    // OPTIMIZATION: Defer label creation to avoid blocking map interaction
    requestAnimationFrame(() => {
      const feature = MapModule.features[idx]
      if(!feature) return
      const stateName = feature.properties.stat_name || feature.properties.state || ''
      
      // Get indices from pre-computed state index, exclude current district
      const stateIndices = (stateIndex[stateName] || []).filter(i => i !== idx)
      
      // OPTIMIZATION: Batch label operations
      const labelsToAdd = []
      
      for(let i = 0; i < stateIndices.length; i++){
        const distIdx = stateIndices[i]
        const f = MapModule.features[distIdx]
        const layer = MapModule.layers[distIdx]
        if(layer){
          try{
            const bounds = layer.getBounds()
            const center = bounds.getCenter()
            const name = Utils.getDistrictName(f.properties)
            const label = L.marker(center, {
              icon: L.divIcon({
                className: 'district-label',
                html: `<div style="background:#fff;padding:2px 4px;border-radius:3px;font-weight:bold;font-size:11px;border:1px solid #333;">${name}</div>`,
                iconSize: null,
                popupAnchor: [0, -10]
              })
            }).addTo(MapModule.map)
            labelsToAdd.push(label)
          } catch(e){ }
        }
      }
      if(!MapModule.labels) MapModule.labels = []
      MapModule.labels.push(...labelsToAdd)
    })
  }

  // expose the internal MapModule object (contains features, layers, and methods)
  MapModule.init = init
  MapModule.highlightIndex = highlightIndex
  MapModule.highlightDistrict = highlightDistrict
  MapModule.resetStyles = resetStyles
  MapModule.markCorrect = markCorrect
  MapModule.showAdjoiningDistricts = showAdjoiningDistricts
  MapModule.labelAdjoiningDistricts = labelAdjoiningDistricts
  MapModule.setVisibleState = setVisibleState
  MapModule.labelDistrict = labelDistrict
  MapModule.labels = []
  window.MapModule = MapModule
})(window)
