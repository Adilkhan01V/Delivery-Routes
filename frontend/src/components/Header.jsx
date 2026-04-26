import React from 'react';
import { Sun, Moon } from 'lucide-react';

const Header = ({ title, theme, toggleTheme }) => {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
