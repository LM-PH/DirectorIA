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
    this.paso0_validarVolumen();
    this.paso1_crearMatrizVacia();
    
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

  paso0_validarVolumen() {
    const dias = this.config.diasLaborables?.length || 5;
    const modulos = this.config.modulosPorDia || 7;
    const totalSlots = dias * modulos;
    
    this.docenteLoad = {};
    this.grupoLoad = {};
    
    this.asignaciones.forEach(a => {
      const h = a.horas || 1;
      if (a.grupoId) this.grupoLoad[a.grupoId] = (this.grupoLoad[a.grupoId] || 0) + h;
      if (a.docenteId) this.docenteLoad[a.docenteId] = (this.docenteLoad[a.docenteId] || 0) + h;
    });

    for (const [gId, horas] of Object.entries(this.grupoLoad)) {
      if (horas > totalSlots) {
        const gName = this.grupos.find(g => g.id === gId)?.grado ? `${this.grupos.find(g => g.id === gId).grado}° ${this.grupos.find(g => g.id === gId).grupo}` : gId;
        this.conflictos.push({
          mensaje: `⚠️ EL GRUPO ${gName} TIENE ${horas} HORAS ASIGNADAS, PERO LA SEMANA SÓLO TIENE ${totalSlots} ESPACIOS.`
        });
      }
    }

    for (const [dId, horas] of Object.entries(this.docenteLoad)) {
      if (horas > totalSlots) {
        const dName = this.docentes.find(d => d.id === dId)?.nombre || dId;
        this.conflictos.push({
          mensaje: `⚠️ EL DOCENTE ${dName} TIENE ${horas} HORAS ASIGNADAS EN TOTAL, SUPERANDO LOS ${totalSlots} ESPACIOS DE LA SEMANA.`
        });
      }
    }
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
    const dias = this.config.diasLaborables.length || 5;
    this.asignaciones.forEach(asig => {
      const horas = asig.horas || 1;
      for (let i = 0; i < horas; i++) {
        clases.push({
          id: `${asig.id}_${i}`,
          docenteId: asig.docenteId,
          materiaId: asig.materiaId,
          grupoId: asig.grupoId,
          espacioId: asig.espacioId,
          asignacionOriginal: asig,
          diaPreferido: i % dias
        });
      }
    });
    
    // Sort so that Talleres (no grupoId) are scheduled FIRST
    // Otherwise they will never find a slot where ALL groups are free
    clases.sort((a, b) => {
      if (!a.grupoId && b.grupoId) return -1;
      if (a.grupoId && !b.grupoId) return 1;
      
      const loadA = this.docenteLoad[a.docenteId] || 0;
      const loadB = this.docenteLoad[b.docenteId] || 0;
      return loadB - loadA; // Mayor carga primero
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

      if (!this.disponibilidadDocente[clase.docenteId]) {
        this.conflictos.push({ mensaje: `Asignación ignorada: el docente asignado ya no existe.` });
        return;
      }
      if (clase.espacioId && !this.disponibilidadEspacio[clase.espacioId]) {
        this.conflictos.push({ mensaje: `Asignación ignorada: el espacio asignado ya no existe.` });
        return;
      }

      if (!clase.grupoId) {
        // TALLER
        let startD = clase.diaPreferido || 0;
        for (let offset = 0; offset < dias && !asignada; offset++) {
          let d = (startD + offset) % dias;
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

        let startD = clase.diaPreferido || 0;
        for (let offset = 0; offset < dias && !asignada; offset++) {
          let d = (startD + offset) % dias;
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
        
        // Si no se asignó por fragmentación, intentar un SWAP de 1 nivel
        if (!asignada) {
          asignada = this.intentarAcomodarConSwap(clase, dias, modulos);
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

  intentarAcomodarConSwap(clase, dias, modulos) {
    if (!clase.grupoId) return false;
    
    for (let d = 0; d < dias; d++) {
      for (let m = 0; m < modulos; m++) {
        // Buscamos un slot libre para el grupo y espacio, pero docente ocupado
        if (this.horario[clase.grupoId][d][m] !== null) continue;
        if (clase.espacioId && !this.disponibilidadEspacio[clase.espacioId][d][m]) continue;
        if (this.horarioTalleres[d][m].length > 0) continue;
        
        if (!this.disponibilidadDocente[clase.docenteId][d][m]) {
          // Identificar qué clase está dando el docente
          let claseOcupante = null;
          let grupoOcupanteId = null;
          for (const g of this.grupos) {
            const c = this.horario[g.id][d][m];
            if (c && c.docenteId === clase.docenteId && !c.isTaller) {
              claseOcupante = c;
              grupoOcupanteId = g.id;
              break;
            }
          }
          
          if (claseOcupante) {
            // Intentar reubicar a claseOcupante
            for (let d2 = 0; d2 < dias; d2++) {
              for (let m2 = 0; m2 < modulos; m2++) {
                if (d2 === d && m2 === m) continue;
                
                if (this.horario[grupoOcupanteId][d2][m2] === null &&
                    this.disponibilidadDocente[clase.docenteId][d2][m2] &&
                    (!claseOcupante.espacioId || this.disponibilidadEspacio[claseOcupante.espacioId][d2][m2]) &&
                    this.horarioTalleres[d2][m2].length === 0) 
                {
                  // Mover ocupante
                  this.horario[grupoOcupanteId][d2][m2] = claseOcupante;
                  this.disponibilidadDocente[clase.docenteId][d2][m2] = false;
                  if (claseOcupante.espacioId) this.disponibilidadEspacio[claseOcupante.espacioId][d2][m2] = false;
                  
                  // Liberar anterior
                  this.horario[grupoOcupanteId][d][m] = null;
                  if (claseOcupante.espacioId) this.disponibilidadEspacio[claseOcupante.espacioId][d][m] = true;
                  
                  // Acomodar nuestra clase
                  this.horario[clase.grupoId][d][m] = {
                    docenteId: clase.docenteId,
                    materiaId: clase.materiaId,
                    espacioId: clase.espacioId,
                    isTaller: false
                  };
                  if (clase.espacioId) this.disponibilidadEspacio[clase.espacioId][d][m] = false;
                  
                  return true;
                }
              }
            }
          }
        }
      }
    }
    return false;
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
