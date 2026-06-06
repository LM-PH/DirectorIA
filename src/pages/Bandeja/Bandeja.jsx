import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Inbox, Mail, Paperclip, ChevronRight, CheckCircle, Tag, Search, Archive } from 'lucide-react';
import ClasificarModal from './components/ClasificarModal';
import { useConfig } from '../../contexts/ConfigContext';
import { useAlert } from '../../contexts/AlertContext';
import './Bandeja.css';

const Bandeja = () => {
  const [correos, setCorreos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState('pendiente');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [correoToClassify, setCorreoToClassify] = useState(null);
  
  const { config } = useConfig();
  const { showAlert } = useAlert();

  useEffect(() => {
    const q = query(collection(db, 'correos_recibidos'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Si está vacío, sembramos datos de prueba
      if (data.length === 0) {
        sembrarDatosPrueba();
      } else {
        setCorreos(data);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching bandeja:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const sembrarDatosPrueba = async () => {
    const mockData = [
      {
        remitenteEmail: 'juan.maestro@escuela.edu.mx',
        remitenteNombre: 'Juan Pérez',
        asunto: 'Entrega de Planeación Diagnóstica',
        cuerpo: 'Buenos días Director. Adjunto mi planeación diagnóstica para revisión. Saludos.',
        fecha: new Date().toISOString(),
        adjuntos: [
          { nombre: 'planeacion_diagnostica_juan.pdf', url: '#', tipo: 'application/pdf' }
        ],
        estado: 'pendiente',
        tipoSugerido: 'Planeación docente'
      },
      {
        remitenteEmail: 'maria.lopez@escuela.edu.mx',
        remitenteNombre: 'María López',
        asunto: 'Solicitud de Permiso Económico',
        cuerpo: 'Estimado director, por medio de la presente solicito permiso económico para el día de mañana por asuntos personales.',
        fecha: new Date(Date.now() - 86400000).toISOString(), // Ayer
        adjuntos: [],
        estado: 'pendiente',
        tipoSugerido: 'Permiso económico'
      }
    ];

    try {
      for (const item of mockData) {
        await addDoc(collection(db, 'correos_recibidos'), item);
      }
    } catch (e) {
      console.error("Error sembrando datos:", e);
    }
  };

  const handleOpenClassify = (correo) => {
    setCorreoToClassify(correo);
    setIsModalOpen(true);
  };

  const handleClassify = async (data) => {
    try {
      // 1. Guardar en el módulo correspondiente
      if (data.moduloDestino === 'Repositorio') {
        await addDoc(collection(db, 'documentos'), {
          nombre: data.asunto,
          tipo: data.clasificacion,
          docente: data.remitenteNombre,
          asignatura: '',
          gradoGrupo: '',
          cicloEscolar: config?.cicloEscolar || '',
          fechaRecepcion: new Date().toISOString().split('T')[0],
          observaciones: 'Ingresado automáticamente desde Bandeja de Recepción',
          archivoUrl: data.adjuntos?.[0]?.url || '',
          archivoNombre: data.adjuntos?.[0]?.nombre || '',
          archivoMime: data.adjuntos?.[0]?.tipo || '',
          createdAt: new Date()
        });
      } else if (data.moduloDestino === 'Permisos') {
        await addDoc(collection(db, 'permisos'), {
          trabajador: data.remitenteNombre,
          funcion: 'docente', // Default
          fecha: new Date().toISOString().split('T')[0],
          horaInicio: '08:00',
          horaTermino: '13:00',
          motivo: data.cuerpo || data.asunto,
          tipoPermiso: 'Económico',
          estado: 'pendiente',
          observaciones: 'Ingresado automáticamente desde Bandeja',
          adjuntoUrl: data.adjuntos?.[0]?.url || '',
          adjuntoNombre: data.adjuntos?.[0]?.nombre || '',
          createdAt: new Date()
        });
      } else if (data.moduloDestino === 'PEMC' && data.targetId) {
        await updateDoc(doc(db, 'pemc', data.targetId), {
          evidenciaUrl: data.adjuntos?.[0]?.url || '',
          evidenciaNombre: data.adjuntos?.[0]?.nombre || '',
          observaciones: (data.observacionesPrevias ? data.observacionesPrevias + '\n' : '') + `Evidencia subida vía Bandeja: ${data.asunto}`,
          estado: 'cumplido', // Podríamos preguntar, pero asumamos cumplido al subir evidencia.
          updatedAt: new Date()
        });
      } else if (data.moduloDestino === 'CTE' && data.targetId) {
        await updateDoc(doc(db, 'acuerdos_cte', data.targetId), {
          evidenciaUrl: data.adjuntos?.[0]?.url || '',
          evidenciaNombre: data.adjuntos?.[0]?.nombre || '',
          observaciones: (data.observacionesPrevias ? data.observacionesPrevias + '\n' : '') + `Evidencia subida vía Bandeja: ${data.asunto}`,
          estado: 'cumplido',
          updatedAt: new Date()
        });
      }

      // 2. Marcar como clasificado
      await updateDoc(doc(db, 'correos_recibidos', data.id), { 
        estado: 'clasificado',
        clasificacionFinal: data.clasificacion,
        moduloDestino: data.moduloDestino,
        updatedAt: new Date() 
      });

      showAlert('Correo clasificado y guardado correctamente.', 'success');
    } catch (error) {
      console.error("Error clasificando", error);
      if (error.code === 'permission-denied') {
        showAlert('Error de seguridad: Permisos insuficientes. Por favor inicia sesión nuevamente.', 'error');
      } else {
        showAlert('Ocurrió un error al clasificar el documento.', 'error');
      }
    }
  };

  const handleArchive = async (id) => {
    try {
      await updateDoc(doc(db, 'correos_recibidos', id), { estado: 'archivado', updatedAt: new Date() });
      showAlert('Correo archivado.', 'info');
    } catch (error) {
      if (error.code === 'permission-denied') {
        showAlert('Permisos insuficientes para archivar. Inicia sesión.', 'error');
      } else {
        showAlert('Error al archivar el correo.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('¿Eliminar este correo permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'correos_recibidos', id));
        showAlert('Correo eliminado permanentemente.', 'success');
      } catch (error) {
        if (error.code === 'permission-denied') {
          showAlert('Permisos insuficientes para eliminar. Inicia sesión.', 'error');
        } else {
          showAlert('Error al eliminar el correo.', 'error');
        }
      }
    }
  };

  const filteredCorreos = correos.filter(c => c.estado === filterState);

  // Helper para acortar texto
  const truncate = (str, n) => {
    if (!str) return '';
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
  };

  // Formato de fecha
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="module-container bandeja-module">
      <div className="bandeja-header">
        <div>
          <h1 className="module-title">Bandeja de Recepción</h1>
          <p className="module-description">Recepción de documentos y solicitudes vía correo electrónico.</p>
        </div>
      </div>

      <div className="bandeja-layout">
        {/* Sidebar Local */}
        <div className="bandeja-sidebar">
          <button 
            className={`bandeja-tab ${filterState === 'pendiente' ? 'active' : ''}`}
            onClick={() => setFilterState('pendiente')}
          >
            <Inbox size={18}/> Pendientes
            <span className="badge-count">{correos.filter(c => c.estado === 'pendiente').length}</span>
          </button>
          <button 
            className={`bandeja-tab ${filterState === 'clasificado' ? 'active' : ''}`}
            onClick={() => setFilterState('clasificado')}
          >
            <CheckCircle size={18}/> Clasificados
          </button>
          <button 
            className={`bandeja-tab ${filterState === 'archivado' ? 'active' : ''}`}
            onClick={() => setFilterState('archivado')}
          >
            <Archive size={18}/> Archivados
          </button>
        </div>

        {/* Lista Principal */}
        <div className="bandeja-content">
          {loading ? (
            <div className="loading-state">Cargando bandeja...</div>
          ) : filteredCorreos.length === 0 ? (
            <div className="empty-state">
              <Mail size={48} className="text-muted" />
              <h3>Bandeja vacía</h3>
              <p>No hay correos en la carpeta de {filterState}.</p>
            </div>
          ) : (
            <div className="emails-list">
              {filteredCorreos.map(correo => (
                <div key={correo.id} className={`email-card status-${correo.estado}`}>
                  <div className="email-main">
                    <div className="email-sender">
                      <div className="sender-avatar">{correo.remitenteNombre.charAt(0)}</div>
                      <div className="sender-info">
                        <strong>{correo.remitenteNombre}</strong>
                        <span>{correo.remitenteEmail}</span>
                      </div>
                    </div>
                    
                    <div className="email-subject-body">
                      <h4>{correo.asunto}</h4>
                      <p>{truncate(correo.cuerpo, 80)}</p>
                    </div>
                  </div>
                  
                  <div className="email-meta">
                    <span className="email-date">{formatDate(correo.fecha)}</span>
                    
                    {correo.adjuntos && correo.adjuntos.length > 0 && (
                      <div className="attachment-badge">
                        <Paperclip size={14}/> {correo.adjuntos.length} Adjunto(s)
                      </div>
                    )}
                    
                    {correo.estado === 'pendiente' && correo.tipoSugerido && (
                      <div className="suggestion-badge">
                        <Tag size={12}/> Sugerido: {correo.tipoSugerido}
                      </div>
                    )}

                    {correo.estado === 'clasificado' && (
                      <div className="classified-badge">
                        Guardado en: {correo.moduloDestino}
                      </div>
                    )}
                  </div>
                  
                  <div className="email-actions">
                    {correo.estado === 'pendiente' && (
                      <>
                        <button className="btn-primary btn-sm" onClick={() => handleOpenClassify(correo)}>
                          Clasificar <ChevronRight size={16}/>
                        </button>
                        <button className="btn-secondary btn-sm" onClick={() => handleArchive(correo.id)}>
                          Archivar
                        </button>
                      </>
                    )}
                    {correo.estado !== 'pendiente' && (
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(correo.id)}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ClasificarModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleClassify}
        correo={correoToClassify}
      />
    </div>
  );
};

export default Bandeja;
