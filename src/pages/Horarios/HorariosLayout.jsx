import React, { useState } from 'react';
import ConfiguracionHorario from './ConfiguracionHorario';
import CapturaHorarios from './CapturaHorarios';
import GeneradorPanel from './GeneradorPanel';
import VistaGeneral from './VistaGeneral';
import { Settings, Users, Cpu, Calendar } from 'lucide-react';
import './Horarios.css';

const HorariosLayout = () => {
  const [activeTab, setActiveTab] = useState('config');

  const tabs = [
    { id: 'config', name: 'Configuración', icon: Settings },
    { id: 'captura', name: 'Captura de Datos', icon: Users },
    { id: 'generador', name: 'Motor IA', icon: Cpu },
    { id: 'vista', name: 'Vista General', icon: Calendar },
  ];

  return (
    <div className="horarios-layout module-container">
      <div className="horarios-tabs-sidebar card">
        <h3 style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Administración</h3>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`horarios-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon size={18} />
              {tab.name}
            </button>
          );
        })}
      </div>
      <div className="horarios-content-area">
        {activeTab === 'config' && <ConfiguracionHorario />}
        {activeTab === 'captura' && <CapturaHorarios />}
        {activeTab === 'generador' && <GeneradorPanel />}
        {activeTab === 'vista' && <VistaGeneral />}
      </div>
    </div>
  );
};

export default HorariosLayout;
