import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileText, 
  Users, 
  FolderOpen, 
  Briefcase, 
  Settings,
  LogOut,
  Inbox,
  Printer,
  Menu,
  X,
  Calendar,
  ClipboardList,
  CreditCard,
  Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLicense } from '../../contexts/LicenseContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, isPaid, isAdmin } = useAuth();
  const { isTrialExpired } = useLicense();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Separar en principales (Bottom Nav) y secundarios (Menú 'Más')
  const mainItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { path: '/bandeja', name: 'Bandeja', icon: <Inbox size={24} /> },
    { path: '/agenda', name: 'Agenda', icon: <CalendarDays size={24} /> },
  ];

  const secondaryItems = [
    { path: '/pemc', name: 'PEMC', icon: <FileText size={20} /> },
    { path: '/acuerdos', name: 'Acuerdos CTE', icon: <Users size={20} /> },
    { path: '/repositorio', name: 'Repositorio', icon: <FolderOpen size={20} /> },
    { path: '/permisos', name: 'Permisos', icon: <Briefcase size={20} /> },
    { path: '/comisiones', name: 'Comisiones', icon: <ClipboardList size={20} /> },
    { path: '/reportes', name: 'Reportes', icon: <Printer size={20} /> },
    { path: '/licencia', name: 'Mi Licencia', icon: <CreditCard size={20} /> },
    { path: '/configuracion', name: 'Configuración', icon: <Settings size={20} /> },
  ];

  const allItems = [...mainItems, ...secondaryItems];

  return (
    <>
      {/* 
        DESKTOP SIDEBAR 
      */}
      <aside className={`sidebar desktop-only ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <h2>Director<span>IA</span></h2>
          </div>
          <button className="close-btn mobile-only" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {allItems.map((item) => {
              const isLocked = isTrialExpired && !isPaid && !isAdmin && item.path !== '/licencia' && item.path !== '/configuracion';
              return (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                  onClick={(e) => {
                    if(isLocked) e.preventDefault();
                    else onClose();
                  }}
                  end={item.path === '/'}
                >
                  <span className="icon">{React.cloneElement(item.icon, { size: 20 })}</span>
                  <span className="text">{item.name}</span>
                  {isLocked && <Lock size={14} className="lock-icon" style={{marginLeft: 'auto', opacity: 0.5}} />}
                </NavLink>
              </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="icon"><LogOut size={20} /></span>
            <span className="text">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 
        MOBILE BOTTOM NAV 
      */}
      <nav className="bottom-nav mobile-only">
        {mainItems.map((item) => (
          <NavLink 
            key={item.path}
            to={item.path} 
            className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}
            end={item.path === '/'}
            onClick={() => setShowMoreMenu(false)}
          >
            {item.icon}
            <span className="bottom-nav-text">{item.name}</span>
          </NavLink>
        ))}
        
        <button 
          className={`bottom-nav-item ${showMoreMenu ? 'active' : ''}`}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
        >
          <Menu size={24} />
          <span className="bottom-nav-text">Más</span>
        </button>
      </nav>

      {/* MOBILE 'MORE' MENU (Slide up drawer) */}
      <div className={`mobile-more-drawer mobile-only ${showMoreMenu ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Más Opciones</h3>
          <button onClick={() => setShowMoreMenu(false)}><X size={24} /></button>
        </div>
        <div className="drawer-content">
          {secondaryItems.map((item) => (
            <NavLink 
              key={item.path}
              to={item.path} 
              className="drawer-item"
              onClick={() => setShowMoreMenu(false)}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
          <div className="drawer-divider"></div>
          <button onClick={handleLogout} className="drawer-item text-danger">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
      
      {/* Overlay for Drawer */}
      {showMoreMenu && <div className="drawer-overlay mobile-only" onClick={() => setShowMoreMenu(false)}></div>}
    </>
  );
};

export default Sidebar;
