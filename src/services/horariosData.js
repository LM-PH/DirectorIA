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
const getSchoolCollection = (schoolId, collectionName) => {
  if (!schoolId) throw new Error("schoolId requerido");
  return collection(db, 'schools', schoolId, collectionName);
};

const getSchoolDoc = (schoolId, collectionName, id) => {
  if (!schoolId) throw new Error("schoolId requerido");
  return doc(db, 'schools', schoolId, collectionName, id);
};

const getAll = async (schoolId, collectionName) => {
  if (!schoolId) return [];
  try {
    const q = query(getSchoolCollection(schoolId, collectionName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error(`Error leyendo la colección ${collectionName}:`, e);
    return [];
  }
};

const create = async (schoolId, collectionName, data) => {
  const docRef = await addDoc(getSchoolCollection(schoolId, collectionName), data);
  return { id: docRef.id, ...data };
};

const update = async (schoolId, collectionName, id, data) => {
  const docRef = getSchoolDoc(schoolId, collectionName, id);
  await updateDoc(docRef, data);
  return { id, ...data };
};

const remove = async (schoolId, collectionName, id) => {
  const docRef = getSchoolDoc(schoolId, collectionName, id);
  await deleteDoc(docRef);
  return id;
};

// --- Configuración ---
export const getConfig = async (schoolId) => {
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

  if (!schoolId) return { id: 'temp-id', ...defaultConf };

  try {
    const configs = await getAll(schoolId, COLLECTIONS.CONFIG);
    if (configs.length > 0) return configs[0];
  } catch (e) {
    console.warn("No se pudo leer la configuración:", e);
    return { id: 'temp-id', ...defaultConf };
  }
  
  try {
    const newConf = await create(schoolId, COLLECTIONS.CONFIG, defaultConf);
    return newConf;
  } catch (e) {
    console.warn("No se pudo crear la config por defecto en DB:", e);
    return { id: 'temp-id', ...defaultConf };
  }
};

export const saveConfig = async (schoolId, id, data) => {
  if (id && id !== 'temp-id') {
    return await update(schoolId, COLLECTIONS.CONFIG, id, data);
  }
  return await create(schoolId, COLLECTIONS.CONFIG, data);
};

// --- Docentes ---
export const getDocentes = (schoolId) => getAll(schoolId, COLLECTIONS.DOCENTES);
export const createDocente = (schoolId, data) => create(schoolId, COLLECTIONS.DOCENTES, data);
export const updateDocente = (schoolId, id, data) => update(schoolId, COLLECTIONS.DOCENTES, id, data);
export const deleteDocente = (schoolId, id) => remove(schoolId, COLLECTIONS.DOCENTES, id);

// --- Grupos ---
export const getGrupos = (schoolId) => getAll(schoolId, COLLECTIONS.GRUPOS);
export const createGrupo = (schoolId, data) => create(schoolId, COLLECTIONS.GRUPOS, data);
export const updateGrupo = (schoolId, id, data) => update(schoolId, COLLECTIONS.GRUPOS, id, data);
export const deleteGrupo = (schoolId, id) => remove(schoolId, COLLECTIONS.GRUPOS, id);

// --- Materias ---
export const getMaterias = (schoolId) => getAll(schoolId, COLLECTIONS.MATERIAS);
export const createMateria = (schoolId, data) => create(schoolId, COLLECTIONS.MATERIAS, data);
export const updateMateria = (schoolId, id, data) => update(schoolId, COLLECTIONS.MATERIAS, id, data);
export const deleteMateria = (schoolId, id) => remove(schoolId, COLLECTIONS.MATERIAS, id);

// --- Espacios ---
export const getEspacios = (schoolId) => getAll(schoolId, COLLECTIONS.ESPACIOS);
export const createEspacio = (schoolId, data) => create(schoolId, COLLECTIONS.ESPACIOS, data);
export const updateEspacio = (schoolId, id, data) => update(schoolId, COLLECTIONS.ESPACIOS, id, data);
export const deleteEspacio = (schoolId, id) => remove(schoolId, COLLECTIONS.ESPACIOS, id);

// --- Horarios Generados ---
export const getHorariosGenerados = (schoolId) => getAll(schoolId, COLLECTIONS.GENERADOS);
export const saveHorarioGenerado = (schoolId, data) => create(schoolId, COLLECTIONS.GENERADOS, data);
export const deleteHorarioGenerado = (schoolId, id) => remove(schoolId, COLLECTIONS.GENERADOS, id);
