/**
 * Motor Heurístico de Generación de Horarios
 */

export class ScheduleGenerator {
  constructor(config, docentes, grupos, materias, espacios) {
    this.config = config;
    this.docentes = docentes;
    this.grupos = grupos;
    this.materias = materias;
    this.espacios = espacios;
    
    // Matriz principal: { [grupoId]: { [dia]: { [modulo]: Asignacion } } }
    this.horario = {};
    // Control de disponibilidad: { [docenteId]: { [dia]: { [modulo]: boolean } } }
    this.disponibilidadDocente = {};
    // Control de espacios: { [espacioId]: { [dia]: { [modulo]: boolean } } }
    this.disponibilidadEspacio = {};
    
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
        for (let m = 0; m < modulos; m++) {
          this.horario[g.id][d][m] = null;
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
    // A partir de los grupos y materias, crear objetos individuales de clase por cada hora
    // Esto dependerá de cómo se vinculan los docentes con los grupos y materias.
    // Para simplificar, suponemos que las materias ya vienen con horas semanales.
    const clases = [];
    
    // Aquí se leerían las asignaciones hechas previamente por el usuario (Materia -> Grupo -> Docente -> Horas)
    // Supondremos un array dummy para el esqueleto.
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

  paso6_colocarNormales() {
    // Materias restantes. Buscar el primer hueco disponible iterando dias y módulos.
  }

  paso7_optimizarHuecos() {
    // Intercambios locales para reducir huecos libres entre clases de un docente.
  }

  paso8_calcularCalidad() {
    let score = 0;
    // Ejemplo:
    // +10 preferencia docente cumplida.
    // +8 reducción de huecos.
    // +5 distribución equilibrada.
    // -5 por hueco.
    // -10 por restricción preferente incumplida.
    // -100 por conflicto obligatorio.
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
              dia: parseInt(d),
              modulo: parseInt(m),
              ...this.horario[gId][d][m]
            });
          }
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
