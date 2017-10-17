var map;
var feature;
var scrolled=0;

function load_map(url_params) {

  var humanitarian = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '© Colaboradores de <a href="https://openstreetmap.org">OpenStreetMap</a>'
  });
  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© Colaboradores de <a href="https://openstreetmap.org">OpenStreetMap</a>'
  });
  var pub_transport = L.tileLayer('https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png', {
    attribution: '© Colaboradores de <a href="https://openstreetmap.org">OpenStreetMap</a>; Teselas © <a href="https://memomaps.de/">MeMoMaps</a>'
  });
  var new_transport = L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=760b39ce3c124042844d03e0f935bae9', {
    attribution: '© Colaboradores de <a href="https://openstreetmap.org">OpenStreetMap</a>; Teselas © <a href="https://thunderforest.com/">Gravitystorm</a>'
  });
  var mapbox = L.tileLayer('https://{s}.tiles.mapbox.com/v3/jaakkoh.map-4ch3dsvl/{z}/{x}/{y}.png', {
    attribution: '© Colaboradores de <a href="https://openstreetmap.org">OpenStreetMap</a>; Teselas © <a href="https://mapbox.com/">Mapbox</a>'
  });
  var osmsweden = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
    attribution: '© Colaboradores de <a href="https://openstreetmap.org">OpenStreetMap</a>; Teselas © <a href="https://https://openstreetmap.se/">OSM Suecia</a>'
  });

  var jawgmaps = L.tileLayer('https://{s}.tile.jawg.io/dark/{z}/{x}/{y}.png?api-key=community', {
    attribution: '© Colaboradores de <a href="https://openstreetmap.org">OpenStreetMap</a>; Teselas © <a href="https://https://openstreetmap.se/">OSM Dark (jawgmaps)</a>'
  });




  var baseLayers = {
    "Transporte público": pub_transport,
    "Humanitario": humanitarian,
    "OpenStreetMap": osm,
    "Mapbox": mapbox,
    "OSM Oscuro": jawgmaps,
  };

  // Initialize map
  map = new L.map('map', {
    center: [-27.3756,-55.9177],   
    zoom: 13,
    attributionControl: true,
    layers: baseLayers[url_params.layers] || jawgmaps
  });

  // Adding hash for position in url
  var hash = new L.Hash(map);

  // Adding attribution to desired position
  L.control.attribution({position: 'bottomleft'}).addTo(map);

  // Adding layer functionality
  var layers = L.control.activeLayers(baseLayers);
  layers.setPosition('bottomleft').addTo(map);

}

function get_params(search) {
  var params = {};

  search = (search || window.location.search).replace('?', '').split(/&|;/);

  for (var i = 0; i < search.length; ++i) {
    var pair = search[i],
    j = pair.indexOf('='),
    key = pair.slice(0, j),
    val = pair.slice(++j);
    params[key] = decodeURIComponent(val);
  }
  return params;
}

// Add / Update a key-value pair in the URL query parameters
function updateUrlParameter(uri, key, value) {
    // remove the hash part before operating on the uri
    var i = uri.indexOf('#');
    var hash = i === -1 ? ''  : uri.substr(i);
         uri = i === -1 ? uri : uri.substr(0, i);

    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (uri.match(re)) {
        uri = uri.replace(re, '$1' + key + "=" + value + '$2');
    } else {
        uri = uri + separator + key + "=" + value;
    }
    return uri + hash;  // finally append the hash as well
}


function toggleExtendedBusInfo() {
  if($(".info-wrapper").hasClass("normal")){
    openExtendedBusInfo();
  }
  else if ($(".info-wrapper").hasClass("expanded")){
    closeExtendedBusInfo();
  }
}

//
function openExtendedBusInfo() {
  $(".info-wrapper").removeClass("normal");
  $(".info-wrapper").addClass("expanded");
  $("#info-expander").removeClass("fa-chevron-down");
  $("#info-expander").addClass("fa-chevron-up");
}



//
function closeExtendedBusInfo() {

  $(".info-wrapper").removeClass("expanded");
  $(".info-wrapper").addClass("normal");
  $("#info-expander").removeClass("fa-chevron-up");
  $("#info-expander").addClass("fa-chevron-down");
}

