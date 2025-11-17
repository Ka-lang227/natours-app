import mapboxgl from 'mapbox-gl';

export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoia2F5LXBlZSIsImEiOiJjbWZxdHlvM2EwMjFvMmpzY2hjZ3lpN3h1In0.YKJQvTOmJ25xaM1_lAPp8g';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/kay-pee/cmfqvc1rg00iw01s46dmcbmkx',
        scrollZoom: false
    });
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((loc) => {
        // Create Marker Element 
        const el = document.createElement('div');
        el.className = 'marker';

        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates)
            .addTo(map);

        //Create Marker popup 
        const popup = new mapboxgl.Popup({
            offset: 30, 
            closeOnClick: false
        }).setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);

        el.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent map click event from triggering 
            popup.addTo(map).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`);
        });

            //Extend map bounds 
        bounds.extend(loc.coordinates);

    });
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });

    // Prevent popup from closing when clicking the map
    map.on('click', (e) => {
        // Do nothing — this overrides the default close behavior
    });
};