import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  RefreshCw, 
  Check, 
  MapPin,
  Loader,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { getDeliveries, generateDeliveries } from '../api';

const Deliveries = ({ addToast }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const data = await getDeliveries();
      setDeliveries(data);
      setSelectedIds(data.map(d => d.id));
    } catch (error) {
      addToast('Failed to load deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomize = async (count) => {
    setGenerating(true);
    try {
      await generateDeliveries(count);
      await fetchDeliveries();
      addToast(`Generated ${count} new deliveries`, 'success');
    } catch (error) {
      addToast('Failed to generate deliveries', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedDeliveries = useMemo(() => {
    let result = [...deliveries];
    
    if (searchQuery) {
      result = result.filter(d => 
        d.id.toString().includes(searchQuery) ||
        d.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.deadline_min.toString().includes(searchQuery)
      );
    }
    
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [deliveries, searchQuery, sortConfig]);

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

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Delivery Management</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => handleRandomize(20)}
              disabled={generating}
            >
              {generating ? <Loader size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        <div className="action-bar">
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by ID, priority, or deadline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={toggleAll}>
            <Check size={16} />
            {selectedIds.length === deliveries.length ? 'Deselect All' : 'Select All'}
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span className="counter-badge">{selectedIds.length}</span> selected
          </span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <div 
                    className={`checkbox ${selectedIds.length === deliveries.length ? 'checked' : ''}`}
                    onClick={toggleAll}
                  >
                    {selectedIds.length === deliveries.length && <Check size={12} />}
                  </div>
                </th>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ID <SortIcon columnKey="id" />
                  </div>
                </th>
                <th>Location</th>
                <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Priority <SortIcon columnKey="priority" />
                  </div>
                </th>
                <th onClick={() => handleSort('deadline_min')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Deadline (min) <SortIcon columnKey="deadline_min" />
                  </div>
                </th>
                <th>Coordinates</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDeliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td>
                    <div 
                      className={`checkbox ${selectedIds.includes(delivery.id) ? 'checked' : ''}`}
                      onClick={() => toggleSelection(delivery.id)}
                    >
                      {selectedIds.includes(delivery.id) && <Check size={12} />}
                    </div>
                  </td>
                  <td><strong>#{delivery.id}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                      <span>{delivery.lat.toFixed(4)}, {delivery.lon.toFixed(4)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${delivery.priority}`}>
                      {delivery.priority.toUpperCase()}
                    </span>
                  </td>
                  <td>{delivery.deadline_min} min</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {delivery.mapped_node_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedDeliveries.length === 0 && (
          <div className="empty-state">
            <MapPin size={64} />
            <p className="empty-state-title">No deliveries found</p>
            <p className="empty-state-text">Try adjusting your search or generate new deliveries</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deliveries;
