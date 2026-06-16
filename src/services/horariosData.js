import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTIONS = {
  CONFIG: 'horarios_configuracion',
  DOCENTES: 'horarios_docentes',
  GRUPOS: 'horarios_grupos',
  MATERIAS: 'horarios_materias',
  ESPACIOS: 'horarios_espacios',
  GENERADOS: 'horarios_generados',
};

// --- Helper Functions Genéricas ---
const getAll = async (collectionName) => {
  try {
    const q = query(collection(db, collectionName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error(`Error leyendo la colección ${collectionName}:`, e);
    return [];
  }
};



const create = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return { id: docRef.id, ...data };
};

const update = async (collectionName, id, data) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
  return { id, ...data };
};

const remove = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
  return id;
};

// --- Configuración ---
export const getConfig = async () => {
  const defaultConf = {
    escuela: "Mi Escuela",
    turno: "Matutino",
    cicloEscolar: "2024-2025",
    horaEntrada: "07:00",
    horaSalida: "13:10",
    modulosPorDia: 7,
    duracionModulo: 50,
    receso: {
      despuesDeModulo: 3,
      duracion: 20
    },
    diasLaborables: [1, 2, 3, 4, 5]
  };

  try {
    const configs = await getAll(COLLECTIONS.CONFIG);
    if (configs.length > 0) return configs[0];
  } catch (e) {
    console.warn("No se pudo leer la configuración (posible falta de permisos o sin conexión):", e);
    return { id: 'temp-id', ...defaultConf };
  }
  
  try {
    const newConf = await create(COLLECTIONS.CONFIG, defaultConf);
    return newConf;
  } catch (e) {
    console.warn("No se pudo crear la config por defecto en DB:", e);
    return { id: 'temp-id', ...defaultConf };
  }
};

export const saveConfig = async (id, data) => {
  if (id) {
    return await update(COLLECTIONS.CONFIG, id, data);
  }
  return await create(COLLECTIONS.CONFIG, data);
};

// --- Docentes ---
export const getDocentes = () => getAll(COLLECTIONS.DOCENTES);
export const createDocente = (data) => create(COLLECTIONS.DOCENTES, data);
export const updateDocente = (id, data) => update(COLLECTIONS.DOCENTES, id, data);
export const deleteDocente = (id) => remove(COLLECTIONS.DOCENTES, id);

// --- Grupos ---
export const getGrupos = () => getAll(COLLECTIONS.GRUPOS);
export const createGrupo = (data) => create(COLLECTIONS.GRUPOS, data);
export const updateGrupo = (id, data) => update(COLLECTIONS.GRUPOS, id, data);
export const deleteGrupo = (id) => remove(COLLECTIONS.GRUPOS, id);

// --- Materias ---
export const getMaterias = () => getAll(COLLECTIONS.MATERIAS);
export const createMateria = (data) => create(COLLECTIONS.MATERIAS, data);
export const updateMateria = (id, data) => update(COLLECTIONS.MATERIAS, id, data);
export const deleteMateria = (id) => remove(COLLECTIONS.MATERIAS, id);

// --- Espacios ---
export const getEspacios = () => getAll(COLLECTIONS.ESPACIOS);
export const createEspacio = (data) => create(COLLECTIONS.ESPACIOS, data);
export const updateEspacio = (id, data) => update(COLLECTIONS.ESPACIOS, id, data);
export const deleteEspacio = (id) => remove(COLLECTIONS.ESPACIOS, id);

// --- Horarios Generados ---
export const getHorariosGenerados = () => getAll(COLLECTIONS.GENERADOS);
export const saveHorarioGenerado = (data) => create(COLLECTIONS.GENERADOS, data);
export const deleteHorarioGenerado = (id) => remove(COLLECTIONS.GENERADOS, id);
