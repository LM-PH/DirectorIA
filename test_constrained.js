import { ScheduleGenerator } from './src/services/ScheduleGenerator.js';

const config = { diasLaborables: [1,2,3,4,5], modulosPorDia: 8, receso: { despuesDeModulo: 4, duracion: 20 } };

const docentes = [
  {id:'d1', nombre:'Super Math Teacher'}, // 30 hours (6 groups * 5 hours)
  {id:'d2', nombre:'Other Teacher'}
];

const grupos = Array.from({length: 6}, (_,i) => ({id:`g${i+1}`, grado:1, grupo:String.fromCharCode(65+i)}));

const materias = [
  {id:'m1', nombre:'Matemáticas'}, {id:'m2', nombre:'Otra'}
];

const asignaciones = [];
for (let g of grupos) {
  asignaciones.push({id:`a_${g.id}_1`, docenteId:'d1', materiaId:'m1', grupoId:g.id, horas:5}); // 5 hrs of Math
  for(let i=0; i<35; i++) {
     asignaciones.push({id:`a_${g.id}_2_${i}`, docenteId:'d2', materiaId:'m2', grupoId:g.id, horas:1}); // 35 hrs of Other
  }
}

const gen = new ScheduleGenerator(config, docentes, grupos, materias, [], asignaciones);
try {
  const result = gen.generar();
  console.log("Unassigned:", result.conflictos.length);
} catch(e) {
  console.error("Error:", e);
}
