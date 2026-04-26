import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Route, 
  Settings,
  Truck
} from 'lucide-react';

const Sidebar = ({ theme, toggleTheme }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Truck size={20} />
          </div>
          <span>DeliveryRoutes</span>
        </div>
      </div>
      
      <nav className="nav-menu">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/deliveries" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MapPin size={20} />
          <span>Deliveries</span>
        </NavLink>
        
        <NavLink to="/routes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Route size={20} />
          <span>Routes</span>
        </NavLink>
        
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
