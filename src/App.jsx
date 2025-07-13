import React, { useState } from 'react';
import Navigation from './components/common/Navigation';
import POS from './components/POS/POS';
import ProductManagement from './components/ProductManagement/ProductManagement';
import SalesHistory from './components/SalesHistory/SalesHistory';
import Settings from './components/Settings/Settings';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('pos');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'pos':
        return <POS />;
      case 'products':
        return <ProductManagement />;
      case 'sales':
        return <SalesHistory />;
      case 'settings':
        return <Settings />;
      default:
        return <POS />;
    }
  };

  return (
    <div className="app-root-layout">
      <Navigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      <div className="app-content">
        {renderScreen()}
      </div>
    </div>
  );
}

export default App;