function showBusInfo() {

  // Show and fill metadata in site
  if(!$(".info-wrapper").hasClass("normal")){
     $(".info-wrapper").addClass("normal");
  }
}



//
function zoomToNode(lat, lng) {

    closeExtendedBusInfo();

    // define geographical bounds
    var bounds = [[lng+0.0001, lat+0.0001], [lng-0.0001, lat-0.0001]];
    map.fitBounds(bounds);
    map.setZoom(18);
}



function loadBusRoute(busDetailLayerGroup, bus_number, category) {

  // Clear old bus line
  busDetailLayerGroup.clearLayers();

  // Define colors for transport categories
  var transportCategories = {

    'lines-troncales': '#FFFF00', // Amarillo
    'lines-circulares': '#1E90FF', // Celeste
    'lines-colectoras': '#7CFC00', // Verde
  }

  var myStyle = {
    color: transportCategories[category],

  }

  var geojsonMarkerOptions = {
    radius: 6,
    fillColor: "#fff",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 1,
    riseOnHover: true,
  };


  // Load data from file
  $.ajax({
    type: "GET",
    url: "data/" + bus_number + ".geojson",
    dataType: 'json',
    async: true,
    cache: true,
    success: function (response) {

      // Clean out meta data
      $(".stop-overview .variant-one h4").text();
      $(".stop-overview .variant-two h4").text();
      $(".stop-overview .variant-one ul").empty();

      // Define bus stop maker
      geojsonLayer = L.geoJson(response, {
          style: myStyle,
          pointToLayer: function (feature, latlng) {
            marker = L.circleMarker(latlng, geojsonMarkerOptions);
            return marker;
          },

          // Loop through bus route elements
          onEachFeature: function (feature, layer) {

            // If it's a bus stop
            if (feature.geometry.type == 'Point') {

              // Define content of popup
              layer.bindLabel(feature.properties.name, {noHide: false});

              // Create list of bus stops
              if (feature.properties.attributes.official_status == "bus_stop") {
                stopClass = "stop-official";
              }
              else if (feature.properties.attributes.official_status == "bus_station") {
                stopClass = "stop-station";
              }
              else if (feature.properties.attributes.official_status == "none") {
                stopClass = "stop-popular";
              }
              else {
                stopClass = "stop-undefined";
              }
              if (feature.properties.name === '') {
                feature.properties.name = '<span class="stop-unknown">Nombre desconocido</span>';
              }
              $('.stop-overview .variant-one ul').append('<li class="'+stopClass+'"><a href="#" onclick="zoomToNode('+feature.geometry.coordinates[0]+', '+feature.geometry.coordinates[1]+');return false;">'+feature.properties.name+'</a></li>');
            }

            // If it's the bus route
            else if (feature.geometry.type == 'LineString' || feature.geometry.type == 'MultiLineString') {

              showBusInfo();


              // Verificar si el valor de "ref" está definido
              if (typeof feature.properties !== "undefined" && typeof feature.properties.ref !== "undefined"){

              $(".info-wrapper .ref").text("Línea " + feature.properties.ref);

              // 
              } else {
                ref = feature.properties["@relations"][0].reltags.ref;
                $(".info-wrapper .ref").text("Línea " + ref);
              }

              // Verificar si el valor de "from" está definido
              if (typeof feature.properties !== "undefined" && typeof feature.properties.from !== "undefined"){

              $(".info-wrapper .from").text("Desde: " + feature.properties.from);

              // 
              } else {
                from = feature.properties["@relations"][0].reltags.from;
                $(".info-wrapper .from").text("Desde: " + from);
              }
    
             // Verificar si el valor de "to" está definido.
              if (typeof feature.properties !== "undefined" && typeof feature.properties.to !== "undefined"){

              $(".info-wrapper .to").text("Hasta: " + feature.properties.to);

              // 
              } else {
                to = feature.properties["@relations"][0].reltags.to;
                $(".info-wrapper .to").text("Hasta: " + to);
              }
 
             // Verificar si el valor de "operator" está definido.
              if (typeof feature.properties !== "undefined" && typeof feature.properties.operator !== "undefined"){

              $(".info-wrapper .operator").text("Operada por:  " + feature.properties.operator);

              // 
              } else {
                operator = feature.properties["@relations"][0].reltags.operator;
                $(".info-wrapper .operator").text(operator);
              }

              // BogoMap: Test if the from value is defined.
              if (typeof feature.properties.attributes !== "undefined" && typeof feature.properties.attributes.from !== "undefined" && typeof feature.properties.attributes.to !== "undefined"){

              $(".stop-overview .variant-one h4").text(feature.properties.attributes.from + " -> " + feature.properties.attributes.to);
              $(".stop-overview .variant-two h4").text(feature.properties.attributes.to + " -> " + feature.properties.attributes.from);

              // BogoMap
              } else {
                to = feature.properties["@relations"][0].reltags.to;
                from = feature.properties["@relations"][0].reltags.from;
                $(".stop-overview .variant-one h4").text(from + " -> " + to);
                $(".stop-overview .variant-two h4").text(to + " -> " + from);
              }

            }
        }});
        busDetailLayerGroup.addLayer(geojsonLayer);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(textStatus + " (1): " + errorThrown);
   }
  });

      // Load data from file
  $.ajax({
    type: "GET",
    url: "data/" + bus_number + ".geojson",
    dataType: 'json',
    async: true,
    cache: true,
    success: function (response) {

      // Clean out meta data
      $(".stop-overview .variant-two ul").empty();

      // Define bus stop maker
      geojsonLayer = L.geoJson(response, {
          style: myStyle,
          pointToLayer: function (feature, latlng) {
            marker = L.circleMarker(latlng, geojsonMarkerOptions);
            return marker;
          },

          // Loop through bus route elements
          onEachFeature: function (feature, layer) {

            // If it's a bus stop
            if (feature.geometry.type == 'Point') {

              // Define content of popup
              layer.bindLabel(feature.properties.name, {noHide: false});

              // Create list of bus stops
              if (feature.properties.attributes.official_status == "bus_stop") {
                stopClass = "stop-official";
              }
              else if (feature.properties.attributes.official_status == "bus_station") {
                stopClass = "stop-station";
              }
              else if (feature.properties.attributes.official_status == "none") {
                stopClass = "stop-popular";
              }
              else {
                stopClass = "stop-undefined";
              }

              if (feature.properties.name === '') {
                feature.properties.name = '<span class="stop-unknown">Nombre desconocido</span>';
              }
              $('.stop-overview .variant-two ul').append('<li class="'+stopClass+'"><a href="#" onclick="zoomToNode('+feature.geometry.coordinates[0]+', '+feature.geometry.coordinates[1]+');return false;">'+feature.properties.name+'</a></li>');
            }
        }});
        busDetailLayerGroup.addLayer(geojsonLayer);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(textStatus + " (2): " + errorThrown);
    }
  });
}

