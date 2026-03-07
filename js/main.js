// Create the map
const map = L.map('map').setView([38.9, -77.03], 12);

// Basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Create names
const months = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
];


// Load GeoJSON data
fetch("data/crimeIncidents2025Final.geojson")
.then(response => response.json())
.then(data => {

    const geojsonLayer = L.geoJSON(data, {

        // Create proportional symbols
        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 0,
                className: "crime-circle"
            });
        },

        // Popups
        onEachFeature: (feature, layer) => {

            let popupContent = `<strong>${feature.properties.Neighborhood}</strong><br>`;

            months.forEach(month => {
                popupContent += `${month}: ${feature.properties[month]}<br>`;
            });

            layer.bindPopup(popupContent);
        }

    }).addTo(map);

    // Create slider + buttons
    createSequenceControls();

    // Initialize map
    updateSymbols(0, geojsonLayer);

    // Cache controls
    const slider = document.querySelector(".range-slider");
    const monthLabel = document.querySelector("#month-label");

    // Slider interaction
    slider.addEventListener("input", function () {
        const index = Number(this.value);
        updateSymbols(index, geojsonLayer);
        monthLabel.innerHTML = months[index];
    });

    // Forward button
    document.querySelector("#forward").addEventListener("click", () => {
        let index = Number(slider.value);
        index = (index + 1) % 12;
        slider.value = index;
        updateSymbols(index, geojsonLayer);
        monthLabel.innerHTML = months[index];
    });

    // Reverse button
    document.querySelector("#reverse").addEventListener("click", () => {
        let index = Number(slider.value);
        index = (index - 1 + 12) % 12;
        slider.value = index;
        updateSymbols(index, geojsonLayer);
        monthLabel.innerHTML = months[index];
    });

});

// Update circle sizes
function updateSymbols(monthIndex, layerGroup){
    const month = months[monthIndex];
    layerGroup.eachLayer(layer => {
        const count = layer.feature.properties[month] || 0;
        layer.setRadius(scaleRadius(count));
        layer.setStyle({
            fillOpacity: count > 0 ? 0.8 : 0
        });
    });
}

// Proportional scaling
function scaleRadius(count){
    return 4 + Math.sqrt(count);
}
// Slider controls
function createSequenceControls(){
    const SequenceControl = L.Control.extend({
        options: { position: 'bottomleft' },
        onAdd: function(){
            const container = L.DomUtil.create(
                'div',
                'sequence-control-container'
            );
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
    const slider = document.querySelector(".range-slider");
    slider.min = 0;
    slider.max = 11;
    slider.step = 1;
    slider.value = 0;
    document.querySelector("#month-label").innerHTML = months[0];

}

// Legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    const grades = [10, 30, 50, 70];
    div.innerHTML += "<h4>Crime Incidents</h4>";
    grades.forEach(value => {

    const radius = scaleRadius(value);
    div.innerHTML +=
        `<div class="legend-item">
            <span class="legend-circle" style="width:${radius*2}px;height:${radius*2}px"></span>
            > ${value}
        </div>`;
});
    return div;
};

legend.addTo(map);