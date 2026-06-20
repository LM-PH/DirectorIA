import { ScheduleGenerator } from './src/services/ScheduleGenerator.js';

const config = { diasLaborables: [1,2,3,4,5], modulosPorDia: 8, receso: { despuesDeModulo: 4, duracion: 20 } };

const docentes = [
  {id:'d1', nombre:'Math'}, // 30h
  {id:'d2', nombre:'Spanish'}, // 30h
  {id:'d3', nombre:'Sci'}, // 24h
  {id:'d4', nombre:'Taller1'}, {id:'d5', nombre:'Taller2'}, {id:'d6', nombre:'Taller3'}, // 8h each
  {id:'d7', nombre:'Geo'}, // 24h
  {id:'d8', nombre:'Hist'}, // 12h
  {id:'d9', nombre:'Eng'}, // 18h
  {id:'d10', nombre:'PE'}, // 12h
  {id:'d11', nombre:'Art'}, // 18h
  {id:'d12', nombre:'FCYE'} // 12h
];

const grupos = Array.from({length: 6}, (_,i) => ({id:`g${i+1}`, grado:1, grupo:String.fromCharCode(65+i)}));

const asignaciones = [];
for (let i = 0; i < 6; i++) {
  const g = grupos[i];
  asignaciones.push({id:`a${i}_1`, docenteId:'d1', materiaId:'m1', grupoId:g.id, horas:5});
  asignaciones.push({id:`a${i}_2`, docenteId:'d2', materiaId:'m2', grupoId:g.id, horas:5});
  asignaciones.push({id:`a${i}_3`, docenteId:'d3', materiaId:'m3', grupoId:g.id, horas:4});
  
  // Taller: we assign different teachers to different groups or just one teacher per group to simulate proper separation
  const tallerDocId = i < 2 ? 'd4' : (i < 4 ? 'd5' : 'd6');
  asignaciones.push({id:`a${i}_4`, docenteId:tallerDocId, materiaId:'m4', grupoId:g.id, horas:8, isTaller:true, gradoTaller:1});
  
  asignaciones.push({id:`a${i}_5`, docenteId:'d7', materiaId:'m5', grupoId:g.id, horas:4});
  asignaciones.push({id:`a${i}_6`, docenteId:'d8', materiaId:'m6', grupoId:g.id, horas:2});
  asignaciones.push({id:`a${i}_7`, docenteId:'d9', materiaId:'m7', grupoId:g.id, horas:3});
  asignaciones.push({id:`a${i}_8`, docenteId:'d10', materiaId:'m8', grupoId:g.id, horas:2});
  asignaciones.push({id:`a${i}_9`, docenteId:'d11', materiaId:'m9', grupoId:g.id, horas:3});
  asignaciones.push({id:`a${i}_10`, docenteId:'d12', materiaId:'m10', grupoId:g.id, horas:2});
}
// Sum per group: 5+5+4+8+4+2+3+2+3+2 = 38 hours per group. So 2 free spaces per group.
// Teacher max load: Math (30), Spanish (30), Sci (24), Taller (16), Geo (24), Hist (12), Eng (18), PE (12), Art (18), FCYE (12).
// Max load is 30. So ALL are < 40. Mathematically highly solvable.

const gen = new ScheduleGenerator(config, docentes, grupos, [], [], asignaciones);
try {
  const result = gen.generar();
  console.log("Unassigned:", result.conflictos.length);
} catch(e) {
  console.error("Error:", e);
}
