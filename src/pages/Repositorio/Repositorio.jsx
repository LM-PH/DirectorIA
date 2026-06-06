import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Plus, Filter, FileText, Image as ImageIcon, Download, Trash2, Edit2, Search, File, HardDrive, ClipboardList } from 'lucide-react';
import DocumentoModal from './components/DocumentoModal';
import ControlEntregas from './components/ControlEntregas';
import EntregaModal from './components/EntregaModal';
import { useConfig } from '../../contexts/ConfigContext';
import { useAlert } from '../../contexts/AlertContext';
import './Repositorio.css';

const TIPOS_DOC = [
  'Programa analítico', 'Diagnóstico escolar', 'Diagnóstico socioeducativo', 
  'Planeación docente', 'Evidencia', 'Informe', 'Oficio', 'Acta', 'Otro'
];

const Repositorio = () => {
  const [documentos, setDocumentos] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('archivos'); // 'archivos' | 'entregas'
  const { config } = useConfig();
  const { showAlert } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState(null);

  const [isEntregaModalOpen, setIsEntregaModalOpen] = useState(false);
  const [entregaToEdit, setEntregaToEdit] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    searchQuery: '',
    tipo: '',
    docente: '',
    cicloEscolar: '',
    gradoGrupo: ''
  });

  useEffect(() => {
    // Fetch Documentos
    const qDocs = query(collection(db, 'documentos'), orderBy('fechaRecepcion', 'desc'));
    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocumentos(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching documentos:", error);
      setLoading(false);
    });

    // Fetch Entregas Esperadas
    const qEntregas = query(collection(db, 'entregas_esperadas'), orderBy('fechaLimite', 'asc'));
    const unsubEntregas = onSnapshot(qEntregas, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntregas(data);
    }, (error) => {
      console.error("Error fetching entregas:", error);
    });

    return () => {
      unsubDocs();
      unsubEntregas();
    };
  }, []);

  const handleOpenNewDoc = () => {
    setDocToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditDoc = (documento) => {
    setDocToEdit(documento);
    setIsModalOpen(true);
  };

  const handleDeleteDoc = async (id) => {
    if(window.confirm('¿Eliminar este documento definitivamente?')) {
      try {
        await deleteDoc(doc(db, 'documentos', id));
        showAlert('Documento eliminado.', 'success');
      } catch (error) {
        if (error.code === 'permission-denied') showAlert('Error de seguridad: Permisos insuficientes.', 'error');
        else showAlert('Error al eliminar.', 'error');
      }
    }
  };

  const handleSaveDoc = async (data) => {
    try {
      if(data.id) {
        const {id, ...updateData} = data;
        await updateDoc(doc(db, 'documentos', id), {...updateData, updatedAt: new Date()});
        showAlert('Documento actualizado.', 'success');
      } else {
        await addDoc(collection(db, 'documentos'), {...data, createdAt: new Date()});
        showAlert('Documento guardado correctamente.', 'success');
      }
      setIsModalOpen(false);
    } catch (error) {
      if (error.code === 'permission-denied') showAlert('Error de seguridad: Permisos insuficientes.', 'error');
      else showAlert('Error al guardar el documento.', 'error');
    }
  };

  const handleOpenNewEntrega = () => {
    setEntregaToEdit(null);
    setIsEntregaModalOpen(true);
  };

  const handleEditEntrega = (entrega) => {
    setEntregaToEdit(entrega);
    setIsEntregaModalOpen(true);
  };

  const handleDeleteEntrega = async (id) => {
    if (window.confirm('¿Eliminar esta solicitud de entrega?')) {
      await deleteDoc(doc(db, 'entregas_esperadas', id));
    }
  };

  const handleSaveEntrega = async (data) => {
    if (data.id) {
      const { id, ...updateData } = data;
      await updateDoc(doc(db, 'entregas_esperadas', id), { ...updateData, updatedAt: new Date() });
    } else {
      await addDoc(collection(db, 'entregas_esperadas'), { ...data, createdAt: new Date() });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ searchQuery: '', tipo: '', docente: '', cicloEscolar: '', gradoGrupo: '' });
  };

  // Listas únicas para los selectores de filtros
  const docentesList = [...new Set(documentos.map(d => d.docente).filter(Boolean))].sort();
  const ciclosList = [...new Set(documentos.map(d => d.cicloEscolar).filter(Boolean))].sort().reverse();
  const gruposList = [...new Set(documentos.map(d => d.gradoGrupo).filter(Boolean))].sort();

  // Aplicar Filtros
  const filteredDocs = documentos.filter(d => {
    const q = filters.searchQuery.toLowerCase();
    const matchSearch = d.nombre.toLowerCase().includes(q) || (d.archivoNombre && d.archivoNombre.toLowerCase().includes(q));
    const matchTipo = filters.tipo ? d.tipo === filters.tipo : true;
    const matchDocente = filters.docente ? d.docente === filters.docente : true;
    const matchCiclo = filters.cicloEscolar ? d.cicloEscolar === filters.cicloEscolar : true;
    const matchGrupo = filters.gradoGrupo ? d.gradoGrupo === filters.gradoGrupo : true;
    
    return matchSearch && matchTipo && matchDocente && matchCiclo && matchGrupo;
  });

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <File size={36} className="text-muted" />;
    if (mimeType.includes('pdf')) return <FileText size={36} className="text-error" />;
    if (mimeType.includes('image')) return <ImageIcon size={36} className="text-success" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText size={36} className="text-info" />;
    return <File size={36} className="text-primary" />;
  };

  const truncate = (str, n) => {
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
  };

  return (
    <div className="module-container repo-module">
      <div className="repo-header">
        <div>
          <h1 className="module-title">Repositorio Documental</h1>
          <p className="module-description">Archivo digital centralizado de planeaciones y evidencias.</p>
        </div>
        
        <div className="header-actions">
          <div className="view-toggle" style={{display:'flex', background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)', overflow:'hidden'}}>
            <button 
              style={{padding:'0.5rem 1rem', border:'none', background: viewMode === 'archivos' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'archivos' ? 'white' : 'var(--color-text-secondary)', cursor:'pointer', fontWeight:'600', display:'flex', alignItems:'center', gap:'0.5rem'}}
              onClick={() => setViewMode('archivos')}
            >
              <HardDrive size={16} /> Archivo
            </button>
            <button 
              style={{padding:'0.5rem 1rem', border:'none', background: viewMode === 'entregas' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'entregas' ? 'white' : 'var(--color-text-secondary)', cursor:'pointer', fontWeight:'600', display:'flex', alignItems:'center', gap:'0.5rem'}}
              onClick={() => setViewMode('entregas')}
            >
              <ClipboardList size={16} /> Entregas
            </button>
          </div>
          {viewMode === 'archivos' && (
            <button className="btn-primary" onClick={handleOpenNewDoc}>
              <Plus size={18} /> Subir Documento
            </button>
          )}
        </div>
      </div>

      {viewMode === 'archivos' ? (
        <>
          {/* Barra de Filtros */}
          <div className="repo-filters-bar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                name="searchQuery"
                placeholder="Buscar por nombre de documento o archivo..." 
                value={filters.searchQuery}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filters-grid">
              <select name="tipo" value={filters.tipo} onChange={handleFilterChange}>
                <option value="">Cualquier Tipo</option>
                {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select name="docente" value={filters.docente} onChange={handleFilterChange}>
                <option value="">Cualquier Docente</option>
                {docentesList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select name="cicloEscolar" value={filters.cicloEscolar} onChange={handleFilterChange}>
                <option value="">Cualquier Ciclo</option>
                {ciclosList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select name="gradoGrupo" value={filters.gradoGrupo} onChange={handleFilterChange}>
                <option value="">Cualquier Grupo</option>
                {gruposList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <button className="btn-secondary btn-clear" onClick={clearFilters}>Limpiar Filtros</button>
            </div>
          </div>

          {/* Cuadrícula de Archivos */}
          <div className="repo-workspace">
            <div className="workspace-header">
              <HardDrive size={18} className="text-primary"/>
              <h2>Mi Unidad Escolar</h2>
              <span className="doc-count">{filteredDocs.length} documentos</span>
            </div>

            {loading ? (
              <div className="loading-state">Cargando repositorio...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} className="text-muted" />
                <h3>No se encontraron documentos</h3>
                <p>Sube un nuevo archivo o ajusta tus filtros de búsqueda.</p>
              </div>
            ) : (
              <div className="files-grid">
                {filteredDocs.map(doc => (
                  <div key={doc.id} className="file-card">
                    <div className="file-icon-area">
                      {getFileIcon(doc.archivoMime)}
                    </div>
                    <div className="file-details">
                      <h3 className="file-title" title={doc.nombre}>{truncate(doc.nombre, 40)}</h3>
                      <span className="file-type-badge">{doc.tipo}</span>
                      <p className="file-meta">
                        <strong>De:</strong> {truncate(doc.docente, 25)}
                      </p>
                      <p className="file-meta">
                        <strong>Fecha:</strong> {doc.fechaRecepcion}
                      </p>
                      {doc.gradoGrupo && (
                        <p className="file-meta"><strong>Grupo:</strong> {doc.gradoGrupo}</p>
                      )}
                    </div>
                    <div className="file-actions">
                      <div className="action-group">
                        {doc.archivoUrl ? (
                          <a 
                            href={doc.archivoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-action primary-action"
                            title="Ver / Descargar"
                          >
                            <Download size={16} /> Abrir Archivo
                          </a>
                        ) : (
                          <span className="no-file-text">Sin adjunto</span>
                        )}
                      </div>
                      <div className="action-group-small">
                        <button className="btn-icon-small" onClick={() => handleEditDoc(doc)} title="Editar metadatos">
                          <Edit2 size={16}/>
                        </button>
                        <button className="btn-icon-small text-error" onClick={() => handleDeleteDoc(doc.id)} title="Eliminar registro">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <ControlEntregas 
          entregas={entregas} 
          documentos={documentos} 
          onOpenNew={handleOpenNewEntrega} 
          onEdit={handleEditEntrega} 
          onDelete={handleDeleteEntrega} 
        />
      )}

      <DocumentoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDoc}
        documentoToEdit={docToEdit}
        entregasDisponibles={entregas}
      />

      <EntregaModal
        isOpen={isEntregaModalOpen}
        onClose={() => setIsEntregaModalOpen(false)}
        onSave={handleSaveEntrega}
        entregaToEdit={entregaToEdit}
        docentesDisponibles={docentesList}
      />
    </div>
  );
};

export default Repositorio;

