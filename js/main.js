// Global State
let highlightChange = false;
const changeThreshold = 0.03; // 3% change threshold

// Set map
const map = L.map('map', {
    minZoom: 11,
    maxZoom: 15,
    maxBounds: [
        [38.79, -77.12],
        [39.00, -76.90]
    ],
    maxBoundsViscosity: 1.0
}).setView([38.9, -77.03], 12);

// Basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    opacity: 0.9
}).addTo(map);

// Months
const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
];

// Legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = "<h4>% of Annual Crime</h4>";
    return div;
};
legend.addTo(map);

// Load Data
fetch("data/crimeIncidents2025Final.geojson")
.then(res => res.json())
.then(data => {

    const geojsonLayer = L.geoJSON(data, {

        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 0,
                className: "crime-circle"
            });
        },

        onEachFeature: (feature, layer) => {

            let popupContent = `<strong>${feature.properties.Neighborhood}</strong><br>`;

            let total = 0;
            months.forEach(m => total += feature.properties[m] || 0);

            months.forEach(month => {
                const count = feature.properties[month] || 0;
                const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                popupContent += `${month}: ${count} (${percent}%)<br>`;
            });

            layer.bindPopup(popupContent);
        }

    }).addTo(map);

    createSequenceControls();

    updateSymbols(0, geojsonLayer);
    updateLegend(0, data);

    const slider = document.querySelector(".range-slider");
    const monthLabel = document.querySelector("#month-label");

    // Slider
    slider.addEventListener("input", function () {
        const index = Number(this.value);
        updateSymbols(index, geojsonLayer);
        updateLegend(index, data);
        monthLabel.innerHTML = months[index];
    });

    // Forward
    document.querySelector("#forward").addEventListener("click", () => {
        let index = Number(slider.value);
        index = (index + 1) % 12;
        slider.value = index;
        updateSymbols(index, geojsonLayer);
        updateLegend(index, data);
        monthLabel.innerHTML = months[index];
    });

    // Reverse
    document.querySelector("#reverse").addEventListener("click", () => {
        let index = Number(slider.value);
        index = (index - 1 + 12) % 12;
        slider.value = index;
        updateSymbols(index, geojsonLayer);
        updateLegend(index, data);
        monthLabel.innerHTML = months[index];
    });

    // Change filter 
    document.querySelector("#filter").addEventListener("click", () => {
        highlightChange = !highlightChange;

        document.querySelector("#filter").innerHTML =
            highlightChange ? "Show All" : "Highlight Change";

        const index = Number(slider.value);
        updateSymbols(index, geojsonLayer);
        updateLegend(index, data);
    });

});

// Update symbols
function updateSymbols(monthIndex, layerGroup){
    const month = months[monthIndex];

    layerGroup.eachLayer(layer => {
        const props = layer.feature.properties;

        // total
        let total = 0;
        months.forEach(m => total += props[m] || 0);

        const current = props[month] || 0;
        const prevMonth = months[(monthIndex - 1 + 12) % 12];
        const prev = props[prevMonth] || 0;

        const rate = total > 0 ? current / total : 0;

        // change calculation
        const change = total > 0 ? Math.abs((current - prev) / total) : 0;

        // apply change filter
        if (highlightChange && change < changeThreshold) {
            layer.setStyle({ fillOpacity: 0, opacity: 0 });
            return;
        }

        layer.setRadius(scaleRadius(rate * 200));

        layer.setStyle({
            fillOpacity: 0.8,
            opacity: 1,
            color: highlightChange && change >= changeThreshold ? "#000" : "#5A0000"
        });
    });
}

// Scale
function scaleRadius(value){
    return 4 + Math.sqrt(value);
}

// Legend
function updateLegend(monthIndex, data){
    const month = months[monthIndex];

    const values = data.features.map(f => {
        let total = 0;
        months.forEach(m => total += f.properties[m] || 0);
        return total > 0 ? (f.properties[month] / total) : 0;
    });

    const max = Math.max(...values);

    const grades = [max*0.25, max*0.5, max*0.75, max];

    const div = document.querySelector(".legend");

    div.innerHTML = highlightChange
        ? "<h4>% of Annual Crime (High Change)</h4>"
        : "<h4>% of Annual Crime</h4>";

    grades.forEach(value => {
        const radius = scaleRadius(value * 200);
        const percent = (value * 100).toFixed(1);

        div.innerHTML +=
            `<div class="legend-item">
                <span class="legend-circle"
                style="width:${radius*2}px;height:${radius*2}px"></span>
                ${percent}%
            </div>`;
    });
}

// Controls
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
                '<button class="step" id="filter">Highlight Change</button>' +
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