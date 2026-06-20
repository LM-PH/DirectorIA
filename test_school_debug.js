import { ScheduleGenerator } from './src/services/ScheduleGenerator.js';

// Simulamos una escuela completa
const config = { diasLaborables: [1,2,3,4,5], modulosPorDia: 8, receso: { despuesDeModulo: 4, duracion: 20 } };

const docentes = [
  {id:'d4', nombre:'Taller Teacher'}
];

const grupos = [
  {id:'g1', grado:1, grupo:'A'}, {id:'g2', grado:1, grupo:'B'}
];

const materias = [
  {id:'m4', nombre:'Taller 1'}
];

const asignaciones = [];
for (let g of grupos) {
  asignaciones.push({id:`a_${g.id}_4`, docenteId:'d4', materiaId:'m4', grupoId:g.id, horas:8, isTaller:true, gradoTaller:g.grado});
}

const gen = new ScheduleGenerator(config, docentes, grupos, materias, [], asignaciones);
try {
  const result = gen.generar();
  console.log("Unassigned classes:", result.conflictos.length);
  console.log(result.conflictos.map(c => c.mensaje).join('\n'));
} catch(e) {
  console.error("Error:", e);
}
