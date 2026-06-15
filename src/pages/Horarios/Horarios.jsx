import React, { useState, useEffect, useRef } from 'react';
import { collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import PrintTemplate from '../Reportes/components/PrintTemplate';
import { 
  Settings, 
  Users, 
  FolderKanban, 
  BookOpen, 
  Building2, 
  Link2, 
  Sparkles, 
  Printer, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Download,
  Calendar,
  Grid
} from 'lucide-react';
import './Horarios.css';

const SUBJECT_COLORS = [
  '#f87171', // Rojo suave
  '#fb923c', // Naranja suave
  '#fbbf24', // Amarillo suave
  '#34d399', // Verde menta
  '#2dd4bf', // Turquesa
  '#38bdf8', // Celeste
  '#60a5fa', // Azul suave
  '#818cf8', // Indigo
  '#a78bfa', // Violeta
  '#f472b6'  // Rosa
];

const getSubjectColor = (materiaNombre, customColor) => {
  if (customColor) return customColor;
  if (!materiaNombre) return '#cbd5e1';
  let hash = 0;
  for (let i = 0; i < materiaNombre.length; i++) {
    hash = materiaNombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[idx];
};

const Horarios = () => {
  const { schoolId } = useAuth();
  const { config: schoolConfig } = useConfig();
  
  // Active Tab
  const [activeTab, setActiveTab] = useState('config');

  // Firestore Data States
  const [config, setConfig] = useState({
    horaEntrada: '07:00',
    horaSalida: '13:00',
    duracionModulo: 50,
    numModulos: 6,
    diasSemana: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    recesoInicio: '10:00',
    recesoFin: '10:30',
    cicloEscolar: '2025-2026'
  });
  
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [generatedSchedule, setGeneratedSchedule] = useState({
    slots: [],
    quality: 100,
    conflicts: [],
    horasPendientes: []
  });

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, conflicts: 0, stage: '' });

  // Search Filters for Catalogs
  const [searchDocente, setSearchDocente] = useState('');
  const [searchGrupo, setSearchGrupo] = useState('');
  const [searchMateria, setSearchMateria] = useState('');
  const [searchEspacio, setSearchEspacio] = useState('');

  // Modals States
  const [modalOpen, setModalOpen] = useState({
    docente: false,
    grupo: false,
    materia: false,
    espacio: false,
    asignacion: false
  });

  // Edit Targets
  const [editItem, setEditItem] = useState({
    docente: null,
    grupo: null,
    materia: null,
    espacio: null,
    asignacion: null
  });

  // Form States
  const [formDocente, setFormDocente] = useState({
    nombre: '',
    academia: '',
    horasAsignadas: 0,
    horasFrenteGrupo: 0,
    prioridad: 'Media',
    restricciones: '',
    observaciones: '',
    disponibilidad: {},
    materiasIds: []
  });

  const [formGrupo, setFormGrupo] = useState({
    grado: '',
    grupo: '',
    turno: 'Matutino',
    alumnos: 30,
    tutor: '',
    observaciones: ''
  });

  const [formMateria, setFormMateria] = useState({
    nombre: '',
    grado: '',
    horasSemanales: 3,
    espacioRequerido: 'Aula',
    observaciones: '',
    color: '#f87171'
  });

  const [formEspacio, setFormEspacio] = useState({
    nombre: '',
    tipo: 'Aula',
    capacidad: 35,
    observaciones: ''
  });

  const [formAsignacion, setFormAsignacion] = useState({
    docenteId: '',
    materiaId: '',
    grupoId: '',
    grupoIds: [],
    horasSemanales: 3,
    espacioId: '',
    espacioIds: []
  });

  const [showAllMateriasInAssignment, setShowAllMateriasInAssignment] = useState(false);

  // Schedule Viewer Filter States
  const [viewFilterMode, setViewFilterMode] = useState('grupo'); // 'grupo', 'docente', 'espacio', 'general'
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDocenteId, setSelectedDocenteId] = useState('');
  const [selectedEspacioId, setSelectedEspacioId] = useState('');
  const [timelineViewMode, setTimelineViewMode] = useState('individual'); // 'individual', 'global'
  const [timelineGlobalResource, setTimelineGlobalResource] = useState('grupo'); // 'grupo', 'docente', 'espacio'
  const [hoveredDocenteId, setHoveredDocenteId] = useState(null);
  const [hoveredMateriaId, setHoveredMateriaId] = useState(null);

  // Print Settings Tab
  const [printOption, setPrintOption] = useState('general'); // 'general', 'grupo', 'docente', 'espacio'

  // Drag and Drop State
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [conflictWarning, setConflictWarning] = useState('');

  // Table Ref for Excel Export
  const excelTableRef = useRef(null);

  // Initialize and Sync from Firestore
  useEffect(() => {
    if (!schoolId) return;

    setLoading(true);

    const baseRef = doc(db, 'schools', schoolId);

    // 1. Sync Config (merge with default values to prevent undefined fields)
    const unsubConfig = onSnapshot(doc(db, 'schools', schoolId, 'horarios_config', 'general'), (snap) => {
      if (snap.exists()) {
        console.log("Horarios config loaded from Firestore:", snap.data());
        setConfig(prev => ({ ...prev, ...snap.data() }));
      } else {
        console.log("No Horarios config found in Firestore. Using default values.");
      }
    }, (error) => {
      console.error("Error syncing schedules config:", error);
    });

    // 2. Sync Docentes
    const unsubDocentes = onSnapshot(collection(db, 'schools', schoolId, 'horarios_docentes'), (snap) => {
      setDocentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error syncing docents:", error);
    });

    // 3. Sync Grupos
    const unsubGrupos = onSnapshot(collection(db, 'schools', schoolId, 'horarios_grupos'), (snap) => {
      const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      sorted.sort((a, b) => `${a.grado}${a.grupo}`.localeCompare(`${b.grado}${b.grupo}`));
      setGrupos(sorted);
      if (sorted.length > 0 && !selectedGroupId) {
        setSelectedGroupId(sorted[0].id);
      }
    }, (error) => {
      console.error("Error syncing groups:", error);
    });

    // 4. Sync Materias
    const unsubMaterias = onSnapshot(collection(db, 'schools', schoolId, 'horarios_materias'), (snap) => {
      setMaterias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error syncing subjects:", error);
    });

    // 5. Sync Espacios
    const unsubEspacios = onSnapshot(collection(db, 'schools', schoolId, 'horarios_espacios'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEspacios(list);
      if (list.length > 0 && !selectedEspacioId) {
        setSelectedEspacioId(list[0].id);
      }
    }, (error) => {
      console.error("Error syncing spaces:", error);
    });

    // 6. Sync Asignaciones
    const unsubAsignaciones = onSnapshot(collection(db, 'schools', schoolId, 'horarios_asignaciones'), (snap) => {
      setAsignaciones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error syncing assignments:", error);
    });

    // 7. Sync Generated Schedule
    const unsubSchedule = onSnapshot(doc(db, 'schools', schoolId, 'horarios_generados', 'current'), (snap) => {
      if (snap.exists()) {
        setGeneratedSchedule(snap.data());
      }
    }, (error) => {
      console.error("Error syncing generated schedule:", error);
    });

    setLoading(false);

    return () => {
      unsubConfig();
      unsubDocentes();
      unsubGrupos();
      unsubMaterias();
      unsubEspacios();
      unsubAsignaciones();
      unsubSchedule();
    };
  }, [schoolId]);

  // Set default filter selections when data loads
  useEffect(() => {
    if (docentes.length > 0 && !selectedDocenteId) {
      setSelectedDocenteId(docentes[0].id);
    }
  }, [docentes]);

  // Save General Configuration
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'schools', schoolId, 'horarios_config', 'general'), config);
      alert('Configuración guardada con éxito.');
    } catch (e) {
      console.error(e);
      alert('Error al guardar configuración.');
    }
    setSaving(false);
  };

  // Availability Helpers for Docentes
  const initializeDisponibilidad = () => {
    const disp = {};
    config.diasSemana.forEach(d => {
      disp[d] = Array(config.numModulos).fill(true);
    });
    return disp;
  };

  const toggleDisponibilidad = (dia, idx) => {
    setFormDocente(prev => {
      const currentDisp = prev.disponibilidad[dia] ? [...prev.disponibilidad[dia]] : Array(config.numModulos).fill(true);
      currentDisp[idx] = !currentDisp[idx];
      return {
        ...prev,
        disponibilidad: {
          ...prev.disponibilidad,
          [dia]: currentDisp
        }
      };
    });
  };

  // CRUD Operations: DOCENTES
  const openNewDocente = () => {
    setEditItem(prev => ({ ...prev, docente: null }));
    setFormDocente({
      nombre: '',
      academia: '',
      horasAsignadas: 0,
      horasFrenteGrupo: 0,
      prioridad: 'Media',
      restricciones: '',
      observaciones: '',
      disponibilidad: initializeDisponibilidad(),
      materiasIds: []
    });
    setModalOpen(prev => ({ ...prev, docente: true }));
  };

  const openEditDocente = (docente) => {
    setEditItem(prev => ({ ...prev, docente }));
    setFormDocente({
      ...docente,
      disponibilidad: docente.disponibilidad || initializeDisponibilidad(),
      materiasIds: docente.materiasIds || []
    });
    setModalOpen(prev => ({ ...prev, docente: true }));
  };

  const handleSaveDocente = async (e) => {
    e.preventDefault();
    try {
      if (editItem.docente) {
        await updateDoc(doc(db, 'schools', schoolId, 'horarios_docentes', editItem.docente.id), formDocente);
      } else {
        await addDoc(collection(db, 'schools', schoolId, 'horarios_docentes'), formDocente);
      }
      setModalOpen(prev => ({ ...prev, docente: false }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDocente = async (id) => {
    if (window.confirm('¿Eliminar este docente? Se borrarán sus asignaciones vinculadas.')) {
      await deleteDoc(doc(db, 'schools', schoolId, 'horarios_docentes', id));
      // Clean up linked assignments
      const linked = asignaciones.filter(a => a.docenteId === id);
      const promises = linked.map(a => deleteDoc(doc(db, 'schools', schoolId, 'horarios_asignaciones', a.id)));
      await Promise.all(promises);
    }
  };

  // CRUD Operations: GRUPOS
  const openNewGrupo = () => {
    setEditItem(prev => ({ ...prev, grupo: null }));
    setFormGrupo({
      grado: '',
      grupo: '',
      turno: 'Matutino',
      alumnos: 30,
      tutor: '',
      observaciones: ''
    });
    setModalOpen(prev => ({ ...prev, grupo: true }));
  };

  const openEditGrupo = (grupo) => {
    setEditItem(prev => ({ ...prev, grupo }));
    setFormGrupo(grupo);
    setModalOpen(prev => ({ ...prev, grupo: true }));
  };

  const handleSaveGrupo = async (e) => {
    e.preventDefault();
    try {
      if (editItem.grupo) {
        await updateDoc(doc(db, 'schools', schoolId, 'horarios_grupos', editItem.grupo.id), formGrupo);
      } else {
        await addDoc(collection(db, 'schools', schoolId, 'horarios_grupos'), formGrupo);
      }
      setModalOpen(prev => ({ ...prev, grupo: false }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGrupo = async (id) => {
    if (window.confirm('¿Eliminar este grupo? Se borrarán sus asignaciones.')) {
      await deleteDoc(doc(db, 'schools', schoolId, 'horarios_grupos', id));
      const linked = asignaciones.filter(a => a.grupoId === id);
      const promises = linked.map(a => deleteDoc(doc(db, 'schools', schoolId, 'horarios_asignaciones', a.id)));
      await Promise.all(promises);
    }
  };

  // CRUD Operations: MATERIAS
  const openNewMateria = () => {
    setEditItem(prev => ({ ...prev, materia: null }));
    setFormMateria({
      nombre: '',
      grado: '',
      horasSemanales: 3,
      espacioRequerido: 'Aula',
      observaciones: '',
      color: SUBJECT_COLORS[0]
    });
    setModalOpen(prev => ({ ...prev, materia: true }));
  };

  const openEditMateria = (materia) => {
    setEditItem(prev => ({ ...prev, materia }));
    setFormMateria({
      ...materia,
      color: materia.color || SUBJECT_COLORS[0]
    });
    setModalOpen(prev => ({ ...prev, materia: true }));
  };

  const handleSaveMateria = async (e) => {
    e.preventDefault();
    try {
      if (editItem.materia) {
        await updateDoc(doc(db, 'schools', schoolId, 'horarios_materias', editItem.materia.id), formMateria);
      } else {
        await addDoc(collection(db, 'schools', schoolId, 'horarios_materias'), formMateria);
      }
      setModalOpen(prev => ({ ...prev, materia: false }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMateria = async (id) => {
    if (window.confirm('¿Eliminar esta materia? Se borrarán sus asignaciones.')) {
      await deleteDoc(doc(db, 'schools', schoolId, 'horarios_materias', id));
      const linked = asignaciones.filter(a => a.materiaId === id);
      const promises = linked.map(a => deleteDoc(doc(db, 'schools', schoolId, 'horarios_asignaciones', a.id)));
      await Promise.all(promises);
    }
  };

  // CRUD Operations: ESPACIOS
  const openNewEspacio = () => {
    setEditItem(prev => ({ ...prev, espacio: null }));
    setFormEspacio({
      nombre: '',
      tipo: 'Aula',
      capacidad: 35,
      observaciones: ''
    });
    setModalOpen(prev => ({ ...prev, espacio: true }));
  };

  const openEditEspacio = (espacio) => {
    setEditItem(prev => ({ ...prev, espacio }));
    setFormEspacio(espacio);
    setModalOpen(prev => ({ ...prev, espacio: true }));
  };

  const handleSaveEspacio = async (e) => {
    e.preventDefault();
    try {
      if (editItem.espacio) {
        await updateDoc(doc(db, 'schools', schoolId, 'horarios_espacios', editItem.espacio.id), formEspacio);
      } else {
        await addDoc(collection(db, 'schools', schoolId, 'horarios_espacios'), formEspacio);
      }
      setModalOpen(prev => ({ ...prev, espacio: false }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEspacio = async (id) => {
    if (window.confirm('¿Eliminar este espacio? Se desvinculará de las asignaciones.')) {
      await deleteDoc(doc(db, 'schools', schoolId, 'horarios_espacios', id));
      const linked = asignaciones.filter(a => a.espacioId === id);
      const promises = linked.map(a => updateDoc(doc(db, 'schools', schoolId, 'horarios_asignaciones', a.id), { espacioId: '', espacioNombre: '' }));
      await Promise.all(promises);
    }
  };

  const getMateriaColor = (materiaId, materiaNombre) => {
    const mat = materias.find(m => m.id === materiaId);
    if (mat?.color) return mat.color;
    return getSubjectColor(materiaNombre || mat?.nombre);
  };

  // CRUD Operations: ASIGNACIONES
  const handleDocenteChange = (docenteId) => {
    const docObj = docentes.find(d => d.id === docenteId);
    const docMateriasIds = docObj?.materiasIds || [];
    
    let nextMateriaId = '';
    if (docMateriasIds.length > 0) {
      nextMateriaId = docMateriasIds[0];
    } else if (materias.length > 0) {
      nextMateriaId = materias[0].id;
    }
    
    const matObj = materias.find(m => m.id === nextMateriaId);
    const horas = matObj ? Number(matObj.horasSemanales || 3) : 3;
    
    setFormAsignacion(prev => ({
      ...prev,
      docenteId,
      materiaId: nextMateriaId,
      horasSemanales: horas
    }));
  };

  const handleMateriaChange = (materiaId) => {
    const matObj = materias.find(m => m.id === materiaId);
    const horas = matObj ? Number(matObj.horasSemanales || 3) : 3;
    
    setFormAsignacion(prev => ({
      ...prev,
      materiaId,
      horasSemanales: horas
    }));
  };

  // CRUD Operations: ASIGNACIONES
  const openNewAsignacion = () => {
    setEditItem(prev => ({ ...prev, asignacion: null }));
    setShowAllMateriasInAssignment(false);

    const defaultDocenteId = docentes[0]?.id || '';
    const defaultDocente = docentes.find(d => d.id === defaultDocenteId);
    const docMateriasIds = defaultDocente?.materiasIds || [];
    
    let defaultMateriaId = '';
    if (docMateriasIds.length > 0) {
      defaultMateriaId = docMateriasIds[0];
    } else if (materias.length > 0) {
      defaultMateriaId = materias[0].id;
    }
    
    const defaultMateria = materias.find(m => m.id === defaultMateriaId);
    const defaultHoras = defaultMateria ? Number(defaultMateria.horasSemanales || 3) : 3;

    setFormAsignacion({
      docenteId: defaultDocenteId,
      materiaId: defaultMateriaId,
      grupoId: grupos[0]?.id || '',
      grupoIds: grupos[0] ? [grupos[0].id] : [],
      horasSemanales: defaultHoras,
      espacioId: '',
      espacioIds: []
    });
    setModalOpen(prev => ({ ...prev, asignacion: true }));
  };

  const openEditAsignacion = (asig) => {
    setEditItem(prev => ({ ...prev, asignacion: asig }));
    setShowAllMateriasInAssignment(false);
    setFormAsignacion({
      docenteId: asig.docenteId,
      materiaId: asig.materiaId,
      grupoId: asig.grupoId || '',
      grupoIds: asig.grupoIds || (asig.grupoId ? [asig.grupoId] : []),
      horasSemanales: asig.horasSemanales,
      espacioId: asig.espacioId || '',
      espacioIds: asig.espacioIds || (asig.espacioId ? [asig.espacioId] : [])
    });
    setModalOpen(prev => ({ ...prev, asignacion: true }));
  };

  const handleSaveAsignacion = async (e) => {
    e.preventDefault();
    const docObj = docentes.find(d => d.id === formAsignacion.docenteId);
    const matObj = materias.find(m => m.id === formAsignacion.materiaId);
    
    // Group name joining
    const selectedGroups = grupos.filter(g => formAsignacion.grupoIds?.includes(g.id));
    const grupoNombre = selectedGroups.length > 0
      ? selectedGroups.map(g => `${g.grado}°${g.grupo}`).join(', ')
      : 'Taller (Sin grupo)';

    // Space name joining
    const selectedSpaces = espacios.filter(es => formAsignacion.espacioIds?.includes(es.id));
    const espacioNombre = selectedSpaces.length > 0
      ? selectedSpaces.map(es => es.nombre).join(', ')
      : '';

    const payload = {
      docenteId: formAsignacion.docenteId,
      docenteNombre: docObj ? docObj.nombre : '',
      materiaId: formAsignacion.materiaId,
      materiaNombre: matObj ? matObj.nombre : '',
      grupoId: formAsignacion.grupoIds?.[0] || '', // backward compatibility
      grupoIds: formAsignacion.grupoIds || [],
      grupoNombre,
      horasSemanales: Number(formAsignacion.horasSemanales),
      espacioId: formAsignacion.espacioIds?.[0] || '', // backward compatibility
      espacioIds: formAsignacion.espacioIds || [],
      espacioNombre
    };

    try {
      if (editItem.asignacion) {
        await updateDoc(doc(db, 'schools', schoolId, 'horarios_asignaciones', editItem.asignacion.id), payload);
      } else {
        await addDoc(collection(db, 'schools', schoolId, 'horarios_asignaciones'), payload);
      }
      setModalOpen(prev => ({ ...prev, asignacion: false }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAsignacion = async (id) => {
    if (window.confirm('¿Eliminar esta asignación?')) {
      await deleteDoc(doc(db, 'schools', schoolId, 'horarios_asignaciones', id));
    }
  };

  // Helpers para comparar entidades de forma robusta
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
      .trim()
      .replace(/\s+/g, ' '); // Remueve múltiples espacios
  };

  const isGenericTeacher = (name) => {
    if (!name) return true;
    const n = normalizeText(name);
    return n === '' || n === 'sin docente' || n === 'pendiente' || n === 'taller' || n === 'sin asignar' || n === 'por asignar' || n === 'a designar';
  };

  const isSameTeacher = (s1, s2) => {
    if (s1.docenteId && s2.docenteId && s1.docenteId === s2.docenteId) {
      return true;
    }
    const name1 = normalizeText(s1.docenteNombre);
    const name2 = normalizeText(s2.docenteNombre);
    if (!isGenericTeacher(name1) && !isGenericTeacher(name2)) {
      return name1 === name2;
    }
    return false;
  };

  const shareGroup = (s1, s2) => {
    const g1 = s1.grupoIds || (s1.grupoId ? [s1.grupoId] : []);
    const g2 = s2.grupoIds || (s2.grupoId ? [s2.grupoId] : []);
    return g1.some(id => id && g2.includes(id));
  };

  const getRealHoursForAsig = (asig) => {
    return Number(asig.horasSemanales || 1);
  };

  const shareSpace = (s1, s2, nonAulas = null) => {
    const sp1 = s1.espacioIds || (s1.espacioId ? [s1.espacioId] : []);
    const sp2 = s2.espacioIds || (s2.espacioId ? [s2.espacioId] : []);
    const nonAulasSet = nonAulas || new Set(espacios.filter(e => e.tipo !== 'Aula').map(e => e.id));
    return sp1.some(id => id && nonAulasSet.has(id) && sp2.includes(id));
  };

  // ==========================================
  // SECCIÓN 7: ALGORITMO GENERADOR AUTOMÁTICO
  // ==========================================
  const handleAutoGenerateSchedule = async () => {
    if (asignaciones.length === 0) {
      alert('Por favor, agrega asignaciones académicas antes de generar.');
      return;
    }

    setSaving(true);
    setGenerationProgress({ current: 0, total: 100, conflicts: 0, stage: 'Preparando datos...' });

    // Helper para pausas de renderizado
    const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

    try {
      const numModulos = Number(config.numModulos) || 6;
      const dias = config.diasSemana || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

      // Estructuras auxiliares para velocidad O(1)
      const nonAulaSpaceIds = new Set(espacios.filter(e => e.tipo !== 'Aula').map(e => e.id));
      const docenteDisponibilidadMap = new Map();
      docentes.forEach(d => {
        docenteDisponibilidadMap.set(d.id, d.disponibilidad || {});
      });

      // Helper para determinar si una materia requiere un bloque doble
      const checkNeedsDoubleModule = (materiaNombre, horasSemanales, espacioRequerido) => {
        if (!materiaNombre) return false;
        const nameLower = materiaNombre.toLowerCase();
        const isDoubleSubject = (nameLower.includes('fisica') || 
                                nameLower.includes('física') || 
                                nameLower.includes('quimica') || 
                                nameLower.includes('química') || 
                                nameLower.includes('taller') || 
                                nameLower.includes('tecnologia') || 
                                nameLower.includes('tecnología')) && 
                                !nameLower.includes('edu');
        
        // Requieren estar en bloques de 2 horas
        return isDoubleSubject && horasSemanales >= 2;
      };

      // 1. Descomponer asignaciones en slots individuales de 1 hora
      let slotsToPlace = [];
      asignaciones.forEach(asig => {
        const hours = Number(asig.horasSemanales || 1);
        const mat = materias.find(m => m.id === asig.materiaId);
        const espacioReq = mat?.espacioRequerido || 'Aula';
        const needsDouble = checkNeedsDoubleModule(asig.materiaNombre, hours, espacioReq);
        
        const nameLower = asig.materiaNombre.toLowerCase();
        const isTaller = nameLower.includes('taller') || nameLower.includes('tecnologia') || nameLower.includes('tecnología');
        const groupsToProcess = (!isTaller && asig.grupoIds && asig.grupoIds.length > 1) 
          ? asig.grupoIds.map(gId => [gId]) 
          : [asig.grupoIds || (asig.grupoId ? [asig.grupoId] : [])];

        const numGroupsForDivision = asig.grupoIds?.length || 1;
        const hoursPerGroup = (numGroupsForDivision > 1 && !isTaller)
          ? Math.max(1, Math.floor(hours / numGroupsForDivision))
          : hours;

        groupsToProcess.forEach((gIds, gIndex) => {
          const mainGroupId = gIds[0] || '';
          let gName = asig.grupoNombre;
          if (!isTaller && asig.grupoIds?.length > 1) {
            const gObj = grupos.find(g => g.id === mainGroupId);
            if (gObj) gName = `${gObj.grado}°${gObj.grupo}`;
          }

          const eIds = asig.espacioIds || (asig.espacioId ? [asig.espacioId] : []);
          let assignedSpaceIds = eIds;
          let assignedSpaceName = asig.espacioNombre;
          
          if (!isTaller && asig.grupoIds?.length > 1 && eIds.length > 1) {
            // Intentar emparejar el espacio con el grupo basándose en el nombre
            const gObjForMatch = grupos.find(g => g.id === mainGroupId);
            let matchedSpaceId = null;
            if (gObjForMatch) {
              const expectedSpaceName1 = `${gObjForMatch.grado} ${gObjForMatch.grupo}`.toLowerCase(); // "1 a"
              const expectedSpaceName2 = `${gObjForMatch.grado}°${gObjForMatch.grupo}`.toLowerCase(); // "1°a"
              const matchedSpace = espacios.find(e => eIds.includes(e.id) && (
                e.nombre.toLowerCase().includes(expectedSpaceName1) || 
                e.nombre.toLowerCase().includes(expectedSpaceName2)
              ));
              if (matchedSpace) {
                matchedSpaceId = matchedSpace.id;
              }
            }
            // Si no hay coincidencia exacta por nombre y las longitudes coinciden, usar el índice (fallback)
            if (!matchedSpaceId && eIds.length === asig.grupoIds.length) {
              matchedSpaceId = eIds[gIndex];
            }
            // Si encontramos un ID, asignar ese espacio únicamente
            if (matchedSpaceId) {
              assignedSpaceIds = [matchedSpaceId];
              const sObj = espacios.find(e => e.id === matchedSpaceId);
              assignedSpaceName = sObj ? sObj.nombre : asig.espacioNombre;
            }
          }

          for (let h = 0; h < hoursPerGroup; h++) {
            slotsToPlace.push({
              id: `${asig.id}-g${gIndex}-${h}`,
              asigId: asig.id,
              docenteId: asig.docenteId,
              docenteNombre: asig.docenteNombre,
              materiaId: asig.materiaId,
              materiaNombre: asig.materiaNombre,
              grupoId: mainGroupId,
              grupoIds: gIds,
              grupoNombre: gName,
              espacioId: assignedSpaceIds[0] || '',
              espacioIds: assignedSpaceIds,
              espacioNombre: assignedSpaceName,
              horasSemanales: hoursPerGroup,
              espacioRequerido: espacioReq,
              needsDouble
            });
          }
        });
      });

      // Heurística de ordenación MRV (Minimum Remaining Values)
      const teacherPriorityVal = (docId) => {
        const t = docentes.find(d => d.id === docId);
        if (!t) return 2;
        if (t.prioridad === 'Muy alta') return 4;
        if (t.prioridad === 'Alta') return 3;
        if (t.prioridad === 'Baja') return 1;
        return 2;
      };

      const teacherAvailabilityCount = (docId) => {
        const t = docentes.find(d => d.id === docId);
        if (!t || !t.disponibilidad) return 99;
        let count = 0;
        Object.values(t.disponibilidad).forEach(arr => {
          if (Array.isArray(arr)) {
            arr.forEach(val => { if (val) count++; });
          }
        });
        return count > 0 ? count : 99;
      };

      slotsToPlace.sort((a, b) => {
        // 1. Materias compartidas entre múltiples grupos (Talleres) van PRIMERO
        const sharedA = (a.grupoIds && a.grupoIds.length > 1) ? 1 : 0;
        const sharedB = (b.grupoIds && b.grupoIds.length > 1) ? 1 : 0;
        if (sharedA !== sharedB) return sharedB - sharedA;

        // 2. Materias que requieren bloques dobles van DESPUÉS de las compartidas
        const doubleA = a.needsDouble ? 1 : 0;
        const doubleB = b.needsDouble ? 1 : 0;
        if (doubleA !== doubleB) return doubleB - doubleA;

        // 3. Prioridad del Docente
        const prioA = teacherPriorityVal(a.docenteId);
        const prioB = teacherPriorityVal(b.docenteId);
        if (prioA !== prioB) return prioB - prioA;

        // 4. Disponibilidad del Docente
        const availA = teacherAvailabilityCount(a.docenteId);
        const availB = teacherAvailabilityCount(b.docenteId);
        if (availA !== availB) return availA - availB;

        // 5. Requisitos de Espacio
        const spaceA = a.espacioIds && a.espacioIds.some(spId => nonAulaSpaceIds.has(spId)) ? 1 : 0;
        const spaceB = b.espacioIds && b.espacioIds.some(spId => nonAulaSpaceIds.has(spId)) ? 1 : 0;
        if (spaceA !== spaceB) return spaceB - spaceA;

        return 0;
      });



      // 3. Min-Conflicts Optimization
      let iteration = 0;
      
      const getSlotConflictsDetailed = (sIdx, day, m, currentState) => {
        const slot = currentState[sIdx];
        let hardConf = 0;
        let softConf = 0;

        let teacherClashCount = 0;
        let groupClashCount = 0;
        let spaceClashCount = 0;
        let sameDayMatCount = 0;
        let isConsecutiveSameDay = false;
        
        const slotNameLower = slot.materiaNombre.toLowerCase();
        const slotIsTaller = slotNameLower.includes('taller') || slotNameLower.includes('tecnolog');
        const slotTKey = slotIsTaller ? (slot.grupoIds || []).slice().sort().join(',') : null;
        const slotHourIndex = parseInt(slot.id.split('-').pop());

        const materiaModsByDay = {
          'Lunes': [], 'Martes': [], 'Miércoles': [], 'Jueves': [], 'Viernes': [],
          'Sábado': [], 'Sábado ': [], 'Sábado': [], 'Sabado': [], 'Domingo': []
        };

        for (let i = 0; i < currentState.length; i++) {
          if (i === sIdx) continue;
          const s = currentState[i];
          const sNameLower = s.materiaNombre.toLowerCase();
          const sIsTaller = sNameLower.includes('taller') || sNameLower.includes('tecnolog');

          // 1. Cruce Docente
          if (s.dia === day && s.moduloIndex === m && isSameTeacher(s, slot)) {
            teacherClashCount++;
          }

          // 2. Cruce Grupo (ignorar si ambos son talleres)
          if (s.dia === day && s.moduloIndex === m && shareGroup(s, slot)) {
            if (!(slotIsTaller && sIsTaller)) {
              groupClashCount++;
            }
          }

          // Alineación estricta de Talleres: si movemos un taller, penalizamos masivamente si no coincide
          // con el horario original asignado al bloque.
          if (slotIsTaller && sIsTaller) {
            const sTKey = (s.grupoIds || []).slice().sort().join(',');
            if (sTKey === slotTKey) {
              const sHourIndex = parseInt(s.id.split('-').pop());
              if (sHourIndex === slotHourIndex) {
                // Deberían estar exactamente el mismo día y módulo
                if (s.dia !== day || s.moduloIndex !== m) {
                  softConf += 50000; // Penalización insuperable para evitar que se desalineen
                }
              }
            } else {
              // Choque Global de Talleres: Diferente grado (tKey distinto) -> ¡Choque duro!
              if (s.dia === day && s.moduloIndex === m) {
                groupClashCount++; // Tratado como choque de grupo para que el optimizador lo repela
              }
            }
          }

          // 3. Cruce Espacio
          if (s.dia === day && s.moduloIndex === m && shareSpace(s, slot, nonAulaSpaceIds)) {
            spaceClashCount++;
          }

          // 4. Materia del mismo grupo en el mismo día
          if (s.materiaId === slot.materiaId && s.dia === day && shareGroup(s, slot)) {
            sameDayMatCount++;
            if (s.moduloIndex === m - 1 || s.moduloIndex === m + 1) {
              isConsecutiveSameDay = true;
            }
          }
          
          // 5. Agrupar módulos semanales de esta materia para el conteo de bloques dobles
          if (s.materiaId === slot.materiaId && shareGroup(s, slot)) {
            if (materiaModsByDay[s.dia]) {
              materiaModsByDay[s.dia].push(s.moduloIndex);
            }
          }
        }

        // Agregar el módulo evaluado actualmente
        if (materiaModsByDay[day]) {
          materiaModsByDay[day].push(m);
        }

        hardConf += teacherClashCount;
        hardConf += groupClashCount;
        hardConf += spaceClashCount;

        // Disponibilidad de docente
        const docDisp = docenteDisponibilidadMap.get(slot.docenteId);
        if (docDisp?.[day]?.[m] === false) {
          hardConf += 1;
        }

        // Reglas de Distribución Semanal y Módulos Dobles
        if (slot.needsDouble) {
          // Materias de ciencias/talleres: Permitimos hasta 2 horas al día para formar bloques dobles
          if (sameDayMatCount >= 2) {
            softConf += 800; // Penalizamos si intenta meter una 3ra hora el mismo día
          }
          if (sameDayMatCount === 1 && !isConsecutiveSameDay) {
            softConf += 400; // Si hay 2 horas el mismo día, DEBEN ser consecutivas
          }
          
          // Conteo de parejas de horas consecutivas semanales (bloques dobles)
          let doublePairs = 0;
          Object.keys(materiaModsByDay).forEach(dKey => {
            const mods = materiaModsByDay[dKey].sort((a, b) => a - b);
            for (let idx = 0; idx < mods.length - 1; idx++) {
              if (mods[idx+1] - mods[idx] === 1) {
                doublePairs++;
              }
            }
          });
          if (doublePairs === 0) {
            softConf += 150; // Pequeño empuje para forzar que al menos forme un bloque doble
          }
        } else {
          // Español, Matemáticas y materias normales: DEBEN estar esparcidas (1 hora al día máximo)
          if (sameDayMatCount >= 1) {
            softConf += 1000; // Penalización altísima para evitar poner dos horas el mismo día
          }
        }

        // Evitar horas consecutivas excesivas para el docente (leves)
        let teacherAdjacentCount = 0;
        for (let i = 0; i < currentState.length; i++) {
          if (i === sIdx) continue;
          const s = currentState[i];
          if (s.dia === day && (s.moduloIndex === m - 1 || s.moduloIndex === m + 1) && isSameTeacher(s, slot)) {
            teacherAdjacentCount++;
          }
        }
        if (teacherAdjacentCount >= 2) softConf += 5;

        return { hard: hardConf, soft: softConf, total: hardConf * 10000 + softConf };
      };

      // 2. Inicialización codiciosa de estados
      let slotsState = [];
      const tallerAlignmentMap = {}; // key: grupoIds string, value: array de {dia, m} por horaIndex

      for (let i = 0; i < slotsToPlace.length; i++) {
        const slot = slotsToPlace[i];
        let bestCells = [];
        let minScore = 99999999;

        const nameLower = slot.materiaNombre.toLowerCase();
        const isTaller = nameLower.includes('taller') || nameLower.includes('tecnolog');
        const tKey = isTaller ? (slot.grupoIds || []).slice().sort().join(',') : null;
        
        // Extraer el índice de la hora (h) del id del slot
        const parts = slot.id.split('-');
        const slotHourIndex = parseInt(parts[parts.length - 1]);

        if (isTaller && tallerAlignmentMap[tKey] && tallerAlignmentMap[tKey][slotHourIndex]) {
          // Si ya existe una ubicación asignada para esta hora exacta de Taller de este grado, FORZAMOS la alineación
          bestCells = [tallerAlignmentMap[tKey][slotHourIndex]];
          minScore = 0;
        } else {
          dias.forEach(day => {
            for (let m = 0; m < numModulos; m++) {
              const tempState = [...slotsState, { ...slot, dia: day, moduloIndex: m }];
              const scoreObj = getSlotConflictsDetailed(slotsState.length, day, m, tempState);

              if (scoreObj.total < minScore) {
                minScore = scoreObj.total;
                bestCells = [{ day, m }];
              } else if (scoreObj.total === minScore) {
                bestCells.push({ day, m });
              }
            }
          });
        }

        const chosenCell = bestCells.length > 0 
          ? bestCells[Math.floor(Math.random() * bestCells.length)]
          : { day: dias[0], m: 0 }; // Fallback

        slotsState.push({
          ...slot,
          dia: chosenCell.day,
          moduloIndex: chosenCell.m
        });

        // Guardar la ubicación elegida para que el resto de los profesores de Taller del mismo grado se empalmen aquí
        if (isTaller) {
          if (!tallerAlignmentMap[tKey]) tallerAlignmentMap[tKey] = [];
          tallerAlignmentMap[tKey][slotHourIndex] = chosenCell;
        }

        // Yield cada 20 slots para mantener responsivo el navegador
        if (i % 20 === 0) {
          setGenerationProgress({
            current: i + 1,
            total: slotsToPlace.length,
            conflicts: 0,
            stage: 'Inicializando horario...'
          });
          await yieldToMain();
        }
      }

      // 3. Bucle de reparación iterativa (Min-Conflicts)
      let maxIterations = 8000;
      let iteration = 0;

      while (iteration < maxIterations) {
        // Encontrar slots con conflictos
        let hardConflictingIndices = [];
        let softConflictingIndices = [];

        for (let i = 0; i < slotsState.length; i++) {
          const res = getSlotConflictsDetailed(i, slotsState[i].dia, slotsState[i].moduloIndex, slotsState);
          if (res.hard > 0) {
            hardConflictingIndices.push(i);
          } else if (res.soft > 0) {
            softConflictingIndices.push(i);
          }
        }

        const totalHard = hardConflictingIndices.length;
        const totalSoft = softConflictingIndices.length;

        if (totalHard === 0 && totalSoft === 0) {
          break; // Posicionamiento óptimo sin conflictos
        }

        // Seleccionar un slot para reparar (priorizar los que tienen conflictos duros)
        let randIdx;
        let repairingHard = false;
        if (totalHard > 0) {
          randIdx = hardConflictingIndices[Math.floor(Math.random() * totalHard)];
          repairingHard = true;
        } else {
          randIdx = softConflictingIndices[Math.floor(Math.random() * totalSoft)];
        }

        const slotToRepair = slotsState[randIdx];
        let currentScoreObj = getSlotConflictsDetailed(randIdx, slotToRepair.dia, slotToRepair.moduloIndex, slotsState);
        let minScore = currentScoreObj.total;
        let bestCells = [{ day: slotToRepair.dia, m: slotToRepair.moduloIndex }];

        dias.forEach(day => {
          for (let m = 0; m < numModulos; m++) {
            if (day === slotToRepair.dia && m === slotToRepair.moduloIndex) continue;

            const scoreObj = getSlotConflictsDetailed(randIdx, day, m, slotsState);

            // Regla crítica: si estamos optimizando un conflicto blando,
            // NUNCA debemos permitir moverlo a una celda que cree un conflicto duro.
            if (!repairingHard && scoreObj.hard > 0) {
              continue;
            }

            if (scoreObj.total < minScore) {
              minScore = scoreObj.total;
              bestCells = [{ day, m }];
            } else if (scoreObj.total === minScore) {
              bestCells.push({ day, m });
            }
          }
        });

        // Escoger una de las mejores celdas al azar
        const chosenCell = bestCells[Math.floor(Math.random() * bestCells.length)];
        slotsState[randIdx].dia = chosenCell.day;
        slotsState[randIdx].moduloIndex = chosenCell.m;

        iteration++;

        // Yield e informe cada 100 iteraciones
        if (iteration % 100 === 0) {
          setGenerationProgress({
            current: iteration,
            total: maxIterations,
            conflicts: totalHard + totalSoft,
            stage: `Optimizando (Paso ${iteration} / ${maxIterations})...`
          });
          await yieldToMain();
        }
      }

      // 4. Barrido Final Seguro (Sweep)
      let placedSlots = [];
      let unplacedSlots = [];

      slotsState.forEach(slot => {
        // Validar cruces duros reales contra lo ya colocado de forma segura
        const docBusy = placedSlots.some(s => s.dia === slot.dia && s.moduloIndex === slot.moduloIndex && isSameTeacher(s, slot));
        const grpBusy = placedSlots.some(s => s.dia === slot.dia && s.moduloIndex === slot.moduloIndex && shareGroup(s, slot));
        const spcBusy = placedSlots.some(s => s.dia === slot.dia && s.moduloIndex === slot.moduloIndex && shareSpace(s, slot, nonAulaSpaceIds));
        
        const docDisp = docenteDisponibilidadMap.get(slot.docenteId);
        const docUnavailable = docDisp?.[slot.dia]?.[slot.moduloIndex] === false;

        if (docBusy || grpBusy || spcBusy || docUnavailable) {
          unplacedSlots.push(slot);
        } else {
          placedSlots.push(slot);
        }
      });

      // Calcular calidad y huecos
      let gapCount = 0;
      grupos.forEach(g => {
        dias.forEach(day => {
          const dayMods = placedSlots
            .filter(s => (s.grupoId === g.id || (s.grupoIds && s.grupoIds.includes(g.id))) && s.dia === day)
            .map(s => s.moduloIndex)
            .sort((a, b) => a - b);
          
          if (dayMods.length > 1) {
            for (let idx = dayMods[0]; idx < dayMods[dayMods.length - 1]; idx++) {
              if (!dayMods.includes(idx)) gapCount++;
            }
          }
        });
      });

      const totalPlaced = placedSlots.length;
      const totalRequested = slotsToPlace.length;
      const gapPenalty = gapCount * 2;
      const qualityScore = Math.max(0, Math.min(100, Math.round(((totalPlaced / totalRequested) * 100) - gapPenalty)));

      const payload = {
        slots: placedSlots,
        quality: qualityScore,
        conflicts: [],
        horasPendientes: unplacedSlots,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'schools', schoolId, 'horarios_generados', 'current'), payload);
      
      if (unplacedSlots.length > 0) {
        alert(`Generación completada con ${qualityScore}% de eficiencia.\n\n⚠️ ATENCIÓN: Quedaron ${unplacedSlots.length} horas sin asignar debido a empalmes inevitables (saturación del maestro, de los laboratorios o disponibilidad restringida). Las clases empalmadas fueron enviadas a la sección de horas pendientes y no se agregaron a la cuadrícula.`);
      } else {
        alert(`¡Generación completada con éxito! Eficiencia del ${qualityScore}% (${totalPlaced} horas colocadas de ${totalRequested}).`);
      }
    } catch (e) {
      console.error(e);
      alert('Error en el motor de generación horaria.');
    } finally {
      setSaving(false);
      setGenerationProgress({ current: 0, total: 0, conflicts: 0, stage: '' });
    }
  };

  // ==========================================
  // SECCIÓN 9: EDICIÓN MANUAL DRAG AND DROP
  // ==========================================
  const handleDragStart = (slot, index) => {
    setDraggedSlot({ slot, index });
    setConflictWarning('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetDay, targetModIdx) => {
    e.preventDefault();
    if (!draggedSlot) return;

    const { slot, index } = draggedSlot;
    
    if (index < 0) {
      await handlePlacePendingSlot(slot, targetDay, targetModIdx);
      setDraggedSlot(null);
      return;
    }

    // Evitar soltar en el mismo lugar
    if (slot.dia === targetDay && slot.moduloIndex === targetModIdx) {
      setDraggedSlot(null);
      return;
    }

    // 1. Validar conflictos en caliente
    const errors = [];
    
    // Comprobar cruce de docente
    const docClash = generatedSchedule.slots.some((s, idx) => 
      idx !== index && s.dia === targetDay && s.moduloIndex === targetModIdx && isSameTeacher(s, slot)
    );
    if (docClash) {
      errors.push(`El docente ${slot.docenteNombre} ya está ocupado en este módulo.`);
    }

    // Comprobar cruce de grupo
    const grpClash = generatedSchedule.slots.some((s, idx) => 
      idx !== index && s.dia === targetDay && s.moduloIndex === targetModIdx && shareGroup(s, slot)
    );
    if (grpClash) {
      errors.push(`El grupo (o uno de los grupos asociados) ya tiene clase asignada en este módulo.`);
    }

    // Comprobar cruce de espacio
    const spcClash = generatedSchedule.slots.some((s, idx) => 
      idx !== index && s.dia === targetDay && s.moduloIndex === targetModIdx && shareSpace(s, slot)
    );
    if (spcClash) {
      errors.push(`El espacio (o uno de los espacios reservados) ya está ocupado en este módulo.`);
    }

    // Comprobar disponibilidad de docente
    const docObj = docentes.find(d => d.id === slot.docenteId);
    if (docObj?.disponibilidad?.[targetDay]?.[targetModIdx] === false) {
      errors.push(`El docente ${slot.docenteNombre} no está disponible en este módulo.`);
    }

    if (errors.length > 0) {
      setConflictWarning(errors.join(' '));
      setDraggedSlot(null);
      return;
    }

    // 2. Modificar el slot en el estado local
    const updatedSlots = [...generatedSchedule.slots];
    updatedSlots[index] = {
      ...slot,
      dia: targetDay,
      moduloIndex: targetModIdx,
      grupoIds: slotGIds,
      espacioIds: slotSpcIds
    };

    // Recalcular calidad y huecos
    let gapCount = 0;
    grupos.forEach(g => {
      config.diasSemana.forEach(day => {
        const dayMods = updatedSlots
          .filter(s => (s.grupoId === g.id || (s.grupoIds && s.grupoIds.includes(g.id))) && s.dia === day)
          .map(s => s.moduloIndex)
          .sort((a, b) => a - b);
        
        if (dayMods.length > 1) {
          for (let idx = dayMods[0]; idx < dayMods[dayMods.length - 1]; idx++) {
            if (!dayMods.includes(idx)) gapCount++;
          }
        }
      });
    });

    const totalPlaced = updatedSlots.length;
    const totalRequested = asignaciones.reduce((acc, curr) => acc + getRealHoursForAsig(curr), 0);
    const qualityScore = Math.max(0, Math.min(100, Math.round(((totalPlaced / totalRequested) * 100) - (gapCount * 2))));

    const updatedSchedule = {
      ...generatedSchedule,
      slots: updatedSlots,
      quality: qualityScore,
      conflicts: [],
      updatedAt: new Date()
    };

    setGeneratedSchedule(updatedSchedule);
    setDraggedSlot(null);

    // Guardar cambios en Firestore
    try {
      await setDoc(doc(db, 'schools', schoolId, 'horarios_generados', 'current'), updatedSchedule);
    } catch (e) {
      console.error('Error al guardar edición manual:', e);
    }
  };

  // Place a pending (unplaced) hour manually
  const handlePlacePendingSlot = async (slot, targetDay, targetModIdx) => {
    // 1. Validar conflictos
    const errors = [];
    const docClash = generatedSchedule.slots.some(s => s.dia === targetDay && s.moduloIndex === targetModIdx && isSameTeacher(s, slot));
    if (docClash) errors.push(`El docente ${slot.docenteNombre} ya está ocupado.`);
    
    const grpClash = generatedSchedule.slots.some(s => s.dia === targetDay && s.moduloIndex === targetModIdx && shareGroup(s, slot));
    if (grpClash) errors.push(`El grupo (o uno de los grupos asociados) ya tiene clase.`);
    
    const spcClash = generatedSchedule.slots.some(s => s.dia === targetDay && s.moduloIndex === targetModIdx && shareSpace(s, slot));
    if (spcClash) errors.push(`El espacio ya está ocupado.`);

    const docObj = docentes.find(d => d.id === slot.docenteId);
    if (docObj?.disponibilidad?.[targetDay]?.[targetModIdx] === false) {
      errors.push(`Docente no disponible.`);
    }

    if (errors.length > 0) {
      alert(`No se puede colocar: ${errors.join(' ')}`);
      return;
    }

    // 2. Colocar
    const newPlaced = {
      ...slot,
      dia: targetDay,
      moduloIndex: targetModIdx,
      grupoIds: slotGIds,
      espacioIds: slotSpcIds
    };

    const newSlots = [...generatedSchedule.slots, newPlaced];
    const newPending = generatedSchedule.horasPendientes.filter(h => h.id !== slot.id);

    const updatedSchedule = {
      ...generatedSchedule,
      slots: newSlots,
      horasPendientes: newPending,
      updatedAt: new Date()
    };

    setGeneratedSchedule(updatedSchedule);

    try {
      await setDoc(doc(db, 'schools', schoolId, 'horarios_generados', 'current'), updatedSchedule);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDropGlobal = async (e, targetRowId, targetDay, targetModIdx, resourceType) => {
    e.preventDefault();
    if (!draggedSlot) return;
    
    const { slot, index } = draggedSlot;
    
    // Create updated copy
    const updatedSlot = { ...slot };
    if (resourceType === 'grupo') {
      if (targetRowId === 'taller-sin-grupo') {
        updatedSlot.grupoId = '';
        updatedSlot.grupoIds = [];
        updatedSlot.grupoNombre = 'Taller (Sin grupo)';
      } else {
        const gObj = grupos.find(g => g.id === targetRowId);
        if (gObj) {
          updatedSlot.grupoId = targetRowId;
          updatedSlot.grupoIds = [targetRowId];
          updatedSlot.grupoNombre = `${gObj.grado}°${gObj.grupo}`;
        }
      }
    } else if (resourceType === 'docente') {
      const dObj = docentes.find(d => d.id === targetRowId);
      if (dObj) {
        updatedSlot.docenteId = targetRowId;
        updatedSlot.docenteNombre = dObj.nombre;
      }
    } else if (resourceType === 'espacio') {
      const esObj = espacios.find(es => es.id === targetRowId);
      if (esObj) {
        updatedSlot.espacioId = targetRowId;
        updatedSlot.espacioIds = [targetRowId];
        updatedSlot.espacioNombre = esObj.nombre;
      } else if (targetRowId === '') {
        updatedSlot.espacioId = '';
        updatedSlot.espacioIds = [];
        updatedSlot.espacioNombre = 'Aula';
      }
    }

    // 1. Validar conflictos en caliente
    const errors = [];
    
    // Comprobar cruce de docente
    const docClash = generatedSchedule.slots.some((s, idx) => 
      idx !== index && s.dia === targetDay && s.moduloIndex === targetModIdx && isSameTeacher(s, updatedSlot)
    );
    if (docClash) {
      errors.push(`El docente ${updatedSlot.docenteNombre} ya está ocupado en este módulo.`);
    }

    // Comprobar cruce de grupo
    const grpClash = generatedSchedule.slots.some((s, idx) => 
      idx !== index && s.dia === targetDay && s.moduloIndex === targetModIdx && shareGroup(s, updatedSlot)
    );
    if (grpClash) {
      errors.push(`El grupo ya tiene clase asignada en este módulo.`);
    }

    // Comprobar cruce de espacio
    const spcClash = generatedSchedule.slots.some((s, idx) => 
      idx !== index && s.dia === targetDay && s.moduloIndex === targetModIdx && shareSpace(s, updatedSlot)
    );
    if (spcClash) {
      errors.push(`El espacio ya está ocupado en este módulo.`);
    }

    // Comprobar disponibilidad de docente
    const docObj = docentes.find(d => d.id === updatedSlot.docenteId);
    if (docObj?.disponibilidad?.[targetDay]?.[targetModIdx] === false) {
      errors.push(`El docente ${updatedSlot.docenteNombre} no está disponible en este módulo.`);
    }

    if (errors.length > 0) {
      setConflictWarning(errors.join(' '));
      setDraggedSlot(null);
      return;
    }

    // 2. Modificar en el estado local
    const newSlots = [...generatedSchedule.slots];
    const updatedPlaced = {
      ...updatedSlot,
      dia: targetDay,
      moduloIndex: targetModIdx,
      grupoIds: slotGIds,
      espacioIds: slotSpcIds
    };

    if (index >= 0) {
      newSlots[index] = updatedPlaced;
    } else {
      newSlots.push(updatedPlaced);
    }

    const newPending = index < 0 
      ? generatedSchedule.horasPendientes.filter(h => h.id !== slot.id)
      : generatedSchedule.horasPendientes;

    // Recalcular calidad y huecos
    let gapCount = 0;
    grupos.forEach(g => {
      config.diasSemana.forEach(day => {
        const dayMods = newSlots
          .filter(s => (s.grupoId === g.id || (s.grupoIds && s.grupoIds.includes(g.id))) && s.dia === day)
          .map(s => s.moduloIndex)
          .sort((a, b) => a - b);
        
        if (dayMods.length > 1) {
          for (let idx = dayMods[0]; idx < dayMods[dayMods.length - 1]; idx++) {
            if (!dayMods.includes(idx)) gapCount++;
          }
        }
      });
    });

    const totalPlaced = newSlots.length;
    const totalRequested = asignaciones.reduce((acc, curr) => acc + getRealHoursForAsig(curr), 0);
    const qualityScore = Math.max(0, Math.min(100, Math.round(((totalPlaced / totalRequested) * 100) - (gapCount * 2))));

    const updatedSchedule = {
      ...generatedSchedule,
      slots: newSlots,
      horasPendientes: newPending,
      quality: qualityScore,
      conflicts: [],
      updatedAt: new Date()
    };

    setGeneratedSchedule(updatedSchedule);
    setDraggedSlot(null);

    // Guardar cambios en Firestore
    try {
      await setDoc(doc(db, 'schools', schoolId, 'horarios_generados', 'current'), updatedSchedule);
    } catch (e) {
      console.error('Error al guardar edición manual global:', e);
    }
  };

  // Remove a placed slot (send back to pending)
  const handleRemovePlacedSlot = async (slotIndex) => {
    const slot = generatedSchedule.slots[slotIndex];
    const newSlots = generatedSchedule.slots.filter((_, idx) => idx !== slotIndex);
    
    // Clean coordinates
    const { dia, moduloIndex, ...cleanSlot } = slot;
    const newPending = [...generatedSchedule.horasPendientes, cleanSlot];

    const updatedSchedule = {
      ...generatedSchedule,
      slots: newSlots,
      horasPendientes: newPending,
      updatedAt: new Date()
    };

    setGeneratedSchedule(updatedSchedule);

    try {
      await setDoc(doc(db, 'schools', schoolId, 'horarios_generados', 'current'), updatedSchedule);
    } catch (e) {
      console.error(e);
    }
  };

  // Excel Export Utility
  const handleExportExcel = (tableId, filename) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    const html = table.outerHTML;
    const url = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xls`;
    link.click();
  };

  // Print Utility
  const handlePrint = () => {
    window.print();
  };

  // Calculation of times for rows
  const getSlotTimeRange = (idx) => {
    const [startH, startM] = config.horaEntrada.split(':').map(Number);
    const duration = Number(config.duracionModulo);
    
    const recesoStart = config.recesoInicio;
    const recesoDur = 30; // 30min standard or dynamic

    // Compute cumulative minutes
    let totalMinutes = idx * duration;
    
    // Check if recess has happened
    const currentStartTotal = startH * 60 + startM + totalMinutes;
    const [recH, recM] = recesoStart.split(':').map(Number);
    const recesoStartTotal = recH * 60 + recM;

    if (currentStartTotal >= recesoStartTotal) {
      // Add recess duration
      totalMinutes += recesoDur;
    }

    const finalStartTotal = startH * 60 + startM + (idx * duration);
    const startHour = Math.floor(finalStartTotal / 60);
    const startMin = finalStartTotal % 60;
    
    const endTotal = finalStartTotal + duration;
    const endHour = Math.floor(endTotal / 60);
    const endMin = endTotal % 60;

    const format = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    return `${format(startHour, startMin)} - ${format(endHour, endMin)}`;
  };

  // Filter Catalogs List locally
  const filteredDocentes = docentes.filter(d => d.nombre.toLowerCase().includes(searchDocente.toLowerCase()) || d.academia.toLowerCase().includes(searchDocente.toLowerCase()));
  const filteredGrupos = grupos.filter(g => `${g.grado}°${g.grupo}`.toLowerCase().includes(searchGrupo.toLowerCase()) || (g.tutor || '').toLowerCase().includes(searchGrupo.toLowerCase()));
  const filteredMaterias = materias.filter(m => m.nombre.toLowerCase().includes(searchMateria.toLowerCase()) || m.grado.toString().includes(searchMateria));
  const filteredEspacios = espacios.filter(es => es.nombre.toLowerCase().includes(searchEspacio.toLowerCase()) || es.tipo.toLowerCase().includes(searchEspacio.toLowerCase()));

  return (
    <div className="module-container">
      <div className="tab-header">
        <div>
          <h1 className="module-title">Generación y Gestión de Horarios</h1>
          <p className="module-description">Permite coordinar asignaciones, espacios y personal de forma automatizada.</p>
        </div>
      </div>

      <div className="horarios-layout">
        {/* Navigation Sidebar */}
        <aside className="horarios-tabs-sidebar">
          <button className={`horarios-tab-btn ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
            <Settings size={18} /> Configuración General
          </button>
          <button className={`horarios-tab-btn ${activeTab === 'docentes' ? 'active' : ''}`} onClick={() => setActiveTab('docentes')}>
            <Users size={18} /> Catálogo de Docentes
          </button>
          <button className={`horarios-tab-btn ${activeTab === 'grupos' ? 'active' : ''}`} onClick={() => setActiveTab('grupos')}>
            <FolderKanban size={18} /> Grupos Escolares
          </button>
          <button className={`horarios-tab-btn ${activeTab === 'materias' ? 'active' : ''}`} onClick={() => setActiveTab('materias')}>
            <BookOpen size={18} /> Catálogo de Materias
          </button>
          <button className={`horarios-tab-btn ${activeTab === 'espacios' ? 'active' : ''}`} onClick={() => setActiveTab('espacios')}>
            <Building2 size={18} /> Espacios y Aulas
          </button>
          <button className={`horarios-tab-btn ${activeTab === 'asignaciones' ? 'active' : ''}`} onClick={() => setActiveTab('asignaciones')}>
            <Link2 size={18} /> Asignación Académica
          </button>
          <button className={`horarios-tab-btn ${activeTab === 'generador' ? 'active' : ''}`} onClick={() => setActiveTab('generador')}>
            <Sparkles size={18} /> Generador & Resultados
          </button>
          <button className={`horarios-tab-btn ${activeTab === 'impresion' ? 'active' : ''}`} onClick={() => setActiveTab('impresion')}>
            <Printer size={18} /> Formatos de Impresión
          </button>
        </aside>

        {/* Content Tabs */}
        <main className="horarios-content-area">
          
          {/* ======================================= */}
          {/* TAB 1: CONFIGURACIÓN GENERAL            */}
          {/* ======================================= */}
          {activeTab === 'config' && (
            <div>
              <div className="tab-header" style={{ borderBottom: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Configuración de la Jornada</h2>
                  <p className="tab-header-description">Define las horas, duración de módulos y días lectivos.</p>
                </div>
              </div>
              <form onSubmit={handleSaveConfig} className="config-form">
                <div className="config-form-grid">
                  <div className="form-group">
                    <label>Hora de Entrada</label>
                    <input type="time" value={config.horaEntrada} onChange={e => setConfig(prev => ({ ...prev, horaEntrada: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Hora de Salida</label>
                    <input type="time" value={config.horaSalida} onChange={e => setConfig(prev => ({ ...prev, horaSalida: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Duración de cada Módulo (minutos)</label>
                    <input type="number" value={config.duracionModulo} onChange={e => setConfig(prev => ({ ...prev, duracionModulo: Number(e.target.value) }))} required />
                  </div>
                  <div className="form-group">
                    <label>Número de Módulos diarios</label>
                    <input type="number" value={config.numModulos} onChange={e => setConfig(prev => ({ ...prev, numModulos: Number(e.target.value) }))} required />
                  </div>
                  <div className="form-group">
                    <label>Inicio del Receso</label>
                    <input type="time" value={config.recesoInicio} onChange={e => setConfig(prev => ({ ...prev, recesoInicio: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Fin del Receso</label>
                    <input type="time" value={config.recesoFin} onChange={e => setConfig(prev => ({ ...prev, recesoFin: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Ciclo Escolar</label>
                    <input type="text" value={config.cicloEscolar} onChange={e => setConfig(prev => ({ ...prev, cicloEscolar: e.target.value }))} placeholder="Ej. 2025-2026" required />
                  </div>
                  <div className="form-group full-width">
                    <label>Días de la semana lectivos</label>
                    <div className="checkbox-group-days">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => {
                        const checked = config.diasSemana.includes(d);
                        return (
                          <label key={d} className="checkbox-day-label">
                            <input 
                              type="checkbox" 
                              checked={checked} 
                              onChange={e => {
                                const newDays = e.target.checked 
                                  ? [...config.diasSemana, d]
                                  : config.diasSemana.filter(day => day !== d);
                                setConfig(prev => ({ ...prev, diasSemana: newDays }));
                              }}
                            />
                            <span>{d}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </form>
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 2: CATÁLOGO DE DOCENTES             */}
          {/* ======================================= */}
          {activeTab === 'docentes' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Catálogo de Docentes</h2>
                  <p className="tab-header-description">Gestiona la carga horaria y disponibilidad de la plantilla docente.</p>
                </div>
              </div>

              <div className="catalog-toolbar">
                <div className="catalog-search">
                  <input 
                    type="text" 
                    placeholder="Buscar docente o academia..."
                    value={searchDocente}
                    onChange={e => setSearchDocente(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={openNewDocente}>
                  <Plus size={16} /> Registrar Docente
                </button>
              </div>

              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Academia</th>
                    <th>Horas Plazas</th>
                    <th>Prioridad</th>
                    <th>Disponibilidad</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocentes.map(d => (
                    <tr key={d.id}>
                      <td><strong>{d.nombre}</strong></td>
                      <td>{d.academia || '---'}</td>
                      <td>{d.horasAsignadas || 0} hrs</td>
                      <td>
                        <span className={`badge badge-${d.prioridad === 'Muy alta' ? 'error' : d.prioridad === 'Alta' ? 'warning' : d.prioridad === 'Media' ? 'info' : 'neutral'}`}>
                          {d.prioridad}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {Object.values(d.disponibilidad || {}).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.filter(Boolean).length : 0), 0)} módulos disp.
                        </small>
                      </td>
                      <td className="actions-cell">
                        <button className="btn-icon-small" onClick={() => openEditDocente(d)}><Edit2 size={15} /></button>
                        <button className="btn-icon-small text-error" onClick={() => handleDeleteDocente(d.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredDocentes.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">No hay docentes registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* MODAL REGISTRO DOCENTE */}
              {modalOpen.docente && (
                <div className="modal-overlay">
                  <div className="modal-content modal-large">
                    <div className="modal-header">
                      <h3>{editItem.docente ? 'Editar Docente' : 'Nuevo Docente'}</h3>
                      <button className="btn-close" onClick={() => setModalOpen(prev => ({ ...prev, docente: false }))}>×</button>
                    </div>
                    <form onSubmit={handleSaveDocente}>
                      <div className="config-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label>Nombre Completo *</label>
                          <input type="text" value={formDocente.nombre} onChange={e => setFormDocente(prev => ({ ...prev, nombre: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                          <label>Academia / Departamento</label>
                          <input type="text" value={formDocente.academia} onChange={e => setFormDocente(prev => ({ ...prev, academia: e.target.value }))} placeholder="Ej. Matemáticas" />
                        </div>
                        <div className="form-group">
                          <label>Horas Asignadas (Base/Contrato)</label>
                          <input type="number" value={formDocente.horasAsignadas} onChange={e => setFormDocente(prev => ({ ...prev, horasAsignadas: Number(e.target.value) }))} />
                        </div>
                        <div className="form-group">
                          <label>Horas Frente a Grupo Reales</label>
                          <input type="number" value={formDocente.horasFrenteGrupo} onChange={e => setFormDocente(prev => ({ ...prev, horasFrenteGrupo: Number(e.target.value) }))} />
                        </div>
                        <div className="form-group">
                          <label>Prioridad de Acomodo</label>
                          <select value={formDocente.prioridad} onChange={e => setFormDocente(prev => ({ ...prev, prioridad: e.target.value }))}>
                            <option value="Muy alta">Muy alta</option>
                            <option value="Alta">Alta</option>
                            <option value="Media">Media</option>
                            <option value="Baja">Baja</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 3' }}>
                          <label>Restricciones de Horario (Texto)</label>
                          <input type="text" value={formDocente.restricciones} onChange={e => setFormDocente(prev => ({ ...prev, restricciones: e.target.value }))} placeholder="Ej. No colocar los miércoles por maestría." />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 3' }}>
                          <label>Observaciones</label>
                          <input type="text" value={formDocente.observaciones} onChange={e => setFormDocente(prev => ({ ...prev, observaciones: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 3' }}>
                          <label>Materias que Imparte (Selecciona las materias registradas para este docente)</label>
                          <div className="checkbox-scroll-list">
                            {materias.map(m => {
                              const isChecked = formDocente.materiasIds?.includes(m.id);
                              return (
                                <label key={m.id} className="checkbox-item">
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setFormDocente(prev => {
                                        const list = prev.materiasIds ? [...prev.materiasIds] : [];
                                        if (checked) {
                                          if (!list.includes(m.id)) list.push(m.id);
                                        } else {
                                          const idx = list.indexOf(m.id);
                                          if (idx !== -1) list.splice(idx, 1);
                                        }
                                        return { ...prev, materiasIds: list };
                                      });
                                    }}
                                  />
                                  <span>{m.nombre} ({m.grado}° grado)</span>
                                </label>
                              );
                            })}
                            {materias.length === 0 && <span className="text-muted">No hay materias registradas en el catálogo.</span>}
                          </div>
                        </div>
                      </div>

                      {/* Verfügbarkeits-Tabelle */}
                      <div className="availability-selector-group">
                        <h4>Disponibilidad Semanal (Verde = Disponible, Rojo = No disponible)</h4>
                        <table className="availability-grid-table">
                          <thead>
                            <tr>
                              <th>Módulo / Hora</th>
                              {config.diasSemana.map(d => <th key={d}>{d}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {Array(config.numModulos).fill(0).map((_, idx) => (
                              <tr key={idx}>
                                <td>
                                  <strong>Mod. {idx + 1}</strong>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{getSlotTimeRange(idx)}</div>
                                </td>
                                {config.diasSemana.map(d => {
                                  const isAvail = formDocente.disponibilidad?.[d]?.[idx] !== false;
                                  return (
                                    <td key={d}>
                                      <button 
                                        type="button"
                                        onClick={() => toggleDisponibilidad(d, idx)}
                                        className={`availability-cell-btn ${isAvail ? 'available' : 'unavailable'}`}
                                      >
                                        {isAvail ? 'Sí' : 'No'}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(prev => ({ ...prev, docente: false }))}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar Docente</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 3: GRUPOS ESCOLARES                 */}
          {/* ======================================= */}
          {activeTab === 'grupos' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Grupos Escolares</h2>
                  <p className="tab-header-description">Gestiona los grados y grupos que conforman la matrícula.</p>
                </div>
              </div>

              <div className="catalog-toolbar">
                <div className="catalog-search">
                  <input 
                    type="text" 
                    placeholder="Buscar grado, grupo o tutor..."
                    value={searchGrupo}
                    onChange={e => setSearchGrupo(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={openNewGrupo}>
                  <Plus size={16} /> Registrar Grupo
                </button>
              </div>

              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Grado y Grupo</th>
                    <th>Turno</th>
                    <th>Alumnos</th>
                    <th>Docente Tutor</th>
                    <th>Observaciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrupos.map(g => (
                    <tr key={g.id}>
                      <td><strong>{g.grado}°{g.grupo}</strong></td>
                      <td>{g.turno}</td>
                      <td>{g.alumnos || 0} alumnos</td>
                      <td>{g.tutor || '---'}</td>
                      <td>{g.observaciones || '---'}</td>
                      <td className="actions-cell">
                        <button className="btn-icon-small" onClick={() => openEditGrupo(g)}><Edit2 size={15} /></button>
                        <button className="btn-icon-small text-error" onClick={() => handleDeleteGrupo(g.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredGrupos.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">No hay grupos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* MODAL REGISTRO GRUPO */}
              {modalOpen.grupo && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{editItem.grupo ? 'Editar Grupo' : 'Nuevo Grupo'}</h3>
                      <button className="btn-close" onClick={() => setModalOpen(prev => ({ ...prev, grupo: false }))}>×</button>
                    </div>
                    <form onSubmit={handleSaveGrupo}>
                      <div className="form-group">
                        <label>Grado *</label>
                        <input type="text" value={formGrupo.grado} onChange={e => setFormGrupo(prev => ({ ...prev, grado: e.target.value }))} placeholder="Ej. 1" required />
                      </div>
                      <div className="form-group">
                        <label>Grupo *</label>
                        <input type="text" value={formGrupo.grupo} onChange={e => setFormGrupo(prev => ({ ...prev, grupo: e.target.value }))} placeholder="Ej. A" required />
                      </div>
                      <div className="form-group">
                        <label>Turno</label>
                        <select value={formGrupo.turno} onChange={e => setFormGrupo(prev => ({ ...prev, turno: e.target.value }))}>
                          <option value="Matutino">Matutino</option>
                          <option value="Vespertino">Vespertino</option>
                          <option value="Nocturno">Nocturno</option>
                          <option value="Tiempo Completo">Tiempo Completo</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Número de alumnos</label>
                        <input type="number" value={formGrupo.alumnos} onChange={e => setFormGrupo(prev => ({ ...prev, alumnos: Number(e.target.value) }))} />
                      </div>
                      <div className="form-group">
                        <label>Docente Tutor</label>
                        <input type="text" value={formGrupo.tutor} onChange={e => setFormGrupo(prev => ({ ...prev, tutor: e.target.value }))} placeholder="Nombre completo" />
                      </div>
                      <div className="form-group">
                        <label>Observaciones</label>
                        <input type="text" value={formGrupo.observaciones} onChange={e => setFormGrupo(prev => ({ ...prev, observaciones: e.target.value }))} />
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(prev => ({ ...prev, grupo: false }))}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar Grupo</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 4: CATÁLOGO DE MATERIAS             */}
          {/* ======================================= */}
          {activeTab === 'materias' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Catálogo de Materias</h2>
                  <p className="tab-header-description">Administra las asignaturas escolares y la carga horaria requerida.</p>
                </div>
              </div>

              <div className="catalog-toolbar">
                <div className="catalog-search">
                  <input 
                    type="text" 
                    placeholder="Buscar materia o grado..."
                    value={searchMateria}
                    onChange={e => setSearchMateria(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={openNewMateria}>
                  <Plus size={16} /> Registrar Materia
                </button>
              </div>

              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Asignatura / Materia</th>
                    <th>Grado</th>
                    <th>Horas Semanales</th>
                    <th>Espacio Requerido</th>
                    <th>Observaciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterias.map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.nombre}</strong></td>
                      <td>{m.grado}° grado</td>
                      <td>{m.horasSemanales} hrs</td>
                      <td>{m.espacioRequerido}</td>
                      <td>{m.observaciones || '---'}</td>
                      <td className="actions-cell">
                        <button className="btn-icon-small" onClick={() => openEditMateria(m)}><Edit2 size={15} /></button>
                        <button className="btn-icon-small text-error" onClick={() => handleDeleteMateria(m.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredMaterias.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">No hay materias registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* MODAL REGISTRO MATERIA */}
              {modalOpen.materia && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{editItem.materia ? 'Editar Materia' : 'Nueva Materia'}</h3>
                      <button className="btn-close" onClick={() => setModalOpen(prev => ({ ...prev, materia: false }))}>×</button>
                    </div>
                    <form onSubmit={handleSaveMateria}>
                      <div className="form-group">
                        <label>Nombre de la Materia *</label>
                        <input type="text" value={formMateria.nombre} onChange={e => setFormMateria(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej. Matemáticas I" required />
                      </div>
                      <div className="form-group">
                        <label>Grado Escolar *</label>
                        <input type="text" value={formMateria.grado} onChange={e => setFormMateria(prev => ({ ...prev, grado: e.target.value }))} placeholder="Ej. 1" required />
                      </div>
                      <div className="form-group">
                        <label>Horas Semanales *</label>
                        <input type="number" value={formMateria.horasSemanales} onChange={e => setFormMateria(prev => ({ ...prev, horasSemanales: Number(e.target.value) }))} min={1} required />
                      </div>
                      <div className="form-group">
                        <label>Espacio Requerido *</label>
                        <select value={formMateria.espacioRequerido} onChange={e => setFormMateria(prev => ({ ...prev, espacioRequerido: e.target.value }))} required>
                          <option value="Aula">Aula común</option>
                          <option value="Laboratorio">Laboratorio</option>
                          <option value="Taller">Taller</option>
                          <option value="Cancha">Cancha Deportiva</option>
                          <option value="Aula de medios">Aula de medios</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Color Identificador *</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {SUBJECT_COLORS.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setFormMateria(prev => ({ ...prev, color: c }))}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: c,
                                border: formMateria.color === c ? '2.5px solid #1e293b' : '1.5px solid #cbd5e1',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                transform: formMateria.color === c ? 'scale(1.15)' : 'none',
                                boxShadow: formMateria.color === c ? '0 0 8px rgba(0,0,0,0.15)' : 'none'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Observaciones</label>
                        <input type="text" value={formMateria.observaciones} onChange={e => setFormMateria(prev => ({ ...prev, observaciones: e.target.value }))} />
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(prev => ({ ...prev, materia: false }))}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar Materia</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 5: ESPACIOS Y AULAS                 */}
          {/* ======================================= */}
          {activeTab === 'espacios' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Espacios y Aulas</h2>
                  <p className="tab-header-description">Define los salones y espacios especializados disponibles.</p>
                </div>
              </div>

              <div className="catalog-toolbar">
                <div className="catalog-search">
                  <input 
                    type="text" 
                    placeholder="Buscar espacio..."
                    value={searchEspacio}
                    onChange={e => setSearchEspacio(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={openNewEspacio}>
                  <Plus size={16} /> Registrar Espacio
                </button>
              </div>

              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Nombre / Ubicación</th>
                    <th>Tipo</th>
                    <th>Capacidad</th>
                    <th>Observaciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEspacios.map(es => (
                    <tr key={es.id}>
                      <td><strong>{es.nombre}</strong></td>
                      <td>{es.tipo}</td>
                      <td>{es.capacidad || 0} personas</td>
                      <td>{es.observaciones || '---'}</td>
                      <td className="actions-cell">
                        <button className="btn-icon-small" onClick={() => openEditEspacio(es)}><Edit2 size={15} /></button>
                        <button className="btn-icon-small text-error" onClick={() => handleDeleteEspacio(es.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredEspacios.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">No hay espacios registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* MODAL REGISTRO ESPACIO */}
              {modalOpen.espacio && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{editItem.espacio ? 'Editar Espacio' : 'Nuevo Espacio'}</h3>
                      <button className="btn-close" onClick={() => setModalOpen(prev => ({ ...prev, espacio: false }))}>×</button>
                    </div>
                    <form onSubmit={handleSaveEspacio}>
                      <div className="form-group">
                        <label>Nombre del Espacio *</label>
                        <input type="text" value={formEspacio.nombre} onChange={e => setFormEspacio(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej. Aula 101, Laboratorio de Física" required />
                      </div>
                      <div className="form-group">
                        <label>Tipo de Espacio *</label>
                        <select value={formEspacio.tipo} onChange={e => setFormEspacio(prev => ({ ...prev, tipo: e.target.value }))} required>
                          <option value="Aula">Aula común</option>
                          <option value="Laboratorio">Laboratorio</option>
                          <option value="Taller">Taller</option>
                          <option value="Cancha">Cancha Deportiva</option>
                          <option value="Aula de medios">Aula de medios</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Capacidad (personas)</label>
                        <input type="number" value={formEspacio.capacidad} onChange={e => setFormEspacio(prev => ({ ...prev, capacidad: Number(e.target.value) }))} />
                      </div>
                      <div className="form-group">
                        <label>Observaciones</label>
                        <input type="text" value={formEspacio.observaciones} onChange={e => setFormEspacio(prev => ({ ...prev, observaciones: e.target.value }))} />
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(prev => ({ ...prev, espacio: false }))}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar Espacio</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 6: ASIGNACIÓN ACADÉMICA             */}
          {/* ======================================= */}
          {activeTab === 'asignaciones' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Asignación Académica</h2>
                  <p className="tab-header-description">Vincula las materias con sus respectivos docentes, grupos y espacios.</p>
                </div>
              </div>

              <div className="catalog-toolbar">
                <div>
                  <small className="text-muted">Total de asignaciones: {asignaciones.length}</small>
                </div>
                <button className="btn-primary" onClick={openNewAsignacion} disabled={docentes.length === 0 || materias.length === 0 || grupos.length === 0}>
                  <Plus size={16} /> Crear Asignación
                </button>
              </div>

              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Docente</th>
                    <th>Materia</th>
                    <th>Grupo</th>
                    <th>Horas Semanales</th>
                    <th>Espacio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asignaciones.map(a => {
                    const hours = Number(a.horasSemanales || 0);
                    const numGroups = a.grupoIds?.length || 1;
                    const nameLower = (a.materiaNombre || '').toLowerCase();
                    const isTaller = nameLower.includes('taller') || nameLower.includes('tecnologia') || nameLower.includes('tecnología');
                    const isSplit = !isTaller && numGroups > 1;
                    const hoursPerGroup = numGroups > 1 ? Math.max(1, Math.floor(hours / numGroups)) : hours;
                    
                    return (
                      <tr key={a.id}>
                        <td><strong>{a.docenteNombre}</strong></td>
                        <td>{a.materiaNombre}</td>
                        <td><span className="badge badge-info">{a.grupoNombre}</span></td>
                        <td className="text-center">
                          {isSplit ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{ fontWeight: '600', color: '#0f172a' }}>{hours} hrs total</span>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({hoursPerGroup} hrs x {numGroups} grupos)</span>
                            </div>
                          ) : (
                            <span>{hours} hrs/sem {isTaller && numGroups > 1 ? <small className="text-muted">(Compartida)</small> : ''}</span>
                          )}
                        </td>
                        <td>{a.espacioNombre || <span className="text-muted">No requerido (Aula)</span>}</td>
                        <td className="actions-cell">
                          <button className="btn-icon-small" onClick={() => openEditAsignacion(a)}><Edit2 size={15} /></button>
                          <button className="btn-icon-small text-error" onClick={() => handleDeleteAsignacion(a.id)}><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {asignaciones.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No hay asignaciones creadas. Asegúrate de registrar docentes, grupos y materias primero.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* MODAL REGISTRO ASIGNACIÓN */}
              {modalOpen.asignacion && (() => {
                const getRealHoursForAsig = (asig) => Number(asig.horasSemanales || 0);
                const selectedDocenteObj = docentes.find(d => d.id === formAsignacion.docenteId);
                const totalDocenteHours = selectedDocenteObj ? Number(selectedDocenteObj.horasAsignadas || 0) : 0;
                const assignedHours = asignaciones
                  .filter(a => a.docenteId === formAsignacion.docenteId && (!editItem.asignacion || a.id !== editItem.asignacion.id))
                  .reduce((sum, a) => sum + getRealHoursForAsig(a), 0);
                const currentAsigHours = getRealHoursForAsig(formAsignacion);
                const newTotalHours = assignedHours + currentAsigHours;
                const isOverHours = selectedDocenteObj && totalDocenteHours > 0 && newTotalHours > totalDocenteHours;
                const docenteMateriasIds = selectedDocenteObj?.materiasIds || [];
                const filteredMateriasForDocente = showAllMateriasInAssignment 
                  ? materias 
                  : materias.filter(m => docenteMateriasIds.includes(m.id));

                return (
                  <div className="modal-overlay">
                    <div className="modal-content modal-large" style={{ maxWidth: '650px' }}>
                      <div className="modal-header">
                        <h3>{editItem.asignacion ? 'Editar Asignación' : 'Nueva Asignación'}</h3>
                        <button className="btn-close" onClick={() => setModalOpen(prev => ({ ...prev, asignacion: false }))}>×</button>
                      </div>
                      <form onSubmit={handleSaveAsignacion}>
                        {/* Carga del Docente en Tiempo Real */}
                        {selectedDocenteObj && totalDocenteHours > 0 && (
                          <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span>Carga de <strong>{selectedDocenteObj.nombre}</strong>:</span>
                              <span><strong>{assignedHours} / {totalDocenteHours} hrs</strong> asignadas</span>
                            </div>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  height: '100%', 
                                  width: `${Math.min(100, (assignedHours / totalDocenteHours) * 100)}%`, 
                                  background: isOverHours ? '#ef4444' : '#10b981', 
                                  transition: 'width 0.3s' 
                                }} 
                              />
                            </div>
                            {isOverHours && (
                              <div style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', marginTop: '6px', fontWeight: '500' }}>
                                <AlertCircle size={14} />
                                <span>Con esta asignación ({currentAsigHours} hrs reales) sumará {newTotalHours} hrs, superando su plaza ({totalDocenteHours} hrs).</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="config-form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                          <div className="form-group">
                            <label>Docente *</label>
                            <select value={formAsignacion.docenteId} onChange={e => handleDocenteChange(e.target.value)} required>
                              {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ margin: 0 }}>Materia *</label>
                              {selectedDocenteObj?.materiasIds?.length > 0 && (
                                <label style={{ margin: 0, fontWeight: 'normal', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={showAllMateriasInAssignment} 
                                    onChange={e => setShowAllMateriasInAssignment(e.target.checked)} 
                                  />
                                  Mostrar todas
                                </label>
                              )}
                            </div>
                            <select value={formAsignacion.materiaId} onChange={e => handleMateriaChange(e.target.value)} required>
                              {filteredMateriasForDocente.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.grado}° grado)</option>)}
                              {filteredMateriasForDocente.length === 0 && <option value="">No hay materias elegibles</option>}
                            </select>
                            {!showAllMateriasInAssignment && selectedDocenteObj && docenteMateriasIds.length === 0 && (
                              <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '4px' }}>
                                El docente no tiene materias en su perfil. <span style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => setShowAllMateriasInAssignment(true)}>Mostrar todas</span>
                              </div>
                            )}
                          </div>

                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Horas Semanales *</label>
                            <input type="number" value={formAsignacion.horasSemanales} onChange={e => setFormAsignacion(prev => ({ ...prev, horasSemanales: Number(e.target.value) }))} min={1} required />
                          </div>

                          {/* Selección de Grupos */}
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <label style={{ margin: 0 }}>Grupo(s) de Destino *</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {[1, 2, 3].map(grado => (
                                  <button 
                                    key={grado}
                                    type="button"
                                    style={{ padding: '3px 10px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: '#f8fafc', cursor: 'pointer', fontWeight: '500', color: 'var(--color-text)' }}
                                    onClick={() => {
                                      const gradoGrupos = grupos.filter(g => Number(g.grado) === grado).map(g => g.id);
                                      if (gradoGrupos.length === 0) return;
                                      setFormAsignacion(prev => {
                                        const current = prev.grupoIds || [];
                                        const allSelected = gradoGrupos.every(id => current.includes(id));
                                        let list = [...current];
                                        if (allSelected) {
                                          list = list.filter(id => !gradoGrupos.includes(id));
                                        } else {
                                          gradoGrupos.forEach(id => {
                                            if (!list.includes(id)) list.push(id);
                                          });
                                        }
                                        return { ...prev, grupoIds: list, grupoId: list[0] || '' };
                                      });
                                    }}
                                  >
                                    Seleccionar {grado}°
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div className="checkbox-scroll-list">
                              {grupos.map(g => {
                                const isChecked = formAsignacion.grupoIds?.includes(g.id);
                                return (
                                  <label key={g.id} className="checkbox-item">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormAsignacion(prev => {
                                          const list = prev.grupoIds ? [...prev.grupoIds] : [];
                                          if (checked) {
                                            if (!list.includes(g.id)) list.push(g.id);
                                          } else {
                                            const idx = list.indexOf(g.id);
                                            if (idx !== -1) list.splice(idx, 1);
                                          }
                                          return {
                                            ...prev,
                                            grupoIds: list,
                                            grupoId: list[0] || ''
                                          };
                                        });
                                      }}
                                    />
                                    <span>{g.grado}°{g.grupo} - {g.turno}</span>
                                  </label>
                                );
                              })}
                            </div>
                            {(!formAsignacion.grupoIds || formAsignacion.grupoIds.length === 0) && (
                              <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '4px' }}>
                                Selecciona al menos un grupo. Los talleres compartidos deben tener seleccionados todos los grupos de su grado.
                              </div>
                            )}
                          </div>

                          {/* Selección de Espacios */}
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Espacio(s) Requerido(s)</label>
                            <div className="checkbox-scroll-list">
                              {espacios.map(es => {
                                const isChecked = formAsignacion.espacioIds?.includes(es.id);
                                return (
                                  <label key={es.id} className="checkbox-item">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormAsignacion(prev => {
                                          const list = prev.espacioIds ? [...prev.espacioIds] : [];
                                          if (checked) {
                                            if (!list.includes(es.id)) list.push(es.id);
                                          } else {
                                            const idx = list.indexOf(es.id);
                                            if (idx !== -1) list.splice(idx, 1);
                                          }
                                          return {
                                            ...prev,
                                            espacioIds: list,
                                            espacioId: list[0] || ''
                                          };
                                        });
                                      }}
                                    />
                                    <span>{es.nombre} ({es.tipo})</span>
                                  </label>
                                );
                              })}
                              {espacios.length === 0 && <span className="text-muted">No hay espacios registrados.</span>}
                            </div>
                            <small className="text-muted" style={{ marginTop: '4px', display: 'block' }}>Si no se selecciona ninguno, se asume Aula común.</small>
                          </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                          <button type="button" className="btn-secondary" onClick={() => setModalOpen(prev => ({ ...prev, asignacion: false }))}>Cancelar</button>
                          <button type="submit" className="btn-primary">Guardar Asignación</button>
                        </div>
                      </form>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 7: GENERADOR DE HORARIOS & RESULTADO */}
          {/* ======================================= */}
          {activeTab === 'generador' && (() => {
            // Build the global columns flat array
            const globalColumns = [];
            config.diasSemana.forEach(day => {
              for (let m = 0; m < config.numModulos; m++) {
                globalColumns.push({ day, modIdx: m });
              }
            });

            return (
              <div className="workspace-container">
                {/* 1. Left Sidebar Panels */}
                <div className="workspace-sidebar">
                  {/* AI Sparkle Generator Action Card */}
                  <div className="workspace-card generator-action-card">
                    <h3>AI Generador de Horarios</h3>
                    <p className="card-desc">Calcula un acomodo óptimo y libre de conflictos en segundos.</p>
                    
                    <button 
                      onClick={handleAutoGenerateSchedule} 
                      className={`btn-primary ai-generate-btn ${saving ? 'loading' : ''}`}
                      disabled={saving || asignaciones.length === 0}
                      style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: 'auto', padding: '12px 16px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%' }}>
                        <Sparkles size={18} className="sparkle-icon" />
                        <span>{saving ? 'Generando...' : 'GENERAR CON INTELIGENCIA ARTIFICIAL (V2)'}</span>
                      </div>
                      {saving && generationProgress.stage && (
                        <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 'normal', width: '100%', textAlign: 'center', marginTop: '2px' }}>
                          {generationProgress.stage} ({generationProgress.current}/{generationProgress.total})
                          {generationProgress.conflicts > 0 && ` | Colisiones: ${generationProgress.conflicts}`}
                        </div>
                      )}
                    </button>
                    
                    {generatedSchedule.updatedAt && (
                      <div className="last-generated-time">
                        Última corrida: {new Date(generatedSchedule.updatedAt.seconds * 1000).toLocaleString('es-MX')}
                      </div>
                    )}
                  </div>

                  {/* Quality KPI Card */}
                  {generatedSchedule.slots.length > 0 && (
                    <div className="workspace-card quality-kpi-card">
                      <div className="kpi-score-header">
                        <div className="kpi-circle" style={{ 
                          '--q-color': generatedSchedule.quality > 85 ? '#10b981' : generatedSchedule.quality > 60 ? '#f59e0b' : '#ef4444', 
                          '--q-val': generatedSchedule.quality 
                        }}>
                          <span className="kpi-value">{generatedSchedule.quality}%</span>
                        </div>
                        <div className="kpi-info">
                          <span className="kpi-label">Eficiencia Escolar</span>
                          <span className="kpi-status">
                            {generatedSchedule.quality > 85 ? 'Excelente' : generatedSchedule.quality > 60 ? 'Aceptable' : 'Con Gaps / Pendientes'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="kpi-details-list">
                        <div className="kpi-detail-item">
                          <span>Colocadas:</span>
                          <strong>{generatedSchedule.slots.length} hrs</strong>
                        </div>
                        <div className="kpi-detail-item" style={{ color: generatedSchedule.horasPendientes.length > 0 ? '#b45309' : '#047857' }}>
                          <span>Pendientes:</span>
                          <strong>{generatedSchedule.horasPendientes.length} hrs</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dock de Fichas Pendientes */}
                  <div className="workspace-card pending-dock-card">
                    <div className="pending-dock-header">
                      <h3>Fichas Sin Colocar</h3>
                      <span className="pending-count-badge">{generatedSchedule.horasPendientes.length}</span>
                    </div>
                    <p className="card-desc">Arrastra estas tarjetas de materias directamente a la cuadrícula para programarlas.</p>
                    
                    <div className="pending-cards-scroll-area">
                      {generatedSchedule.horasPendientes.map((s, idx) => {
                        const matColor = getMateriaColor(s.materiaId, s.materiaNombre);
                        return (
                          <div 
                            key={s.id} 
                            className="pending-card" 
                            style={{ 
                              borderLeftColor: matColor,
                              '--subject-color-light': `${matColor}15`
                            }}
                            draggable
                            onDragStart={() => handleDragStart(s, -1 - idx)}
                          >
                            <div className="p-card-header">
                              <span className="p-card-subject" title={s.materiaNombre}>{s.materiaNombre}</span>
                            </div>
                            <div className="p-card-body">
                              <span className="p-card-meta">{s.grupoNombre || 'Taller'}</span>
                              <span className="p-card-teacher" title={s.docenteNombre}>{s.docenteNombre}</span>
                            </div>
                          </div>
                        );
                      })}
                      {generatedSchedule.horasPendientes.length === 0 && (
                        <div className="pending-empty-state">
                          <CheckCircle2 size={32} className="text-success" />
                          <span>¡Todas las horas han sido colocadas!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Zona de Retorno/Eliminación */}
                  {draggedSlot && draggedSlot.index >= 0 && (
                    <div 
                      className="trash-drop-zone"
                      onDragOver={handleDragOver}
                      onDrop={() => {
                        handleRemovePlacedSlot(draggedSlot.index);
                        setDraggedSlot(null);
                      }}
                    >
                      <Trash2 size={24} />
                      <span>Arrastra aquí para quitar de la cuadrícula</span>
                    </div>
                  )}
                </div>

                {/* 2. Main Workspace Area */}
                <div className="workspace-main">
                  {/* Workspace Tab Header & Switchers */}
                  <div className="workspace-toolbar">
                    <div className="toolbar-section">
                      <span className="toolbar-title">Vista del Tablero:</span>
                      <div className="toolbar-btn-group">
                        <button 
                          className={`toolbar-btn ${timelineViewMode === 'individual' ? 'active' : ''}`}
                          onClick={() => setTimelineViewMode('individual')}
                        >
                          Ficha Individual
                        </button>
                        <button 
                          className={`toolbar-btn ${timelineViewMode === 'global' ? 'active' : ''}`}
                          onClick={() => setTimelineViewMode('global')}
                        >
                          Vista Global aSc
                        </button>
                      </div>
                    </div>

                    {/* Selector de filtros según modo activo */}
                    <div className="toolbar-section">
                      {timelineViewMode === 'individual' ? (
                        <>
                          <div className="toolbar-btn-group" style={{ marginRight: '10px' }}>
                            <button 
                              className={`toolbar-btn-sm ${viewFilterMode === 'grupo' ? 'active' : ''}`}
                              onClick={() => setViewFilterMode('grupo')}
                            >
                              Grupo
                            </button>
                            <button 
                              className={`toolbar-btn-sm ${viewFilterMode === 'docente' ? 'active' : ''}`}
                              onClick={() => setViewFilterMode('docente')}
                            >
                              Docente
                            </button>
                            <button 
                              className={`toolbar-btn-sm ${viewFilterMode === 'espacio' ? 'active' : ''}`}
                              onClick={() => setViewFilterMode('espacio')}
                            >
                              Espacio
                            </button>
                          </div>
                          
                          <div className="toolbar-filter-select">
                            {viewFilterMode === 'grupo' && (
                              <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
                                {grupos.map(g => <option key={g.id} value={g.id}>{g.grado}°{g.grupo} - {g.turno}</option>)}
                                <option value="taller-sin-grupo">Taller (Sin grupo)</option>
                                {grupos.length === 0 && <option value="">No hay grupos</option>}
                              </select>
                            )}
                            {viewFilterMode === 'docente' && (
                              <select value={selectedDocenteId} onChange={e => setSelectedDocenteId(e.target.value)}>
                                {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                {docentes.length === 0 && <option value="">No hay docentes</option>}
                              </select>
                            )}
                            {viewFilterMode === 'espacio' && (
                              <select value={selectedEspacioId} onChange={e => setSelectedEspacioId(e.target.value)}>
                                {espacios.map(es => <option key={es.id} value={es.id}>{es.nombre} ({es.tipo})</option>)}
                                {espacios.length === 0 && <option value="">No hay espacios</option>}
                              </select>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="toolbar-title" style={{ marginRight: '6px' }}>Filas por:</span>
                          <div className="toolbar-btn-group">
                            <button 
                              className={`toolbar-btn-sm ${timelineGlobalResource === 'grupo' ? 'active' : ''}`}
                              onClick={() => setTimelineGlobalResource('grupo')}
                            >
                              Grupos
                            </button>
                            <button 
                              className={`toolbar-btn-sm ${timelineGlobalResource === 'docente' ? 'active' : ''}`}
                              onClick={() => setTimelineGlobalResource('docente')}
                            >
                              Docentes
                            </button>
                            <button 
                              className={`toolbar-btn-sm ${timelineGlobalResource === 'espacio' ? 'active' : ''}`}
                              onClick={() => setTimelineGlobalResource('espacio')}
                            >
                              Espacios
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {conflictWarning && (
                    <div className="workspace-conflict-alert">
                      <AlertCircle size={16} />
                      <span>{conflictWarning}</span>
                    </div>
                  )}

                  {/* 3. The Grid Display */}
                  {generatedSchedule.slots.length > 0 ? (
                    timelineViewMode === 'individual' ? (
                      /* Vista Individual (Clásica) */
                      <div className="timetable-wrapper">
                        <table className="timetable-grid" id="main-timetable-grid">
                          <thead>
                            <tr>
                              <th className="time-column">Módulo</th>
                              {config.diasSemana.map(d => <th key={d}>{d}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {Array(config.numModulos).fill(0).map((_, modIdx) => {
                              const timeRange = getSlotTimeRange(modIdx);
                              const isRecessTime = modIdx === 3;
                              
                              return (
                                <React.Fragment key={modIdx}>
                                  {isRecessTime && (
                                    <tr className="recess-row">
                                      <td>RECESO</td>
                                      <td colSpan={config.diasSemana.length}>
                                        RECESO ESCOLAR ({config.recesoInicio} - {config.recesoFin})
                                      </td>
                                    </tr>
                                  )}
                                  <tr>
                                    <td className="text-center" style={{ background: '#f8fafc' }}>
                                      <strong>Mód. {modIdx + 1}</strong>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>{timeRange}</div>
                                    </td>
                                    {config.diasSemana.map(day => {
                                      let cellSlots = [];
                                      let activeIndex = -1;
                                      
                                      if (viewFilterMode === 'grupo' && selectedGroupId) {
                                        if (selectedGroupId === 'taller-sin-grupo') {
                                          generatedSchedule.slots.forEach(s => {
                                            const noGroup = (!s.grupoId || s.grupoId === '') && (!s.grupoIds || s.grupoIds.length === 0);
                                            if (noGroup && s.dia === day && s.moduloIndex === modIdx) {
                                              cellSlots.push(s);
                                            }
                                          });
                                        } else {
                                          activeIndex = generatedSchedule.slots.findIndex(s => (s.grupoId === selectedGroupId || (s.grupoIds && s.grupoIds.includes(selectedGroupId))) && s.dia === day && s.moduloIndex === modIdx);
                                          if (activeIndex !== -1) cellSlots = [generatedSchedule.slots[activeIndex]];
                                        }
                                      } else if (viewFilterMode === 'docente' && selectedDocenteId) {
                                        activeIndex = generatedSchedule.slots.findIndex(s => s.docenteId === selectedDocenteId && s.dia === day && s.moduloIndex === modIdx);
                                        if (activeIndex !== -1) cellSlots = [generatedSchedule.slots[activeIndex]];
                                      } else if (viewFilterMode === 'espacio' && selectedEspacioId) {
                                        activeIndex = generatedSchedule.slots.findIndex(s => (s.espacioId === selectedEspacioId || (s.espacioIds && s.espacioIds.includes(selectedEspacioId))) && s.dia === day && s.moduloIndex === modIdx);
                                        if (activeIndex !== -1) cellSlots = [generatedSchedule.slots[activeIndex]];
                                      }

                                      return (
                                        <td 
                                          key={day}
                                          onDragOver={handleDragOver}
                                          onDrop={(e) => handleDrop(e, day, modIdx)}
                                          className={draggedSlot ? 'drop-target-active' : ''}
                                          style={{ height: '95px', padding: '6px' }}
                                        >
                                          {cellSlots.map(slot => {
                                            const matColor = getMateriaColor(slot.materiaId, slot.materiaNombre);
                                            const isCardHighlighted = hoveredDocenteId === slot.docenteId || hoveredMateriaId === slot.materiaId;
                                            const originalIndex = generatedSchedule.slots.findIndex(s => s.id === slot.id);
                                            
                                            return (
                                              <div 
                                                key={slot.id} 
                                                className={`timetable-class-card colored ${isCardHighlighted ? 'highlighted' : ''}`}
                                                style={{ 
                                                  borderLeftColor: matColor,
                                                  '--subject-color-light': `${matColor}18`,
                                                  '--subject-color-solid': matColor
                                                }}
                                                draggable
                                                onDragStart={() => handleDragStart(slot, originalIndex)}
                                                onMouseEnter={() => {
                                                  setHoveredDocenteId(slot.docenteId);
                                                  setHoveredMateriaId(slot.materiaId);
                                                }}
                                                onMouseLeave={() => {
                                                  setHoveredDocenteId(null);
                                                  setHoveredMateriaId(null);
                                                }}
                                                title="Doble clic para quitar y enviar a pendientes"
                                                onDoubleClick={() => {
                                                  if (window.confirm('¿Deseas quitar esta hora y mandarla a pendientes?')) {
                                                    handleRemovePlacedSlot(originalIndex);
                                                  }
                                                }}
                                              >
                                                <div className="class-card-subject" title={slot.materiaNombre}>{slot.materiaNombre}</div>
                                                {viewFilterMode !== 'docente' && !slot.materiaNombre.toLowerCase().includes('taller') && !slot.materiaNombre.toLowerCase().includes('tecnolog') && <div className="class-card-teacher" title={slot.docenteNombre}>{slot.docenteNombre}</div>}
                                                {viewFilterMode !== 'grupo' && <div className="class-card-teacher" style={{ fontWeight: '600' }}>{slot.grupoNombre?.includes(',') ? 'Grupos:' : 'Grupo:'} {slot.grupoNombre}</div>}
                                                
                                                <div className="class-card-meta">
                                                  <span className="class-card-space" title={slot.espacioNombre || 'Aula'}>
                                                    📍 {slot.espacioNombre || 'Aula'}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Vista Global (aSc Style Timeline) */
                      <div className="global-timeline-wrapper">
                        <table className="global-timeline-table">
                          <thead>
                            {/* Primera fila: Días con colSpan */}
                            <tr>
                              <th className="resource-header-col" style={{ zIndex: 4 }}>Recurso</th>
                              {config.diasSemana.map(day => (
                                <th key={day} colSpan={config.numModulos} className="day-header-col">
                                  {day}
                                </th>
                              ))}
                            </tr>
                            {/* Segunda fila: Módulos individuales */}
                            <tr>
                              <th className="resource-header-col" style={{ zIndex: 4 }}>
                                {timelineGlobalResource === 'grupo' ? 'Grupos' : timelineGlobalResource === 'docente' ? 'Docentes' : 'Espacios'}
                              </th>
                              {globalColumns.map((col, idx) => (
                                <th key={idx} className="mod-header-col">
                                  M{col.modIdx + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              let resources = [];
                              if (timelineGlobalResource === 'grupo') {
                                resources = [...grupos, { id: 'taller-sin-grupo', grado: 'Talleres', grupo: '(Sin grupo)', turno: 'Varios' }];
                              } else if (timelineGlobalResource === 'docente') {
                                resources = docentes;
                              } else {
                                resources = espacios;
                              }
                              
                              return resources.map(resource => (
                                <tr key={resource.id}>
                                  <td className="resource-cell-sticky">
                                    <strong>
                                      {timelineGlobalResource === 'grupo' 
                                        ? (resource.id === 'taller-sin-grupo' ? 'Talleres' : `${resource.grado}°${resource.grupo}`)
                                        : resource.nombre}
                                    </strong>
                                    {timelineGlobalResource === 'grupo' && (
                                      <div className="res-subtitle">
                                        {resource.id === 'taller-sin-grupo' ? 'Sin grupo' : resource.turno}
                                      </div>
                                    )}
                                    {timelineGlobalResource === 'docente' && (
                                      <div className="res-subtitle">{resource.academia || 'Base'}</div>
                                    )}
                                  </td>
                                  
                                  {globalColumns.map((col, colIdx) => {
                                    // Buscar si hay slots agendados para este recurso en esta coordenada
                                    let cellSlots = [];
                                    
                                    if (timelineGlobalResource === 'grupo') {
                                      if (resource.id === 'taller-sin-grupo') {
                                        generatedSchedule.slots.forEach((s, idx) => {
                                          const noGroup = (!s.grupoId || s.grupoId === '') && (!s.grupoIds || s.grupoIds.length === 0);
                                          if (noGroup && s.dia === col.day && s.moduloIndex === col.modIdx) {
                                            cellSlots.push({ slot: s, index: idx });
                                          }
                                        });
                                      } else {
                                        const idx = generatedSchedule.slots.findIndex(s => 
                                          (s.grupoId === resource.id || (s.grupoIds && s.grupoIds.includes(resource.id))) && 
                                          s.dia === col.day && 
                                          s.moduloIndex === col.modIdx
                                        );
                                        if (idx !== -1) {
                                          cellSlots.push({ slot: generatedSchedule.slots[idx], index: idx });
                                        }
                                      }
                                    } else if (timelineGlobalResource === 'docente') {
                                      const idx = generatedSchedule.slots.findIndex(s => 
                                        s.docenteId === resource.id && 
                                        s.dia === col.day && 
                                        s.moduloIndex === col.modIdx
                                      );
                                      if (idx !== -1) {
                                        cellSlots.push({ slot: generatedSchedule.slots[idx], index: idx });
                                      }
                                    } else if (timelineGlobalResource === 'espacio') {
                                      const idx = generatedSchedule.slots.findIndex(s => 
                                        (s.espacioId === resource.id || (s.espacioIds && s.espacioIds.includes(resource.id))) && 
                                        s.dia === col.day && 
                                        s.moduloIndex === col.modIdx
                                      );
                                      if (idx !== -1) {
                                        cellSlots.push({ slot: generatedSchedule.slots[idx], index: idx });
                                      }
                                    }

                                    return (
                                      <td 
                                        key={colIdx}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDropGlobal(e, resource.id, col.day, col.modIdx, timelineGlobalResource)}
                                        className={draggedSlot ? 'drop-target-active' : ''}
                                        style={{ padding: '4px', minWidth: '85px', height: '64px' }}
                                      >
                                        {cellSlots.map(({ slot: cellSlot, index: activeIdx }) => {
                                          const matColor = getMateriaColor(cellSlot.materiaId, cellSlot.materiaNombre);
                                          const isCardHighlighted = hoveredDocenteId === cellSlot.docenteId || hoveredMateriaId === cellSlot.materiaId;
                                          
                                          return (
                                            <div 
                                              key={cellSlot.id}
                                              className={`global-timeline-card ${isCardHighlighted ? 'highlighted' : ''}`}
                                              style={{ 
                                                background: matColor,
                                                borderLeft: `4px solid ${matColor}`,
                                                marginBottom: cellSlots.length > 1 ? '2px' : '0'
                                              }}
                                              draggable
                                              onDragStart={() => handleDragStart(cellSlot, activeIdx)}
                                              onMouseEnter={() => {
                                                setHoveredDocenteId(cellSlot.docenteId);
                                                setHoveredMateriaId(cellSlot.materiaId);
                                              }}
                                              onMouseLeave={() => {
                                                setHoveredDocenteId(null);
                                                setHoveredMateriaId(null);
                                              }}
                                              onDoubleClick={() => {
                                                if (window.confirm('¿Quitar del horario?')) {
                                                  handleRemovePlacedSlot(activeIdx);
                                                }
                                              }}
                                              title={`${cellSlot.materiaNombre}\nDocente: ${cellSlot.docenteNombre}\nGrupo: ${cellSlot.grupoNombre}\nEspacio: ${cellSlot.espacioNombre || 'Aula'}`}
                                            >
                                              <div className="gt-subject">{cellSlot.materiaNombre}</div>
                                              {timelineGlobalResource !== 'docente' && <div className="gt-docent">{cellSlot.docenteNombre}</div>}
                                              {timelineGlobalResource !== 'grupo' && <div className="gt-docent" style={{ fontWeight: 'bold' }}>{cellSlot.grupoNombre?.includes(',') ? 'Grupos:' : 'Grupo:'} {cellSlot.grupoNombre}</div>}
                                            </div>
                                          );
                                        })}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', background: '#f8fafc' }}>
                      <Sparkles size={48} className="text-muted" style={{ marginBottom: '1rem', color: '#94a3b8' }} />
                      <h3>No hay horarios generados</h3>
                      <p className="text-muted">Utiliza el generador automático en la barra lateral o arrastra materias para iniciar la planificación.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ======================================= */}
          {/* TAB 8: FORMATOS DE IMPRESIÓN Y EXCEL     */}
          {/* ======================================= */}
          {activeTab === 'impresion' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Impresión y Exportación Oficial</h2>
                  <p className="tab-header-description">Genera copias físicas con membrete SEP o descarga tablas para Excel.</p>
                </div>
              </div>

              <div className="print-options-layout">
                <div className={`print-card-option ${printOption === 'general' ? 'active' : ''}`} onClick={() => setPrintOption('general')}>
                  <h3>Horario General</h3>
                  <p>Todos los grupos y docentes agrupados</p>
                </div>
                <div className={`print-card-option ${printOption === 'grupo' ? 'active' : ''}`} onClick={() => setPrintOption('grupo')}>
                  <h3>Por Grupo</h3>
                  <p>Ficha individual por grupo escolar</p>
                </div>
                <div className={`print-card-option ${printOption === 'docente' ? 'active' : ''}`} onClick={() => setPrintOption('docente')}>
                  <h3>Por Docente</h3>
                  <p>Ficha individual de carga de docente</p>
                </div>
                <div className={`print-card-option ${printOption === 'espacio' ? 'active' : ''}`} onClick={() => setPrintOption('espacio')}>
                  <h3>Por Espacio</h3>
                  <p>Ocupación de laboratorios, talleres, etc.</p>
                </div>
              </div>

              {generatedSchedule.slots.length > 0 ? (
                <div>
                  <div className="print-preview-actions">
                    <button className="btn-secondary" onClick={() => handleExportExcel('printable-schedule-table', `Horario_${printOption}_${config.cicloEscolar}`)}>
                      <Download size={16} /> Descargar Excel
                    </button>
                    <button className="btn-primary" onClick={handlePrint}>
                      <Printer size={16} /> Imprimir / PDF
                    </button>
                  </div>

                  <div className="print-preview-pane" style={{ background: '#f1f5f9', padding: '30px', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                    <div style={{ width: '800px', background: 'white', padding: '40px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                      <PrintTemplate 
                        title={`Horario Escolar: ${printOption.toUpperCase()}`}
                        subtitle={`Ciclo Escolar: ${config.cicloEscolar} | Fecha de Impresión: ${new Date().toLocaleDateString('es-MX')}`}
                        isScreenPreview={true}
                      >
                        {/* Selector de sub-elemento para imprimir */}
                        <div className="no-print" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '15px' }}>
                          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Selecciona elemento a visualizar:</label>
                          {printOption === 'grupo' && (
                            <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px' }}>
                              {grupos.map(g => <option key={g.id} value={g.id}>Grupo: {g.grado}°{g.grupo}</option>)}
                            </select>
                          )}
                          {printOption === 'docente' && (
                            <select value={selectedDocenteId} onChange={e => setSelectedDocenteId(e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px' }}>
                              {docentes.map(d => <option key={d.id} value={d.id}>Docente: {d.nombre}</option>)}
                            </select>
                          )}
                          {printOption === 'espacio' && (
                            <select value={selectedEspacioId} onChange={e => setSelectedEspacioId(e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px' }}>
                              {espacios.map(es => <option key={es.id} value={es.id}>Espacio: {es.nombre}</option>)}
                            </select>
                          )}
                          {printOption === 'general' && (
                            <span className="text-muted">Horario de todos los grupos consolidados.</span>
                          )}
                        </div>

                        {/* Tabla de Impresión */}
                        <table className="report-table" id="printable-schedule-table" ref={excelTableRef}>
                          <thead>
                            <tr>
                              <th style={{ width: '150px' }}>Módulo</th>
                              {config.diasSemana.map(d => <th key={d}>{d}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {Array(config.numModulos).fill(0).map((_, modIdx) => {
                              const timeRange = getSlotTimeRange(modIdx);
                              const isRecessTime = modIdx === 3;
                              
                              return (
                                <React.Fragment key={modIdx}>
                                  {isRecessTime && (
                                    <tr style={{ background: '#f1f5f9', fontWeight: 'bold', textAlign: 'center' }}>
                                      <td style={{ padding: '6px' }}>RECESO</td>
                                      <td colSpan={config.diasSemana.length} style={{ padding: '6px' }}>
                                        RECESO ESCOLAR ({config.recesoInicio} - {config.recesoFin})
                                      </td>
                                    </tr>
                                  )}
                                  <tr>
                                    <td style={{ background: '#f8fafc', padding: '10px', fontWeight: 'bold' }}>
                                      Modulo {modIdx + 1}
                                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>{timeRange}</div>
                                    </td>
                                    {config.diasSemana.map(day => {
                                      let cellText = '---';
                                      
                                      if (printOption === 'general') {
                                        // Muestra un resumen de todos los grupos ocupados
                                        const occupied = generatedSchedule.slots.filter(s => s.dia === day && s.moduloIndex === modIdx);
                                        if (occupied.length > 0) {
                                          cellText = occupied.map(s => `${s.grupoNombre}: ${s.materiaNombre}`).join(' | ');
                                        }
                                      } else if (printOption === 'grupo' && selectedGroupId) {
                                        const s = generatedSchedule.slots.find(s => (s.grupoId === selectedGroupId || (s.grupoIds && s.grupoIds.includes(selectedGroupId))) && s.dia === day && s.moduloIndex === modIdx);
                                        if (s) cellText = `${s.materiaNombre}\n(${s.docenteNombre})\n📍 ${s.espacioNombre || 'Aula'}`;
                                      } else if (printOption === 'docente' && selectedDocenteId) {
                                        const s = generatedSchedule.slots.find(s => s.docenteId === selectedDocenteId && s.dia === day && s.moduloIndex === modIdx);
                                        if (s) cellText = `${s.materiaNombre}\nGrupo: ${s.grupoNombre}\n📍 ${s.espacioNombre || 'Aula'}`;
                                      } else if (printOption === 'espacio' && selectedEspacioId) {
                                        const s = generatedSchedule.slots.find(s => (s.espacioId === selectedEspacioId || (s.espacioIds && s.espacioIds.includes(selectedEspacioId))) && s.dia === day && s.moduloIndex === modIdx);
                                        if (s) cellText = `Grupo: ${s.grupoNombre}\nMateria: ${s.materiaNombre}\nDocente: ${s.docenteNombre}`;
                                      }

                                      return (
                                        <td key={day} style={{ padding: '10px', fontSize: '0.8rem', whiteSpace: 'pre-line', verticalAlign: 'top' }}>
                                          {cellText}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </PrintTemplate>
                    </div>
                  </div>
                  
                  {/* Vista Impresa Invisible para el navegador */}
                  <div className="print-only">
                    <PrintTemplate 
                      title={`Horario Escolar: ${printOption.toUpperCase()}`}
                      subtitle={`Ciclo Escolar: ${config.cicloEscolar} | Fecha de Impresión: ${new Date().toLocaleDateString('es-MX')}`}
                    >
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th style={{ width: '150px' }}>Módulo</th>
                            {config.diasSemana.map(d => <th key={d}>{d}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {Array(config.numModulos).fill(0).map((_, modIdx) => {
                            const timeRange = getSlotTimeRange(modIdx);
                            const isRecessTime = modIdx === 3;
                            
                            return (
                              <React.Fragment key={modIdx}>
                                {isRecessTime && (
                                  <tr style={{ background: '#f1f5f9', fontWeight: 'bold', textAlign: 'center' }}>
                                    <td style={{ padding: '6px' }}>RECESO</td>
                                    <td colSpan={config.diasSemana.length} style={{ padding: '6px' }}>
                                      RECESO ESCOLAR ({config.recesoInicio} - {config.recesoFin})
                                    </td>
                                  </tr>
                                )}
                                <tr>
                                  <td style={{ background: '#f8fafc', padding: '10px', fontWeight: 'bold' }}>
                                    Modulo {modIdx + 1}
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>{timeRange}</div>
                                  </td>
                                  {config.diasSemana.map(day => {
                                    let cellText = '---';
                                    
                                    if (printOption === 'general') {
                                      const occupied = generatedSchedule.slots.filter(s => s.dia === day && s.moduloIndex === modIdx);
                                      if (occupied.length > 0) {
                                        cellText = occupied.map(s => `${s.grupoNombre}: ${s.materiaNombre}`).join(' | ');
                                      }
                                    } else if (printOption === 'grupo' && selectedGroupId) {
                                      const s = generatedSchedule.slots.find(s => (s.grupoId === selectedGroupId || (s.grupoIds && s.grupoIds.includes(selectedGroupId))) && s.dia === day && s.moduloIndex === modIdx);
                                      if (s) cellText = `${s.materiaNombre}\n(${s.docenteNombre})\n📍 ${s.espacioNombre || 'Aula'}`;
                                    } else if (printOption === 'docente' && selectedDocenteId) {
                                      const s = generatedSchedule.slots.find(s => s.docenteId === selectedDocenteId && s.dia === day && s.moduloIndex === modIdx);
                                      if (s) cellText = `${s.materiaNombre}\nGrupo: ${s.grupoNombre}\n📍 ${s.espacioNombre || 'Aula'}`;
                                    } else if (printOption === 'espacio' && selectedEspacioId) {
                                      const s = generatedSchedule.slots.find(s => (s.espacioId === selectedEspacioId || (s.espacioIds && s.espacioIds.includes(selectedEspacioId))) && s.dia === day && s.moduloIndex === modIdx);
                                      if (s) cellText = `Grupo: ${s.grupoNombre}\nMateria: ${s.materiaNombre}\nDocente: ${s.docenteNombre}`;
                                    }

                                    return (
                                      <td key={day} style={{ padding: '10px', fontSize: '0.8rem', whiteSpace: 'pre-line', verticalAlign: 'top' }}>
                                        {cellText}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </PrintTemplate>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <Printer size={48} className="text-muted" />
                  <h3>No hay horarios para imprimir</h3>
                  <p>Calcula automáticamente los horarios en la pestaña de Generador antes de imprimir.</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Horarios;
