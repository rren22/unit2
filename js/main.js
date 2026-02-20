// create the map
var map = L.map('map').setView([43.65, -79.28],11);

// add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; OpenStreetMap contributors'}).addTo(map);

// load my data
fetch("data/cybersecurity.geojson")
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
