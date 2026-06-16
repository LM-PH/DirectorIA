/**
 * Validador de Horarios
 */

export class ScheduleValidator {
  constructor(config, horario, docentes, grupos, espacios) {
    this.config = config;
    this.horario = horario; // array plano o matriz, asumimos flat array de asignaciones
    this.docentes = docentes;
    this.grupos = grupos;
    this.espacios = espacios;
  }

  validar() {
    const conflictos = [];
    const controlDocente = {};
    const controlEspacio = {};
    const controlGrupo = {};

    this.horario.forEach(clase => {
      const key = `${clase.dia}-${clase.modulo}`;

      // 1. Docente duplicado (mismo módulo)
      if (clase.docenteId) {
        if (!controlDocente[clase.docenteId]) controlDocente[clase.docenteId] = {};
        if (controlDocente[clase.docenteId][key]) {
          conflictos.push({ tipo: 'docente_duplicado', mensaje: `El docente ${clase.docenteId} está asignado a más de un grupo el día ${clase.dia} módulo ${clase.modulo}`, clase });
        } else {
          controlDocente[clase.docenteId][key] = clase;
        }
      }

      // 2. Grupo duplicado
      if (clase.grupoId) {
        if (!controlGrupo[clase.grupoId]) controlGrupo[clase.grupoId] = {};
        if (controlGrupo[clase.grupoId][key]) {
          conflictos.push({ tipo: 'grupo_duplicado', mensaje: `El grupo ${clase.grupoId} tiene más de una materia asignada el día ${clase.dia} módulo ${clase.modulo}`, clase });
        } else {
          controlGrupo[clase.grupoId][key] = clase;
        }
      }

      // 3. Espacio duplicado
      if (clase.espacioId) {
        if (!controlEspacio[clase.espacioId]) controlEspacio[clase.espacioId] = {};
        if (controlEspacio[clase.espacioId][key]) {
          conflictos.push({ tipo: 'espacio_duplicado', mensaje: `El espacio ${clase.espacioId} está ocupado el día ${clase.dia} módulo ${clase.modulo}`, clase });
        } else {
          controlEspacio[clase.espacioId][key] = clase;
        }
      }
      
      // 4. Clase en receso
      // (Asumiendo que el UI no permite arrastrar a la columna de receso, pero validamos cruces si es bloque doble)
      if (clase.duracion === 2) {
          const cruzaReceso = this.cruzaReceso(clase.modulo, clase.duracion);
          if (cruzaReceso) {
              conflictos.push({ tipo: 'cruza_receso', mensaje: `La clase de 2 módulos cruza el receso el día ${clase.dia} desde el módulo ${clase.modulo}`, clase });
          }
      }
    });

    // Validar Horas Faltantes o Excedidas (comparando con el total de materias del grupo)
    // Validar Física y Química con bloques dobles
    // Validar Taller indiviso
    
    return {
      esValido: conflictos.length === 0,
      conflictos
    };
  }

  cruzaReceso(moduloInicio, duracion) {
    const moduloReceso = this.config.receso.despuesDeModulo - 1; 
    for(let i=0; i<duracion-1; i++) {
        if (moduloInicio + i === moduloReceso) return true;
    }
    return false;
  }
}
