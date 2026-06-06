import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Navigation/Sidebar';
import Topbar from '../Navigation/Topbar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay para móvil si el Drawer de Sidebar está abierto (manejado internamente) */}
      
      <div className="main-content">
        <Topbar />
        
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
