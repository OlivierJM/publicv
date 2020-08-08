
let map, nav, center;
let markers = [];

//Define the map and configure the map's theme
window.initMap = function () {
  center = mapCenterCoordinates()
  console.log(center)

  $('#map').each((_, mapElement) => {
    map = new mapboxgl.Map({
      container: mapElement,
      attributionControl: false, //need this to show a compact attribution icon (i) instead of the whole text
      style: unwired.getLayer("streets"), //get Unwired's style template
      maxZoom: 11,
      zoom: 11,
      center: center
    });

    //Add Navigation controls to the map to the top-right corner of the map
    nav = new mapboxgl.NavigationControl();
    map.addControl(nav, 'top-left');

    //Adding code for cluster**********
    map.on('load', function () {
      // Add a new source from our GeoJSON data and
      // set the 'cluster' option to true. GL-JS will
      // add the point_count property to your source data.
      map.addSource('cluster_marker', {
        type: 'geojson',
        data: cluster_data(),
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
      });


      clusterLayer() //cluster make circle on the base of distance
      clusterCountLayer()  // showing the number on cluster
      unclusteredPointLayer()  // uncluster coordinates
      clusterOnClick() // inspect a cluster on click   

      map.on('mouseenter', 'clusters', function () {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', function () {
        map.getCanvas().style.cursor = '';
      });
    });
    //Adding code for cluster************
  });

  if (isHomePage()) map.scrollZoom.disable();
  multiTouchSupport() // disable drapPan for mobile on single touch
};

function clusterLayer() {
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'cluster_marker',
    filter: ['has', 'point_count'],
    paint: {
      // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        100,
        '#f1f075',
        750,
        '#f28cb1'
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        100,
        30,
        750,
        40
      ]
    }
  });
}

function clusterCountLayer() {
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'cluster_marker',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  });
}

function unclusteredPointLayer() {
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'cluster_marker',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 4,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });
}

function clusterOnClick() {
  map.on('click', 'clusters', function (e) {
    var features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    });
    var clusterId = features[0].properties.cluster_id;
    map.getSource('cluster_marker').getClusterExpansionZoom(
      clusterId,
      function (err, zoom) {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      }
    );
  });
}


function cluster_data() {
  let all_data = {
    "type": "FeatureCollection",
    "features": [

      { "geometry": { "coordinates": [75.851601, 30.9090157] } },

      { "geometry": { "coordinates": [85.1235252, 25.6093239] } },

      { "geometry": { "coordinates": [77.2219388, 28.6517178] } },

      { "geometry": { "coordinates": [76.0484147, 30.450764] } },

      { "geometry": { "coordinates": [80.9346001, 26.8381] } }

    ]
  }

  return all_data
}

window.generateClusterMarkers = function (searchClusterResultsList) {
  searchClusterResultsList.forEach(entry => {
    let coordinates = Object.values(entry.location); // coordinates
    let el = document.createElement('div'); // creating marker
    el.className = 'marker';
    markers.push(
      new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .addTo(map)
    );

  });
  centerMap();
};

window.generateMarkers = function (searchResultsList) {
  clearMarkers();
  searchResultsList.forEach(entry => {
    let coordinates = Object.values(entry.location); // coordinates
    let el = document.createElement('div'); // creating marker
    el.className = 'marker';

    let popup = new mapboxgl.Popup()
      .setHTML('<b>' + entry.name + '</b>'); // Popup with user name

    markers.push(
      new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map)
    );
  });

  centerMap();
};

function centerMap() {
  if (markers.length > 0) {
    const bounds = new mapboxgl.LngLatBounds();
    markers.forEach(marker => {
      bounds.extend(marker.getLngLat());
    });
    map.setMaxZoom(10);
    map.fitBounds(bounds);
  }
}

function clearMarkers() {
  markers.forEach(marker => {
    marker.remove();
  });
  markers = [];
}

function multiTouchSupport() {
  if ($(window).width() < 767) {

    map.dragPan.disable();
    map.scrollZoom.disable();

    map.on('touchstart', event => {
      const e = event.originalEvent;
      if (e && 'touches' in e) {
        if (e.touches.length > 1) {
          map.dragPan.enable();
        } else {
          map.dragPan.disable();
        }
      }
    });
  }
}

//Add your Unwired Maps Access Token here (not the API token!)
function setUnwiredApiToken(token) {
  unwired.key = mapboxgl.accessToken = token;
}

function loadMarkersFromPage() {
  if (window.searchResultsList.length > 0) generateMarkers(window.searchResultsList)
}

function loadClusterMarkerFromPage() {
  if (window.searchClusterResultsList.length > 0) generateClusterMarkers(window.searchClusterResultsList)

}

function mapCenterCoordinates() {
  return window.currentLatLng || [78.4008997, 17.4206485]
}

function isHomePage() {
  return location.pathname == "/"; // Equals true if we're at the root
}

$(document).on('turbolinks:load', () => {
  if ('mapboxgl' in window) {
    initMap();
  }
});

window.setUnwiredApiToken = setUnwiredApiToken;
