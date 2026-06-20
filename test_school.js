import { ScheduleGenerator } from './src/services/ScheduleGenerator.js';

// Simulamos una escuela completa
const config = { diasLaborables: [1,2,3,4,5], modulosPorDia: 8, receso: { despuesDeModulo: 4, duracion: 20 } };

const docentes = [
  {id:'d1', nombre:'Math Teacher'}, {id:'d2', nombre:'Spanish Teacher'},
  {id:'d3', nombre:'Sci Teacher'}, {id:'d4', nombre:'Taller Teacher'},
  {id:'d5', nombre:'Geo Teacher'}, {id:'d6', nombre:'Hist Teacher'},
  {id:'d7', nombre:'Eng Teacher'}, {id:'d8', nombre:'PE Teacher'},
  {id:'d9', nombre:'Art Teacher'}, {id:'d10', nombre:'FCYE Teacher'}
];

const grupos = [
  {id:'g1', grado:1, grupo:'A'}, {id:'g2', grado:1, grupo:'B'},
  {id:'g3', grado:2, grupo:'A'}, {id:'g4', grado:2, grupo:'B'}
];

const materias = [
  {id:'m1', nombre:'Matemáticas'}, {id:'m2', nombre:'Español'},
  {id:'m3', nombre:'Biología'}, {id:'m4', nombre:'Taller 1'},
  {id:'m5', nombre:'Geografía'}, {id:'m6', nombre:'Historia'},
  {id:'m7', nombre:'Inglés'}, {id:'m8', nombre:'Edu. Física'},
  {id:'m9', nombre:'Artes'}, {id:'m10', nombre:'FCYE'}
];

const asignaciones = [];
for (let g of grupos) {
  asignaciones.push({id:`a_${g.id}_1`, docenteId:'d1', materiaId:'m1', grupoId:g.id, horas:5});
  asignaciones.push({id:`a_${g.id}_2`, docenteId:'d2', materiaId:'m2', grupoId:g.id, horas:5});
  asignaciones.push({id:`a_${g.id}_3`, docenteId:'d3', materiaId:'m3', grupoId:g.id, horas:4});
  asignaciones.push({id:`a_${g.id}_4`, docenteId:'d4', materiaId:'m4', grupoId:g.id, horas:8, isTaller:true, gradoTaller:g.grado});
  asignaciones.push({id:`a_${g.id}_5`, docenteId:'d5', materiaId:'m5', grupoId:g.id, horas:4});
  asignaciones.push({id:`a_${g.id}_6`, docenteId:'d6', materiaId:'m6', grupoId:g.id, horas:2});
  asignaciones.push({id:`a_${g.id}_7`, docenteId:'d7', materiaId:'m7', grupoId:g.id, horas:3});
  asignaciones.push({id:`a_${g.id}_8`, docenteId:'d8', materiaId:'m8', grupoId:g.id, horas:2});
  asignaciones.push({id:`a_${g.id}_9`, docenteId:'d9', materiaId:'m9', grupoId:g.id, horas:3});
  asignaciones.push({id:`a_${g.id}_10`, docenteId:'d10', materiaId:'m10', grupoId:g.id, horas:2});
}

const gen = new ScheduleGenerator(config, docentes, grupos, materias, [], asignaciones);
try {
  const result = gen.generar();
  console.log("Unassigned classes:", result.conflictos.length);
  console.log(result.conflictos.map(c => c.mensaje).join('\n'));
} catch(e) {
  console.error("Error:", e);
}
