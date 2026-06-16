import React, { useState } from 'react';
import ConfiguracionHorario from './ConfiguracionHorario';
import CapturaHorarios from './CapturaHorarios';
import GeneradorPanel from './GeneradorPanel';
import { Settings, Users, Cpu, Calendar, Sparkles } from 'lucide-react';

const HorariosLayout = () => {
  const [activeTab, setActiveTab] = useState('config');

  const tabs = [
    { id: 'config', name: 'Configuración', icon: Settings },
    { id: 'captura', name: 'Captura de Datos', icon: Users },
    { id: 'generador', name: 'Motor IA', icon: Cpu },
    { id: 'vista', name: 'Vista General', icon: Calendar },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header Glassmorphism */}
      <div className="bg-white/70 backdrop-blur-md border-b border-indigo-100 px-8 py-5 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-800 tracking-tight">Generador de Horarios</h1>
            <p className="text-sm font-medium text-indigo-600/70">Motor heurístico avanzado para educación secundaria</p>
          </div>
        </div>
        
        <div className="flex gap-2 bg-white/50 p-1.5 rounded-xl border border-indigo-50/50 shadow-inner">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200/50 scale-100' 
                  : 'text-slate-600 hover:bg-white hover:text-indigo-700 hover:shadow-sm scale-95 hover:scale-100'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          {activeTab === 'config' && <ConfiguracionHorario />}
          {activeTab === 'captura' && <CapturaHorarios />}
          {activeTab === 'generador' && <GeneradorPanel />}
          {activeTab === 'vista' && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <Calendar size={48} className="text-indigo-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Vista General de Horarios</h2>
              <p className="text-slate-500 max-w-md">La cuadrícula interactiva con Drag & Drop estará disponible en la próxima actualización.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HorariosLayout;
