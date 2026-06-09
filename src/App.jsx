import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Agenda from './pages/Agenda/Agenda';
import PEMC from './pages/PEMC/PEMC';
import AcuerdosCTE from './pages/AcuerdosCTE/AcuerdosCTE';
import Repositorio from './pages/Repositorio/Repositorio';
import Permisos from './pages/Permisos/Permisos';
import Bandeja from './pages/Bandeja/Bandeja';
import Reportes from './pages/Reportes/Reportes';
import Configuracion from './pages/Configuracion/Configuracion';
import Horarios from './pages/Horarios/Horarios';
import Comisiones from './pages/Comisiones/Comisiones';
import PortalDocente from './pages/Portal/PortalDocente';
import AdminPanel from './pages/Admin/AdminPanel';
import SubscriptionLock from './pages/Auth/SubscriptionLock';
import { AlertProvider } from './contexts/AlertContext';

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <ConfigProvider>
          <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/p/:schoolId" element={<PortalDocente />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/locked" element={<SubscriptionLock />} />

            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="pemc" element={<PEMC />} />
              <Route path="acuerdos" element={<AcuerdosCTE />} />
              <Route path="repositorio" element={<Repositorio />} />
              <Route path="permisos" element={<Permisos />} />
              <Route path="bandeja" element={<Bandeja />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="configuracion" element={<Configuracion />} />
              <Route path="horarios" element={<Horarios />} />
              <Route path="comisiones" element={<Comisiones />} />
            </Route>
          </Routes>
        </Router>
      </ConfigProvider>
    </AlertProvider>
  </AuthProvider>
);
}

export default App;
