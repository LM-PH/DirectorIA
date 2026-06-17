/**
 * Motor Heurístico de Generación de Horarios
 */

export class ScheduleGenerator {
  constructor(config, docentes, grupos, materias, espacios, asignaciones = []) {
    this.config = config;
    this.docentes = docentes;
    this.grupos = grupos;
    this.materias = materias;
    this.espacios = espacios;
    this.asignaciones = asignaciones;
    
    // Matriz principal: { [grupoId]: { [dia]: { [modulo]: Asignacion } } }
    this.horario = {};
    // Control de disponibilidad: { [docenteId]: { [dia]: { [modulo]: boolean } } }
    this.disponibilidadDocente = {};
    // Control de espacios: { [espacioId]: { [dia]: { [modulo]: boolean } } }
    this.disponibilidadEspacio = {};
    
    // Matriz de talleres: { [dia]: { [modulo]: Array<Taller> } }
    this.horarioTalleres = {};
    
    this.conflictos = [];
    this.puntuacion = 0;
  }

  generar() {
    this.paso1_crearMatrizVacia();
    // En una implementación real más compleja con miles de variables,
    // se preparan las listas de clases a asignar basadas en las materias de cada grupo y horas semanales.
    
    // Generar la lista de clases a asignar
    let clasesPorAsignar = this.prepararClases();

    this.paso2_colocarBloquesFijos(clasesPorAsignar);
    this.paso3_colocarTalleres(clasesPorAsignar);
    this.paso4_colocarFisicaYQuimica(clasesPorAsignar);
    this.paso5_colocarRestricciones(clasesPorAsignar);
    this.paso6_colocarNormales(clasesPorAsignar);
    this.paso7_optimizarHuecos();
    this.paso8_calcularCalidad();

    return {
      horario: this.flattenHorario(),
      conflictos: this.conflictos,
      puntuacion: this.puntuacion
    };
  }

  paso1_crearMatrizVacia() {
    const dias = this.config.diasLaborables.length;
    const modulos = this.config.modulosPorDia;

    this.grupos.forEach(g => {
      this.horario[g.id] = {};
      for (let d = 0; d < dias; d++) {
        this.horario[g.id][d] = {};
        if (!this.horarioTalleres[d]) this.horarioTalleres[d] = {};
        for (let m = 0; m < modulos; m++) {
          this.horario[g.id][d][m] = null;
          this.horarioTalleres[d][m] = [];
        }
      }
    });

    this.docentes.forEach(d => {
      this.disponibilidadDocente[d.id] = {};
      for (let dia = 0; dia < dias; dia++) {
        this.disponibilidadDocente[d.id][dia] = {};
        for (let m = 0; m < modulos; m++) {
          // Inicializar basado en las restricciones del docente si las tiene (ej. no primeras horas)
          this.disponibilidadDocente[d.id][dia][m] = true; 
        }
      }
    });

    this.espacios.forEach(e => {
      this.disponibilidadEspacio[e.id] = {};
      for (let dia = 0; dia < dias; dia++) {
        this.disponibilidadEspacio[e.id][dia] = {};
        for (let m = 0; m < modulos; m++) {
          this.disponibilidadEspacio[e.id][dia][m] = true;
        }
      }
    });
  }

  prepararClases() {
    const clases = [];
    this.asignaciones.forEach(asig => {
      const horas = asig.horas || 1;
      for (let i = 0; i < horas; i++) {
        clases.push({
          id: `${asig.id}_${i}`,
          docenteId: asig.docenteId,
          materiaId: asig.materiaId,
          grupoId: asig.grupoId,
          espacioId: asig.espacioId,
          asignacionOriginal: asig
        });
      }
    });
    
    // Sort so that Talleres (no grupoId) are scheduled FIRST
    // Otherwise they will never find a slot where ALL groups are free
    clases.sort((a, b) => {
      if (!a.grupoId && b.grupoId) return -1;
      if (a.grupoId && !b.grupoId) return 1;
      return 0;
    });
    
    return clases;
  }

  paso2_colocarBloquesFijos() {
    // Iterar clases de tipo "7. Bloque fijo"
  }

  paso3_colocarTalleres() {
    // Tipo "4. Tecnología/Taller"
    // Buscar bloques de 2 consecutivos
  }

  paso4_colocarFisicaYQuimica() {
    // Tipo "2. Física", "3. Química"
    // Obligatorio bloque doble, no cruza receso (receso en config)
  }

  paso5_colocarRestricciones() {
    // Materias especiales o con docentes con restricciones fuertes
  }

