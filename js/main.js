// create the map
var map = L.map('map').setView([38.9, -77.03],12);

// add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; OpenStreetMap contributors'}).addTo(map);

// load my data
fetch("data/crimeIncidents2025.geojson")
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function(feature) {
                return {
                    color: "blue",
                    weight: 2,
                    fillOpacity: 0.5
                };
            },
            onEachFeature: function(feature, layer) {
                let popupContent = "";
                for (let key in feature.properties) {
                    popupContent += "<strong>" + key + ":</strong>" + feature.properties[key] + "<br>";
                }

                layer.bindPopup(popupContent);
            }
        }).addTo(map);
    })

.catch(error => console.log(error));
