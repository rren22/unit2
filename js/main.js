// create the map
var map = L.map('map').setView([38.9, -77.03], 12);

// add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// load data
fetch("data/crimeIncidents2025.geojson")
.then(response => response.json())
.then(data => {

    // process dates
    var dates = processData(data);

    // create layer
    var geojsonLayer = L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 4,
                fillOpacity: 0.8,
                color: "black",
                weight: 1
            });
        },
        onEachFeature: function(feature, layer) {
            let popupContent = "";
            for (let key in feature.properties) {
                popupContent += "<strong>" + key + ":</strong> " +
                                feature.properties[key] + "<br>";
            }
            layer.bindPopup(popupContent);
        }
    }).addTo(map);

    // create controls
    createSequenceControls(dates);

    // initialize first date
    updateSymbols(dates[0], geojsonLayer);

    // add slider events
    var slider = document.querySelector(".range-slider");

    slider.addEventListener("input", function() {
        updateSymbols(dates[this.value], geojsonLayer);
    });

    document.querySelector("#forward").addEventListener("click", function() {
        var index = Number(slider.value);
        index = (index + 1) % dates.length;
        slider.value = index;
        updateSymbols(dates[index], geojsonLayer);
    });

    document.querySelector("#reverse").addEventListener("click", function() {
        var index = Number(slider.value);
        index = (index - 1 + dates.length) % dates.length;
        slider.value = index;
        updateSymbols(dates[index], geojsonLayer);
    });

})
.catch(error => console.log(error));

function updateSymbols(date, layerGroup) {

    layerGroup.eachLayer(function(layer) {

        if (layer.feature.properties.REPORT_DAT === date) {
            layer.setStyle({ fillOpacity: 0.8 });
        } else {
            layer.setStyle({ fillOpacity: 0 });
        }

    });
}
function processData(data) {
    var dates = [];

    data.features.forEach(function(feature) {
        var date = feature.properties.REPORT_DAT;
        if (dates.indexOf(date) === -1) {
            dates.push(date);
        }
    });

    dates.sort();
    return dates;
}

function createSequenceControls(dates) {

    var SequenceControl = L.Control.extend({
        options: { position: 'bottomleft' },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'sequence-control-container');

            container.innerHTML =
                '<button class="step" id="reverse">Reverse</button>' +
                '<input class="range-slider" type="range">' +
                '<button class="step" id="forward">Forward</button>';

            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());

    var slider = document.querySelector(".range-slider");
    slider.max = dates.length - 1;
    slider.min = 0;
    slider.value = 0;
}