  paso6_colocarNormales(clasesPorAsignar) {
    const dias = this.config.diasLaborables.length;
    const modulos = this.config.modulosPorDia;

    clasesPorAsignar.forEach(clase => {
      let asignada = false;

      if (!clase.grupoId) {
        // TALLER
        for (let d = 0; d < dias && !asignada; d++) {
          for (let m = 0; m < modulos && !asignada; m++) {
            if (!this.disponibilidadDocente[clase.docenteId][d][m]) continue;
            if (clase.espacioId && !this.disponibilidadEspacio[clase.espacioId][d][m]) continue;
            
            const gruposTienenClaseNormal = this.grupos.some(g => this.horario[g.id][d][m] !== null);
            if (gruposTienenClaseNormal) continue;
            
            this.disponibilidadDocente[clase.docenteId][d][m] = false;
            if (clase.espacioId) this.disponibilidadEspacio[clase.espacioId][d][m] = false;
            
            this.horarioTalleres[d][m].push({
              docenteId: clase.docenteId,
              materiaId: clase.materiaId,
              espacioId: clase.espacioId,
              isTaller: true
            });
            asignada = true;
          }
        }
      } else {
        // NORMAL
        const targetGrupos = [this.grupos.find(g => g.id === clase.grupoId)].filter(Boolean);
        if (targetGrupos.length === 0) return;

        for (let d = 0; d < dias && !asignada; d++) {
          for (let m = 0; m < modulos && !asignada; m++) {
            if (!this.disponibilidadDocente[clase.docenteId][d][m]) continue;
            if (clase.espacioId && !this.disponibilidadEspacio[clase.espacioId][d][m]) continue;
            if (this.horario[clase.grupoId][d][m] !== null) continue;
            if (this.horarioTalleres[d][m].length > 0) continue; // Un grupo no puede tomar clase normal si hay taller general

            this.disponibilidadDocente[clase.docenteId][d][m] = false;
            if (clase.espacioId) this.disponibilidadEspacio[clase.espacioId][d][m] = false;

            this.horario[clase.grupoId][d][m] = {
              docenteId: clase.docenteId,
              materiaId: clase.materiaId,
              espacioId: clase.espacioId,
              isTaller: false
            };
            asignada = true;
          }
        }
      }

      if (!asignada) {
        const docName = this.docentes.find(doc => doc.id === clase.docenteId)?.nombre || 'Desconocido';
        const matName = this.materias.find(m => m.id === clase.materiaId)?.nombre || 'Materia';
        this.conflictos.push({
          mensaje: `Imposible acomodar ${matName} de ${docName}. Horario saturado o conflicto de maestro/grupo/espacio.`
        });
      }
    });
  }

  paso7_optimizarHuecos() {
    // Intercambios locales para reducir huecos libres entre clases de un docente.
  }

  paso8_calcularCalidad() {
    let score = 100 - (this.conflictos.length * 15);
    if (score < 0) score = 0;
    this.puntuacion = score;
  }

  flattenHorario() {
    const res = [];
    Object.keys(this.horario).forEach(gId => {
      Object.keys(this.horario[gId]).forEach(d => {
        Object.keys(this.horario[gId][d]).forEach(m => {
          if (this.horario[gId][d][m]) {
            res.push({
              grupoId: gId,
              dia: this.config.diasLaborables[parseInt(d)], // MAP TO ACTUAL DAY
              modulo: parseInt(m),
              ...this.horario[gId][d][m]
            });
          }
        });
      });
    });

    Object.keys(this.horarioTalleres).forEach(d => {
      Object.keys(this.horarioTalleres[d]).forEach(m => {
        this.horarioTalleres[d][m].forEach(taller => {
          res.push({
            grupoId: null,
            dia: this.config.diasLaborables[parseInt(d)],
            modulo: parseInt(m),
            ...taller
          });
        });
      });
    });

    return res;
  }

  // --- Funciones Utilitarias del Algoritmo ---
  cruzaReceso(moduloInicio, duracion) {
    // Si duracion es 2 módulos (doble bloque), verificar si receso cae en medio
    // Ejemplo: receso despues de modulo 3 (indice 2). 
    // Si moduloInicio es 2, el bloque es modulos 2 y 3. El receso está entre ellos.
    const moduloReceso = this.config.receso.despuesDeModulo - 1; 
    for(let i=0; i<duracion-1; i++) {
        if (moduloInicio + i === moduloReceso) return true;
    }
    return false;
  }
}
