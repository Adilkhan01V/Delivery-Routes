import React, { useEffect, useState } from 'react';
import { 
  Route as RouteIcon, 
  Play, 
  Loader,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';
import { getDeliveries, optimizeRoute } from '../api';
import MapComponent from '../components/MapComponent';

const Routes = ({ addToast }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [center, setCenter] = useState([30.9010, 75.8573]);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const data = await getDeliveries();
      setDeliveries(data);
      setSelectedIds(data.map(d => d.id));
      const savedCenter = localStorage.getItem('mapCenter');
      if (savedCenter) {
        try {
          const {lat, lon} = JSON.parse(savedCenter);
          setCenter([parseFloat(lat), parseFloat(lon)]);
        } catch(e) {}
      } else if (data.length > 0) {
        const avgLat = data.reduce((sum, d) => sum + d.lat, 0) / data.length;
        const avgLon = data.reduce((sum, d) => sum + d.lon, 0) / data.length;
        setCenter([avgLat, avgLon]);
      }
    } catch (error) {
      addToast('Failed to load deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (selectedIds.length === 0) {
      addToast('Please select at least one delivery', 'warning');
      return;
    }

    setOptimizing(true);
    try {
      const data = await optimizeRoute(selectedIds);
      setRouteData(data);
      
      const visitedCount = data.order.length;
      if (visitedCount < selectedIds.length) {
        addToast(`Warning: Only ${visitedCount} of ${selectedIds.length} deliveries visited`, 'warning');
      } else {
        addToast(`Route optimized! ${visitedCount} deliveries planned.`, 'success');
      }
    } catch (error) {
      addToast('Failed to optimize route', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === deliveries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(deliveries.map(d => d.id));
    }
  };

  const selectedDeliveries = deliveries.filter(d => selectedIds.includes(d.id));

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">
              <MapPin size={24} />
            </div>
          </div>
          <div className="stat-value">{selectedIds.length}</div>
          <div className="stat-label">Selected Deliveries</div>
        </div>

        {routeData && (
          <>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon green">
                  <RouteIcon size={24} />
                </div>
              </div>
              <div className="stat-value">{routeData.order.length}</div>
              <div className="stat-label">Route Stops</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon orange">
                  <Clock size={24} />
                </div>
              </div>
              <div className="stat-value">{routeData.total_cost.toFixed(0)}</div>
              <div className="stat-label">Total Cost</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon purple">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="stat-value">{(routeData.total_cost / Math.max(routeData.order.length, 1)).toFixed(1)}</div>
              <div className="stat-label">Avg Cost/Stop</div>
            </div>
          </>
        )}
      </div>

      <div className="grid-2">
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Route Planning</h2>
            <button 
              className="btn btn-primary"
              onClick={handleOptimize}
              disabled={optimizing || selectedIds.length === 0}
            >
              {optimizing ? <Loader size={16} /> : <Play size={16} />}
              {optimizing ? 'Optimizing...' : 'Optimize Route'}
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {deliveries.map((delivery) => (
              <div 
                key={delivery.id}
                onClick={() => toggleSelection(delivery.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  background: selectedIds.includes(delivery.id) ? 'var(--bg-tertiary)' : 'transparent',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div 
                  className={`checkbox ${selectedIds.includes(delivery.id) ? 'checked' : ''}`}
                  style={{ flexShrink: 0 }}
                >
                  {selectedIds.includes(delivery.id) && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>Delivery #{delivery.id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {delivery.lat.toFixed(4)}, {delivery.lon.toFixed(4)}
                  </div>
                </div>
                <span className={`priority-badge priority-${delivery.priority}`}>
                  {delivery.priority.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={toggleAll}>
              {selectedIds.length === deliveries.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Map View</h2>
          </div>
          <div className="map-container-wrapper">
            <MapComponent 
              deliveries={selectedDeliveries}
              routeCoordinates={routeData?.coordinates}
              center={center}
            />
          </div>
        </div>
      </div>

      {routeData && (
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Route Details</h2>
          </div>
          <div className="route-info">
            <div className="route-info-item">
              <div className="route-info-value">{routeData.order.length}</div>
              <div className="route-info-label">Stops</div>
            </div>
            <div className="route-info-item">
              <div className="route-info-value">{routeData.total_cost.toFixed(2)}</div>
              <div className="route-info-label">Total Cost</div>
            </div>
            <div className="route-info-item">
              <div className="route-info-value">{routeData.coordinates?.length || 0}</div>
              <div className="route-info-label">Map Points</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routes;
