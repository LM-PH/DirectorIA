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
    disponibilidad: {}
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
    observaciones: ''
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
    horasSemanales: 3,
    espacioId: ''
  });

  // Schedule Viewer Filter States
  const [viewFilterMode, setViewFilterMode] = useState('grupo'); // 'grupo', 'docente', 'espacio', 'general'
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDocenteId, setSelectedDocenteId] = useState('');
  const [selectedEspacioId, setSelectedEspacioId] = useState('');

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
      disponibilidad: initializeDisponibilidad()
    });
    setModalOpen(prev => ({ ...prev, docente: true }));
  };

  const openEditDocente = (docente) => {
    setEditItem(prev => ({ ...prev, docente }));
    setFormDocente({
      ...docente,
      disponibilidad: docente.disponibilidad || initializeDisponibilidad()
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
      observaciones: ''
    });
    setModalOpen(prev => ({ ...prev, materia: true }));
  };

  const openEditMateria = (materia) => {
    setEditItem(prev => ({ ...prev, materia }));
    setFormMateria(materia);
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

  // CRUD Operations: ASIGNACIONES
  const openNewAsignacion = () => {
    setEditItem(prev => ({ ...prev, asignacion: null }));
    setFormAsignacion({
      docenteId: docentes[0]?.id || '',
      materiaId: materias[0]?.id || '',
      grupoId: grupos[0]?.id || '',
      horasSemanales: 3,
      espacioId: espacios[0]?.id || ''
    });
    setModalOpen(prev => ({ ...prev, asignacion: true }));
  };

  const openEditAsignacion = (asig) => {
    setEditItem(prev => ({ ...prev, asignacion: asig }));
    setFormAsignacion({
      docenteId: asig.docenteId,
      materiaId: asig.materiaId,
      grupoId: asig.grupoId,
      horasSemanales: asig.horasSemanales,
      espacioId: asig.espacioId || ''
    });
    setModalOpen(prev => ({ ...prev, asignacion: true }));
  };

  const handleSaveAsignacion = async (e) => {
    e.preventDefault();
    const docObj = docentes.find(d => d.id === formAsignacion.docenteId);
    const matObj = materias.find(m => m.id === formAsignacion.materiaId);
    const grpObj = grupos.find(g => g.id === formAsignacion.grupoId);
    const espObj = espacios.find(es => es.id === formAsignacion.espacioId);

    const payload = {
      docenteId: formAsignacion.docenteId,
      docenteNombre: docObj ? docObj.nombre : '',
      materiaId: formAsignacion.materiaId,
      materiaNombre: matObj ? matObj.nombre : '',
      grupoId: formAsignacion.grupoId,
      grupoNombre: grpObj ? `${grpObj.grado}°${grpObj.grupo}` : '',
      horasSemanales: Number(formAsignacion.horasSemanales),
      espacioId: formAsignacion.espacioId || '',
      espacioNombre: espObj ? espObj.nombre : ''
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

  // ==========================================
  // SECCIÓN 7: ALGORITMO GENERADOR AUTOMÁTICO
  // ==========================================
  const handleAutoGenerateSchedule = async () => {
    if (asignaciones.length === 0) {
      alert('Por favor, agrega asignaciones académicas antes de generar.');
      return;
    }

    setSaving(true);

    try {
      const numModulos = Number(config.numModulos) || 6;
      const dias = config.diasSemana || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

      // 1. Descomponer asignaciones en slots individuales de 1 hora
      let slotsToPlace = [];
      asignaciones.forEach(asig => {
        const hours = Number(asig.horasSemanales || 1);
        for (let h = 0; h < hours; h++) {
          slotsToPlace.push({
            id: `${asig.id}-${h}`,
            asigId: asig.id,
            docenteId: asig.docenteId,
            docenteNombre: asig.docenteNombre,
            materiaId: asig.materiaId,
            materiaNombre: asig.materiaNombre,
            grupoId: asig.grupoId,
            grupoNombre: asig.grupoNombre,
            espacioId: asig.espacioId || '',
            espacioNombre: asig.espacioNombre || ''
          });
        }
      });

      // Heurística de ordenación MRV (Minimum Remaining Values / Más restrictivos primero)
      const teacherPriorityVal = (docId) => {
        const t = docentes.find(d => d.id === docId);
        if (!t) return 2; // Media
        if (t.prioridad === 'Muy alta') return 4;
        if (t.prioridad === 'Alta') return 3;
        if (t.prioridad === 'Baja') return 1;
        return 2; // Media
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
        // Ordenar por prioridad docente (Muy alta > Alta > Media > Baja)
        const prioA = teacherPriorityVal(a.docenteId);
        const prioB = teacherPriorityVal(b.docenteId);
        if (prioA !== prioB) return prioB - prioA;

        // Ordenar por menor disponibilidad docente (más restrictivos primero)
        const availA = teacherAvailabilityCount(a.docenteId);
        const availB = teacherAvailabilityCount(b.docenteId);
        if (availA !== availB) return availA - availB;

        // Aulas especiales primero
        const spaceA = a.espacioId && espacios.find(e => e.id === a.espacioId)?.tipo !== 'Aula' ? 1 : 0;
        const spaceB = b.espacioId && espacios.find(e => e.id === b.espacioId)?.tipo !== 'Aula' ? 1 : 0;
        if (spaceA !== spaceB) return spaceB - spaceA;

        return 0;
      });

      let placedSlots = [];
      let unplacedSlots = [];

      // Validadores de restricciones duras
      const isTeacherBusy = (docId, day, modIdx) => {
        return placedSlots.some(s => s.docenteId === docId && s.dia === day && s.moduloIndex === modIdx);
      };

      const isGroupBusy = (grpId, day, modIdx) => {
        return placedSlots.some(s => s.grupoId === grpId && s.dia === day && s.moduloIndex === modIdx);
      };

      const isSpaceBusy = (spcId, day, modIdx) => {
        if (!spcId) return false;
        const spcObj = espacios.find(e => e.id === spcId);
        if (!spcObj || spcObj.tipo === 'Aula') return false; // El aula común depende del grupo, no choca con otros grupos
        return placedSlots.some(s => s.espacioId === spcId && s.dia === day && s.moduloIndex === modIdx);
      };

      const isTeacherAvailable = (docId, day, modIdx) => {
        const t = docentes.find(d => d.id === docId);
        if (!t) return true;
        if (!t.disponibilidad || !t.disponibilidad[day]) return true;
        return t.disponibilidad[day][modIdx] === true;
      };

      // Proceso Greedy de colocación
      slotsToPlace.forEach(slot => {
        let bestDay = null;
        let bestMod = null;
        let bestScore = -999999;

        dias.forEach(day => {
          for (let m = 0; m < numModulos; m++) {
            // Validar restricciones duras
            if (isTeacherBusy(slot.docenteId, day, m)) continue;
            if (isGroupBusy(slot.grupoId, day, m)) continue;
            if (isSpaceBusy(slot.espacioId, day, m)) continue;
            if (!isTeacherAvailable(slot.docenteId, day, m)) continue;

            // Evaluar restricciones preferenciales
            let score = 0;

            // 1. Contigüidad del Grupo (evitar huecos)
            const groupAdjacent = placedSlots.some(s => 
              s.grupoId === slot.grupoId && s.dia === day && (s.moduloIndex === m - 1 || s.moduloIndex === m + 1)
            );
            if (groupAdjacent) score += 40;

            // 2. Contigüidad del Docente
            const teacherAdjacent = placedSlots.some(s => 
              s.docenteId === slot.docenteId && s.dia === day && (s.moduloIndex === m - 1 || s.moduloIndex === m + 1)
            );
            if (teacherAdjacent) score += 25;

            // 3. Distribución de materias en la semana (no apilar la misma materia en un solo día)
            const dayMatCount = placedSlots.filter(s => 
              s.grupoId === slot.grupoId && s.materiaId === slot.materiaId && s.dia === day
            ).length;
            score -= dayMatCount * 50;

            // 4. Preferencia a primeras horas
            score += (numModulos - m) * 2;

            if (score > bestScore) {
              bestScore = score;
              bestDay = day;
              bestMod = m;
            }
          }
        });

        if (bestDay !== null && bestMod !== null) {
          placedSlots.push({
            ...slot,
            dia: bestDay,
            moduloIndex: bestMod
          });
        } else {
          unplacedSlots.push(slot);
        }
      });

      // Calcular calidad y horas muertas (huecos)
      let gapCount = 0;
      grupos.forEach(g => {
        dias.forEach(day => {
          const dayMods = placedSlots
            .filter(s => s.grupoId === g.id && s.dia === day)
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
      const unplacedPenalty = (totalRequested - totalPlaced) * 10;
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
      alert(`Generación completada. Eficiencia del ${qualityScore}% (${totalPlaced} horas colocadas de ${totalRequested}).`);
    } catch (e) {
      console.error(e);
      alert('Error en el motor de generación horaria.');
    }

    setSaving(false);
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
    
    // Evitar soltar en el mismo lugar
    if (slot.dia === targetDay && slot.moduloIndex === targetModIdx) {
      setDraggedSlot(null);
      return;
    }

    // 1. Validar conflictos en caliente
    const errors = [];
    
    // Comprobar cruce de docente
    const docClash = generatedSchedule.slots.some((s, idx) => 
      idx !== index && s.docenteId === slot.docenteId && s.dia === targetDay && s.moduloIndex === targetModIdx
    );
    if (docClash) {
      errors.push(`El docente ${slot.docenteNombre} ya está ocupado en este módulo.`);
    }

    // Comprobar cruce de grupo
    const grpClash = generatedSchedule.slots.some((s, idx) => 
      idx !== index && s.grupoId === slot.grupoId && s.dia === targetDay && s.moduloIndex === targetModIdx
    );
    if (grpClash) {
      errors.push(`El grupo ${slot.grupoNombre} ya tiene clase asignada en este módulo.`);
    }

    // Comprobar cruce de espacio
    if (slot.espacioId) {
      const spcObj = espacios.find(sp => sp.id === slot.espacioId);
      if (spcObj && spcObj.tipo !== 'Aula') {
        const spcClash = generatedSchedule.slots.some((s, idx) => 
          idx !== index && s.espacioId === slot.espacioId && s.dia === targetDay && s.moduloIndex === targetModIdx
        );
        if (spcClash) {
          errors.push(`El espacio ${slot.espacioNombre} ya está reservado en este módulo.`);
        }
      }
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
      moduloIndex: targetModIdx
    };

    // Recalcular calidad y huecos
    let gapCount = 0;
    grupos.forEach(g => {
      config.diasSemana.forEach(day => {
        const dayMods = updatedSlots
          .filter(s => s.grupoId === g.id && s.dia === day)
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
    const totalRequested = asignaciones.reduce((acc, curr) => acc + Number(curr.horasSemanales || 1), 0);
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
    const docClash = generatedSchedule.slots.some(s => s.docenteId === slot.docenteId && s.dia === targetDay && s.moduloIndex === targetModIdx);
    if (docClash) errors.push(`El docente ${slot.docenteNombre} ya está ocupado.`);
    
    const grpClash = generatedSchedule.slots.some(s => s.grupoId === slot.grupoId && s.dia === targetDay && s.moduloIndex === targetModIdx);
    if (grpClash) errors.push(`El grupo ${slot.grupoNombre} ya tiene clase.`);
    
    if (slot.espacioId) {
      const spcObj = espacios.find(sp => sp.id === slot.espacioId);
      if (spcObj && spcObj.tipo !== 'Aula') {
        const spcClash = generatedSchedule.slots.some(s => s.espacioId === slot.espacioId && s.dia === targetDay && s.moduloIndex === targetModIdx);
        if (spcClash) errors.push(`El espacio ${slot.espacioNombre} ya está ocupado.`);
      }
    }

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
      moduloIndex: targetModIdx
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
                  {asignaciones.map(a => (
                    <tr key={a.id}>
                      <td><strong>{a.docenteNombre}</strong></td>
                      <td>{a.materiaNombre}</td>
                      <td><span className="badge badge-info">{a.grupoNombre}</span></td>
                      <td>{a.horasSemanales} hrs/sem</td>
                      <td>{a.espacioNombre || <span className="text-muted">No requerido (Aula)</span>}</td>
                      <td className="actions-cell">
                        <button className="btn-icon-small" onClick={() => openEditAsignacion(a)}><Edit2 size={15} /></button>
                        <button className="btn-icon-small text-error" onClick={() => handleDeleteAsignacion(a.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
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
              {modalOpen.asignacion && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{editItem.asignacion ? 'Editar Asignación' : 'Nueva Asignación'}</h3>
                      <button className="btn-close" onClick={() => setModalOpen(prev => ({ ...prev, asignacion: false }))}>×</button>
                    </div>
                    <form onSubmit={handleSaveAsignacion}>
                      <div className="form-group">
                        <label>Docente *</label>
                        <select value={formAsignacion.docenteId} onChange={e => setFormAsignacion(prev => ({ ...prev, docenteId: e.target.value }))} required>
                          {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Materia *</label>
                        <select value={formAsignacion.materiaId} onChange={e => setFormAsignacion(prev => ({ ...prev, materiaId: e.target.value }))} required>
                          {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.grado}° grado)</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Grupo de Destino *</label>
                        <select value={formAsignacion.grupoId} onChange={e => setFormAsignacion(prev => ({ ...prev, grupoId: e.target.value }))} required>
                          {grupos.map(g => <option key={g.id} value={g.id}>{g.grado}°{g.grupo} - {g.turno}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Horas Semanales *</label>
                        <input type="number" value={formAsignacion.horasSemanales} onChange={e => setFormAsignacion(prev => ({ ...prev, horasSemanales: Number(e.target.value) }))} min={1} required />
                      </div>
                      <div className="form-group">
                        <label>Espacio Requerido</label>
                        <select value={formAsignacion.espacioId} onChange={e => setFormAsignacion(prev => ({ ...prev, espacioId: e.target.value }))}>
                          <option value="">Ninguno (Aula común)</option>
                          {espacios.map(es => <option key={es.id} value={es.id}>{es.nombre} ({es.tipo})</option>)}
                        </select>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(prev => ({ ...prev, asignacion: false }))}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar Asignación</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 7: GENERADOR DE HORARIOS & RESULTADO */}
          {/* ======================================= */}
          {activeTab === 'generador' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Generador Automático de Horarios</h2>
                  <p className="tab-header-description">Calcula o modifica manualmente los horarios escolares libres de conflictos.</p>
                </div>
              </div>

              {/* Botón principal del generador */}
              <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={handleAutoGenerateSchedule} 
                  className="btn-primary" 
                  style={{ gap: 8, padding: '12px 24px', fontSize: '1.05rem' }} 
                  disabled={saving || asignaciones.length === 0}
                >
                  <Sparkles size={20} />
                  {saving ? 'Generando Horarios...' : 'GENERAR HORARIOS AUTOMÁTICAMENTE'}
                </button>

                {generatedSchedule.updatedAt && (
                  <small className="text-muted">
                    Última generación: {new Date(generatedSchedule.updatedAt.seconds * 1000).toLocaleString('es-MX')}
                  </small>
                )}
              </div>

              {/* Calidad del Horario */}
              {generatedSchedule.slots.length > 0 && (
                <div>
                  <div className="generator-status-panel">
                    <div className="quality-card" style={{ '--q-color': generatedSchedule.quality > 85 ? '#10b981' : generatedSchedule.quality > 60 ? '#f59e0b' : '#ef4444', '--q-val': generatedSchedule.quality }}>
                      <div className="quality-progress-circle">
                        <span className="quality-value-text">{generatedSchedule.quality}%</span>
                      </div>
                      <div className="quality-info">
                        <span className="quality-title">Calidad del Horario</span>
                        <span className="quality-score">
                          {generatedSchedule.quality > 85 ? 'Excelente' : generatedSchedule.quality > 60 ? 'Aceptable' : 'Con Gaps / Pendientes'}
                        </span>
                      </div>
                    </div>

                    <div className="quality-card" style={{ flex: 1.5 }}>
                      <div style={{ width: '100%' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Resumen del Horario</h4>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            <strong>Horas Colocadas:</strong> {generatedSchedule.slots.length} horas
                          </p>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: generatedSchedule.horasPendientes.length > 0 ? '#b45309' : '#047857' }}>
                            <strong>Horas Pendientes:</strong> {generatedSchedule.horasPendientes.length} horas
                          </p>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#047857' }}>
                            <strong>Conflictos Duros:</strong> 0 (Garantizado)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advertencia de conflicto manual */}
                  {conflictWarning && (
                    <div className="conflicts-panel">
                      <div className="conflicts-header">
                        <AlertCircle size={18} />
                        <span>Conflicto Detectado: No se pudo realizar el movimiento</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f1d1d' }}>{conflictWarning}</p>
                    </div>
                  )}

                  {/* Panel de Horas Pendientes */}
                  {generatedSchedule.horasPendientes.length > 0 && (
                    <div className="pending-hours-badge">
                      <AlertCircle size={18} className="text-warning" />
                      <div>
                        <strong>Horas no colocadas ({generatedSchedule.horasPendientes.length}):</strong> Arrastra estas materias a un espacio vacío en la cuadrícula para colocarlas manualmente.
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                          {generatedSchedule.horasPendientes.map((s, idx) => (
                            <div 
                              key={s.id} 
                              className="timetable-class-card" 
                              style={{ borderLeftColor: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', cursor: 'pointer', padding: '6px 8px' }}
                              onClick={() => {
                                const day = prompt(`Escribe el día para colocar (${config.diasSemana.join(', ')}):`);
                                if (!day || !config.diasSemana.includes(day)) return;
                                const mod = prompt(`Escribe el número del módulo (1 a ${config.numModulos}):`);
                                const modIdx = Number(mod) - 1;
                                if (isNaN(modIdx) || modIdx < 0 || modIdx >= config.numModulos) return;
                                handlePlacePendingSlot(s, day, modIdx);
                              }}
                            >
                              <strong>{s.materiaNombre}</strong>
                              <span style={{ fontSize: '0.7rem' }}>{s.grupoNombre} | {s.docenteNombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selector de Horario a Visualizar */}
                  <div className="schedule-view-controls">
                    <div className="schedule-view-modes">
                      <button className={`schedule-view-mode-btn ${viewFilterMode === 'grupo' ? 'active' : ''}`} onClick={() => setViewFilterMode('grupo')}>
                        Por Grupo
                      </button>
                      <button className={`schedule-view-mode-btn ${viewFilterMode === 'docente' ? 'active' : ''}`} onClick={() => setViewFilterMode('docente')}>
                        Por Docente
                      </button>
                      <button className={`schedule-view-mode-btn ${viewFilterMode === 'espacio' ? 'active' : ''}`} onClick={() => setViewFilterMode('espacio')}>
                        Por Espacio
                      </button>
                    </div>

                    <div className="schedule-view-filter">
                      {viewFilterMode === 'grupo' && (
                        <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }}>
                          {grupos.map(g => <option key={g.id} value={g.id}>Grupo: {g.grado}°{g.grupo} - {g.turno}</option>)}
                        </select>
                      )}
                      {viewFilterMode === 'docente' && (
                        <select value={selectedDocenteId} onChange={e => setSelectedDocenteId(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }}>
                          {docentes.map(d => <option key={d.id} value={d.id}>Docente: {d.nombre}</option>)}
                        </select>
                      )}
                      {viewFilterMode === 'espacio' && (
                        <select value={selectedEspacioId} onChange={e => setSelectedEspacioId(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }}>
                          {espacios.map(es => <option key={es.id} value={es.id}>Espacio: {es.nombre} ({es.tipo})</option>)}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Cuadrícula Horaria Semanal */}
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
                          const [startH] = timeRange.split(':').map(Number);
                          
                          const isRecessTime = modIdx === 3; // Receso visual después del 3er módulo
                          
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
                                  <strong>Módulo {modIdx + 1}</strong>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{timeRange}</div>
                                </td>
                                {config.diasSemana.map(day => {
                                  // Filtrar slots de la celda en base a la vista activa
                                  let cellSlots = [];
                                  let activeIndex = -1;
                                  
                                  if (viewFilterMode === 'grupo' && selectedGroupId) {
                                    activeIndex = generatedSchedule.slots.findIndex(s => s.grupoId === selectedGroupId && s.dia === day && s.moduloIndex === modIdx);
                                    if (activeIndex !== -1) cellSlots = [generatedSchedule.slots[activeIndex]];
                                  } else if (viewFilterMode === 'docente' && selectedDocenteId) {
                                    activeIndex = generatedSchedule.slots.findIndex(s => s.docenteId === selectedDocenteId && s.dia === day && s.moduloIndex === modIdx);
                                    if (activeIndex !== -1) cellSlots = [generatedSchedule.slots[activeIndex]];
                                  } else if (viewFilterMode === 'espacio' && selectedEspacioId) {
                                    activeIndex = generatedSchedule.slots.findIndex(s => s.espacioId === selectedEspacioId && s.dia === day && s.moduloIndex === modIdx);
                                    if (activeIndex !== -1) cellSlots = [generatedSchedule.slots[activeIndex]];
                                  }

                                  return (
                                    <td 
                                      key={day}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, day, modIdx)}
                                      className={draggedSlot ? 'drop-target-active' : ''}
                                      style={{ height: '90px' }}
                                    >
                                      {cellSlots.map(slot => (
                                        <div 
                                          key={slot.id} 
                                          className="timetable-class-card"
                                          draggable
                                          onDragStart={() => handleDragStart(slot, activeIndex)}
                                          title="Arrastra para cambiar la hora de la clase o haz doble clic para quitar"
                                          onDoubleClick={() => {
                                            if (window.confirm('¿Deseas quitar esta hora y mandarla a pendientes?')) {
                                              handleRemovePlacedSlot(activeIndex);
                                            }
                                          }}
                                        >
                                          <div className="class-card-subject">{slot.materiaNombre}</div>
                                          {viewFilterMode !== 'docente' && <div className="class-card-teacher">{slot.docenteNombre}</div>}
                                          {viewFilterMode !== 'grupo' && <div className="class-card-teacher" style={{ fontWeight: 'bold' }}>Grupo: {slot.grupoNombre}</div>}
                                          
                                          <div className="class-card-meta">
                                            <span className="class-card-space">
                                              📍 {slot.espacioNombre || 'Aula'}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
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
                </div>
              )}

              {generatedSchedule.slots.length === 0 && (
                <div className="empty-state">
                  <Sparkles size={48} className="text-muted" />
                  <h3>No hay horarios generados</h3>
                  <p>Haz clic en el botón de arriba para calcular automáticamente el horario de la escuela.</p>
                </div>
              )}
            </div>
          )}

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
                                        const s = generatedSchedule.slots.find(s => s.grupoId === selectedGroupId && s.dia === day && s.moduloIndex === modIdx);
                                        if (s) cellText = `${s.materiaNombre}\n(${s.docenteNombre})\n📍 ${s.espacioNombre || 'Aula'}`;
                                      } else if (printOption === 'docente' && selectedDocenteId) {
                                        const s = generatedSchedule.slots.find(s => s.docenteId === selectedDocenteId && s.dia === day && s.moduloIndex === modIdx);
                                        if (s) cellText = `${s.materiaNombre}\nGrupo: ${s.grupoNombre}\n📍 ${s.espacioNombre || 'Aula'}`;
                                      } else if (printOption === 'espacio' && selectedEspacioId) {
                                        const s = generatedSchedule.slots.find(s => s.espacioId === selectedEspacioId && s.dia === day && s.moduloIndex === modIdx);
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
                                      const s = generatedSchedule.slots.find(s => s.grupoId === selectedGroupId && s.dia === day && s.moduloIndex === modIdx);
                                      if (s) cellText = `${s.materiaNombre}\n(${s.docenteNombre})\n📍 ${s.espacioNombre || 'Aula'}`;
                                    } else if (printOption === 'docente' && selectedDocenteId) {
                                      const s = generatedSchedule.slots.find(s => s.docenteId === selectedDocenteId && s.dia === day && s.moduloIndex === modIdx);
                                      if (s) cellText = `${s.materiaNombre}\nGrupo: ${s.grupoNombre}\n📍 ${s.espacioNombre || 'Aula'}`;
                                    } else if (printOption === 'espacio' && selectedEspacioId) {
                                      const s = generatedSchedule.slots.find(s => s.espacioId === selectedEspacioId && s.dia === day && s.moduloIndex === modIdx);
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
