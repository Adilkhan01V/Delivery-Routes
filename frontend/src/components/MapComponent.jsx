import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Priorities
const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  high: createIcon('red'),
  medium: createIcon('orange'),
  low: createIcon('green'),
};

// Component to auto-center map when bounds change
function RecenterMap({ center }) {
  const map = useMap();
  if (center) {
    map.setView(center, 13);
  }
  return null;
}

const MapComponent = ({ deliveries, routeCoordinates, center }) => {
  return (
    <div className="map-container">
      <MapContainer center={center || [30.9010, 75.8573]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Recenter Map Component */}
        {center && <RecenterMap center={center} />}

        {/* Delivery Markers */}
        {deliveries.map((delivery) => (
          <Marker
            key={delivery.id}
            position={[delivery.lat, delivery.lon]}
            icon={icons[delivery.priority] || DefaultIcon}
          >
            <Popup>
              <div className="popup-content">
                <h3>Delivery #{delivery.id}</h3>
                <p><strong>Deadline:</strong> {delivery.deadline_min} mins</p>
                <p><strong>Priority:</strong> <span className={`priority-${delivery.priority}`}>{delivery.priority.toUpperCase()}</span></p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Polyline */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates.map(c => [c.lat, c.lon])}
            color="#3498db"
            weight={5}
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
