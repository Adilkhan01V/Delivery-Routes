import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, MapPin } from 'lucide-react';

const Settings = ({ addToast, onLocationUpdated }) => {
  const [settings, setSettings] = useState(() => {
    const savedCity = localStorage.getItem('mapCity');
    const savedCenterStr = localStorage.getItem('mapCenter');
    let lat = null, lon = null;
    if (savedCenterStr) {
      try {
        const parsed = JSON.parse(savedCenterStr);
        lat = parsed.lat;
        lon = parsed.lon;
      } catch (e) {}
    }
    return {
      city: savedCity || 'Ludhiana, Punjab, India',
      defaultDeliveries: 20,
      maxDeliveries: 100,
      vehicleCapacity: 100,
      optimizationPreference: 'fast',
      lat,
      lon
    };
  });

  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error("Geocoding failed", e);
    }
  };

  const handleCityChange = (e) => {
    const val = e.target.value;
    setSettings({ ...settings, city: val, lat: null, lon: null });
    setShowSuggestions(true);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 500);
  };

  const handleSelectSuggestion = (suggestion) => {
    setSettings({
      ...settings,
      city: suggestion.display_name,
      lat: suggestion.lat,
      lon: suggestion.lon
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };


  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('mapCity', settings.city);
      if (settings.lat && settings.lon) {
        localStorage.setItem('mapCenter', JSON.stringify({ lat: settings.lat, lon: settings.lon }));
        if (onLocationUpdated) onLocationUpdated();
      }
      setSaving(false);
      addToast('Settings saved successfully', 'success');
    }, 500);
  };

  const handleReset = () => {
    setSettings({
      city: 'Ludhiana, Punjab, India',
      defaultDeliveries: 20,
      maxDeliveries: 100,
      vehicleCapacity: 100,
      optimizationPreference: 'fast',
      lat: null,
      lon: null
    });
    localStorage.removeItem('mapCity');
    localStorage.removeItem('mapCenter');
    if (onLocationUpdated) onLocationUpdated();
    addToast('Settings reset to defaults', 'success');
  };

  return (
    <div className="page-content">
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">General Settings</h2>
        </div>

        <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
          <div className="input-group" style={{ position: 'relative' }}>
            <label className="input-label">City / Region (in India)</label>
            <input
              type="text"
              className="input-field"
              value={settings.city}
              onChange={handleCityChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginTop: '4px',
                zIndex: 10,
                boxShadow: 'var(--shadow-md)',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {suggestions.map((s, i) => (
                  <div 
                    key={i} 
                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '8px' }}
                    onClick={() => handleSelectSuggestion(s)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin size={14} style={{ marginTop: '2px', color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.875rem' }}>{s.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Default Delivery Count</label>
            <input
              type="number"
              className="input-field"
              min="1"
              max="100"
              value={settings.defaultDeliveries}
              onChange={(e) => setSettings({ ...settings, defaultDeliveries: parseInt(e.target.value) })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Maximum Deliveries</label>
            <input
              type="number"
              className="input-field"
              min="1"
              max="500"
              value={settings.maxDeliveries}
              onChange={(e) => setSettings({ ...settings, maxDeliveries: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Optimization Settings</h2>
        </div>

        <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
          <div className="input-group">
            <label className="input-label">Vehicle Capacity</label>
            <input
              type="number"
              className="input-field"
              min="1"
              value={settings.vehicleCapacity}
              onChange={(e) => setSettings({ ...settings, vehicleCapacity: parseInt(e.target.value) })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Optimization Preference</label>
            <select
              className="input-field"
              value={settings.optimizationPreference}
              onChange={(e) => setSettings({ ...settings, optimizationPreference: e.target.value })}
            >
              <option value="fast">Fast (Lower Quality)</option>
              <option value="balanced">Balanced</option>
              <option value="quality">Quality (Slower)</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={handleReset}>
          <RefreshCw size={16} />
          Reset
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={16} className="spinner" /> : <Save size={16} />}
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
