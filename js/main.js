// create the map
var map = L.map('map').setView([38.9, -77.03], 12);

// add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// month names
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// load data
fetch("data/CrimeIncidents2025Final.geojson")
.then(response => response.json())
.then(data => {

    // create layer
    var geojsonLayer = L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 0, // initial radius, updated by slider
                fillOpacity: 0.8,
                color: "black",
                weight: 1
            });
        },
        onEachFeature: function(feature, layer) {
            let popupContent = "<strong>" + feature.properties.Neighborhood + "</strong><br>";
            months.forEach(m => {
                popupContent += m + ": " + feature.properties[m] + "<br>";
            });
            layer.bindPopup(popupContent);
        }
    }).addTo(map);

    // create controls
    createSequenceControls();

    // initialize first month
    updateSymbols(0, geojsonLayer);

    // slider events
    var slider = document.querySelector(".range-slider");

    slider.addEventListener("input", function() {
        updateSymbols(Number(this.value), geojsonLayer);
    });

    document.querySelector("#forward").addEventListener("click", function() {
        var index = Number(slider.value);
        index = (index + 1) % 12;
        slider.value = index;
        updateSymbols(index, geojsonLayer);
    });

    document.querySelector("#reverse").addEventListener("click", function() {
        var index = Number(slider.value);
        index = (index - 1 + 12) % 12;
        slider.value = index;
        updateSymbols(index, geojsonLayer);
    });

});

// update circle sizes based on month
function updateSymbols(monthIndex, layerGroup) {
    var month = months[monthIndex];
    layerGroup.eachLayer(function(layer) {
        var count = layer.feature.properties[month] || 0;
        layer.setStyle({
            radius: scaleRadius(count),
            fillOpacity: count > 0 ? 0.8 : 0
        });
    });
}

// proportional scaling function
function scaleRadius(count) {
    return 4 + Math.sqrt(count); // sqrt for better visual scaling
}

// Sequence controls (month slider)
function createSequenceControls() {
    var SequenceControl = L.Control.extend({
        options: { position: 'bottomleft' },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'sequence-control-container');

            container.innerHTML =
                '<button class="step" id="reverse">Reverse</button>' +
                '<input class="range-slider" type="range">' +
                '<button class="step" id="forward">Forward</button>' +
                '<div id="month-label"></div>';

            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());

    var slider = document.querySelector(".range-slider");
    slider.max = 11;
    slider.min = 0;
    slider.value = 0;
    slider.step = 1;

    // update label
    slider.addEventListener("input", function() {
        document.querySelector("#month-label").innerHTML = months[this.value];
    });
    document.querySelector("#month-label").innerHTML = months[0];
}