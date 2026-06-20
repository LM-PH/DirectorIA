import { ScheduleGenerator } from './src/services/ScheduleGenerator.js';

const config = { diasLaborables: [1,2,3,4,5], modulosPorDia: 7 };
const docentes = [{id:'doc1', nombre:'Hector'}];
const grupos = [{id:'g1', grado:1}];
const materias = [{id:'mat1', nombre:'Taller 1'}];
const asignaciones = [
  {id:'a1', docenteId:'doc1', materiaId:'mat1', grupoId:'g1', horas:8, isTaller:true, gradoTaller: 1}
];

const gen = new ScheduleGenerator(config, docentes, grupos, materias, [], asignaciones);
try {
  gen.generar();
  console.log("Success");
} catch(e) {
  console.error("Error:", e);
}
