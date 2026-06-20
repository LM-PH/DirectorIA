import { ScheduleGenerator } from './src/services/ScheduleGenerator.js';

const config = { diasLaborables: [1,2,3,4,5], modulosPorDia: 8, receso: { despuesDeModulo: 4, duracion: 20 } };
const docentes = [{id:'d4', nombre:'Taller 1A'}, {id:'d5', nombre:'Taller 1B'}];
const grupos = [{id:'g1', grado:1, grupo:'A'}, {id:'g2', grado:1, grupo:'B'}];
const materias = [{id:'m4', nombre:'Taller 1'}];

const asignaciones = [
  {id:'a1', docenteId:'d4', materiaId:'m4', grupoId:'g1', horas:8, isTaller:true, gradoTaller:1},
  {id:'a2', docenteId:'d5', materiaId:'m4', grupoId:'g2', horas:8, isTaller:true, gradoTaller:1}
];

const gen = new ScheduleGenerator(config, docentes, grupos, materias, [], asignaciones);
try {
  const result = gen.generar();
  console.log("Unassigned:", result.conflictos.length);
} catch(e) {
  console.error("Error:", e);
}
