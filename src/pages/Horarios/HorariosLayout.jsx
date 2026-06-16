import React, { useState } from 'react';
import ConfiguracionHorario from './ConfiguracionHorario';
import CapturaHorarios from './CapturaHorarios';
import GeneradorPanel from './GeneradorPanel';
import { Settings, Users, Cpu, Calendar } from 'lucide-react';

const HorariosLayout = () => {
  const [activeTab, setActiveTab] = useState('config');

  const tabs = [
    { id: 'config', name: 'Configuración', icon: Settings },
    { id: 'captura', name: 'Captura de Datos', icon: Users },
    { id: 'generador', name: 'Generador Automático', icon: Cpu },
    { id: 'vista', name: 'Vista General', icon: Calendar },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Generador de Horarios</h1>
          <p className="text-sm text-slate-500">Motor inteligente para secundarias</p>
        </div>
        
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'config' && <ConfiguracionHorario />}
        {activeTab === 'captura' && <CapturaHorarios />}
        {activeTab === 'generador' && <GeneradorPanel />}
        {activeTab === 'vista' && (
          <div className="flex items-center justify-center h-full text-slate-400">
            Vista General e Impresión (En desarrollo)
          </div>
        )}
      </div>
    </div>
  );
};

export default HorariosLayout;