$(document).ready(function() {

  // Obtain parameters from url
  var url_params = get_params();

  // Load maps (with predefined route if given)
  load_map(url_params);
  var busDetailLayerGroup = new L.LayerGroup();
  busDetailLayerGroup.addTo(map);
  if (typeof url_params.ruta !== 'undefined') {
    bus_number = url_params.ruta;
    category = $(this).find(".ruta-" + url_params.ruta).attr("class").match(/\lines-\w+/i).pop();
    loadBusRoute(busDetailLayerGroup, bus_number, category);
  }

  // Show or hide extended bus info
  $("#info-expander ").click (function(e) {
    toggleExtendedBusInfo();

  });

  // Switch highligted bus route
  $(".bus-line-link").click (function(e) {

    // Do not reload page
    e.preventDefault();

    // Mark link as active
    $('a.bus-active').removeClass('bus-active');
    $(this).addClass('bus-active');


     // Update uri query parameters
    if (history.pushState) {
      uri = updateUrlParameter(window.location.href, 'ruta', this.text);
      window.history.pushState({path:uri},'',uri);
    }
    loadBusRoute(busDetailLayerGroup, this.text, $(this).attr("class").match(/\lines-\w+/i));
  });


  // Allow scrolling through bus route navigation by buttons
  $("#bus-lines-control-top").on("click" ,function(){
    scrolled=scrolled+240;
    $("#bus-lines").animate({
      scrollTop:  scrolled
    });
  });

  $("#bus-lines-control-bottom").on("click" ,function(){
    scrolled=scrolled-240;
    $("#bus-lines").animate({
      scrollTop:  scrolled
    });
  });
});
