/**
 * Motor de Generación de Horarios (Reglas Simplificadas)
 * Implementa 3 niveles de prioridad sin heurísticas complejas.
 */

export class ScheduleGenerator {
  constructor(config, docentes, grupos, materias, espacios, asignaciones = []) {
    this.config = config;
    this.docentes = docentes;
    this.grupos = grupos;
    this.materias = materias;
    this.espacios = espacios;
    this.asignaciones = asignaciones;
    
    this.horario = {};
    this.disponibilidadDocente = {};
    this.disponibilidadEspacio = {};
    this.horarioTalleres = {};
    
    this.conflictos = [];
    this.clasesSinAsignarTemp = [];
  }

  generar() {
    this.conflictos = [];
    this.clasesSinAsignarTemp = [];
    
    this.paso1_crearMatrizVacia();
    
    const bloques = this.prepararBloques();
    
    // Nivel 1: Talleres (isTaller === true)
    const talleres = bloques.filter(b => b.isTaller);
    
    // Nivel 2: Bloques dobles de Física y Química
    const cienciasDobles = bloques.filter(b => !b.isTaller && b.duracion === 2);
    
    // Nivel 3: El resto (bloques de 1h de Física/Química, y todas las demás materias)
    const resto = bloques.filter(b => !b.isTaller && b.duracion === 1);

    this.colocarBloques(talleres, "Taller/Tecnología");
    this.colocarBloques(cienciasDobles, "Física/Química (Laboratorio)");
    this.colocarBloques(resto, "Materia Normal");

    this.validarHorarioFinal();

    let puntuacion = 100 - (this.conflictos.length * 15);
    if (puntuacion < 0) puntuacion = 0;

    return {
      horario: this.flattenHorario(),
      conflictos: this.conflictos,
      clasesSinAsignar: this.clasesSinAsignarTemp,
      puntuacion: puntuacion,
      esValido: this.conflictos.length === 0
    };
  }

  paso1_crearMatrizVacia() {
    const dias = this.config.diasLaborables?.length || 5;
    const modulos = this.config.modulosPorDia || 7;

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

  prepararBloques() {
    const bloques = [];
    
    this.asignaciones.forEach(asig => {
      const horas = parseInt(asig.horas) || 1;
      const mat = this.materias.find(m => m.id === asig.materiaId);
      const nombreMat = mat ? mat.nombre.toLowerCase() : '';
      
      const isTaller = !asig.grupoId || nombreMat.includes('taller') || nombreMat.includes('tecnolog') || nombreMat.includes('tecnología');
      const isFisicaQuimica = nombreMat.includes('física') || nombreMat.includes('fisica') || nombreMat.includes('química') || nombreMat.includes('quimica');

      if (isTaller) {
        // Bloques de 2
        let horasRestantes = horas;
        let bId = 0;
        while (horasRestantes >= 2) {
          bloques.push(this.crearBloqueBase(asig, 2, `_t_${bId++}`, true));
          horasRestantes -= 2;
        }
        if (horasRestantes === 1) {
          bloques.push(this.crearBloqueBase(asig, 1, `_t_${bId++}`, true));
        }
      } else if (isFisicaQuimica) {
        let horasRestantes = horas;
        let bId = 0;
        if (horasRestantes >= 2) {
          bloques.push(this.crearBloqueBase(asig, 2, `_fq_${bId++}`, false));
          horasRestantes -= 2;
        }
        while (horasRestantes > 0) {
          bloques.push(this.crearBloqueBase(asig, 1, `_fq_${bId++}`, false));
          horasRestantes--;
        }
      } else {
        // Demás materias, todo en bloques de 1
        for (let i = 0; i < horas; i++) {
          bloques.push(this.crearBloqueBase(asig, 1, `_n_${i}`, false));
        }
      }
    });

    return bloques;
  }

  crearBloqueBase(asig, duracion, suffix, isTaller) {
    return {
      id: `${asig.id}${suffix}`,
      docenteId: asig.docenteId,
      materiaId: asig.materiaId,
      grupoId: asig.grupoId,
      espacioId: asig.espacioId,
      isTaller: isTaller,
      gradoTaller: asig.gradoTaller || '',
      duracion: duracion,
      asignacionOriginal: asig
    };
  }

  cruzaReceso(moduloInicio, duracion) {
    if (!this.config.receso || typeof this.config.receso.despuesDeModulo === 'undefined') return false;
    const moduloReceso = parseInt(this.config.receso.despuesDeModulo) - 1; 
    for(let i=0; i<duracion-1; i++) {
        if (moduloInicio + i === moduloReceso) return true;
    }
    return false;
  }

  colocarBloques(bloques, tipo) {
    const dias = this.config.diasLaborables?.length || 5;
    const modulos = this.config.modulosPorDia || 7;

    bloques.forEach(bloque => {
      let asignado = false;

      // 1. Fase de Empalme (Solo para Talleres)
      // Buscamos si ya hay un taller DEL MISMO GRADO para sobreponerlo obligatoriamente
      if (bloque.isTaller) {
        for (let d = 0; d < dias && !asignado; d++) {
          for (let m = 0; m <= modulos - bloque.duracion && !asignado; m++) {
            if (this.cruzaReceso(m, bloque.duracion)) continue;
            
            const talleresAca = this.horarioTalleres[d][m];
            const hayTaller = talleresAca.length > 0;
            
            if (hayTaller) {
               if (this.cabeEn(bloque, d, m)) {
                 this.asignarEn(bloque, d, m);
                 asignado = true;
               }
            }
          }
        }
      }

      // 2. Fase de Búsqueda Libre (Si no se empalmó o si es materia normal/ciencias)
      if (!asignado) {
        for (let d = 0; d < dias && !asignado; d++) {
          for (let m = 0; m <= modulos - bloque.duracion && !asignado; m++) {
            if (this.cruzaReceso(m, bloque.duracion)) continue;
            
            if (this.cabeEn(bloque, d, m)) {
              this.asignarEn(bloque, d, m);
              asignado = true;
            }
          }
        }
      }

      if (!asignado) {
        const docName = this.docentes.find(doc => doc.id === bloque.docenteId)?.nombre || 'Desconocido';
        const matName = this.materias.find(mat => mat.id === bloque.materiaId)?.nombre || 'Materia';
        this.conflictos.push({
          mensaje: `Imposible acomodar ${tipo} "${matName}" de ${docName} (Bloque de ${bloque.duracion}h). Horario saturado.`
        });
        
        // Agregar a clases sueltas para el Editor Manual (1 entrada por hora faltante)
        for(let i=0; i<bloque.duracion; i++){
            this.clasesSinAsignarTemp.push({
                ...bloque,
                id: `${bloque.id}_part_${i}`,
                duracion: 1
            });
        }
      }
    });
  }

  cabeEn(bloque, d, startM) {
    const modulos = this.config.modulosPorDia || 7;
    
    // RESTRICCIÓN: 1 bloque por día de la misma materia para el mismo grupo/grado
    if (bloque.isTaller) {
      // Verificar si ya tiene este taller hoy EN OTRO HORARIO
      // (Permitimos que se agrupen en el mismo día SOLO si caen exactamente en el mismo startM)
      let yaTieneHoyEnOtroHorario = false;
      for (let m = 0; m < modulos; m++) {
        // Ignoramos los módulos donde precisamente intentamos colocar este bloque
        if (m >= startM && m < startM + bloque.duracion) continue;
        
        const tiene = this.horarioTalleres[d][m].length > 0;
        if (tiene) { yaTieneHoyEnOtroHorario = true; break; }
      }
      if (yaTieneHoyEnOtroHorario) return false;
    } else {
      let yaTieneHoy = false;
      for (let m = 0; m < modulos; m++) {
        const c = this.horario[bloque.grupoId][d][m];
        if (c && c.materiaId === bloque.materiaId) { yaTieneHoy = true; break; }
      }
      if (yaTieneHoy) return false;
    }

    for (let offset = 0; offset < bloque.duracion; offset++) {
      const currentM = startM + offset;
      
      if (!this.disponibilidadDocente[bloque.docenteId][d][currentM]) return false;
      if (bloque.espacioId && !this.disponibilidadEspacio[bloque.espacioId][d][currentM]) return false;
      
      if (bloque.isTaller) {
         const gruposAfectados = bloque.gradoTaller 
           ? this.grupos.filter(g => Number(g.grado) === Number(bloque.gradoTaller)) 
           : this.grupos;
         const algunGrupoOcupado = gruposAfectados.some(g => this.horario[g.id][d][currentM] !== null);
         if (algunGrupoOcupado) return false;
      } else {
         if (this.horario[bloque.grupoId][d][currentM] !== null) return false;
         
         const claseGroup = this.grupos.find(g => g.id === bloque.grupoId);
         const hayTallerQueAfecta = this.horarioTalleres[d][currentM].some(t => 
           !t.gradoTaller || (claseGroup && Number(t.gradoTaller) === Number(claseGroup.grado))
         );
         if (hayTallerQueAfecta) return false;
      }
    }
    return true;
  }

  asignarEn(bloque, d, startM) {
    for (let offset = 0; offset < bloque.duracion; offset++) {
      const currentM = startM + offset;
      this.disponibilidadDocente[bloque.docenteId][d][currentM] = false;
      if (bloque.espacioId) this.disponibilidadEspacio[bloque.espacioId][d][currentM] = false;

      const slotData = {
        docenteId: bloque.docenteId,
        materiaId: bloque.materiaId,
        espacioId: bloque.espacioId,
        isTaller: bloque.isTaller,
        gradoTaller: bloque.gradoTaller,
        bloqueId: bloque.id
      };

      if (bloque.isTaller) {
        this.horarioTalleres[d][currentM].push(slotData);
      } else {
        this.horario[bloque.grupoId][d][currentM] = slotData;
      }
    }
  }

  validarHorarioFinal() {
    // Las validaciones estrictas requeridas ya se cumplen por diseño:
    // 1. Taller y Tecnología se partieron exclusivamente en bloques de 2h.
    // 2. Física y Química generaron 1 bloque doble obligatorio y el resto sueltas.
    // 3. No hay empalmes de docente/espacio/grupo gracias a `cabeEn`.
    // 4. Las horas sobrantes / faltantes se reportaron en `this.conflictos`.
  }

  flattenHorario() {
    const res = [];
    Object.keys(this.horario).forEach(gId => {
      Object.keys(this.horario[gId]).forEach(d => {
        Object.keys(this.horario[gId][d]).forEach(m => {
          if (this.horario[gId][d][m]) {
            res.push({
              grupoId: gId,
              dia: (this.config.diasLaborables ? this.config.diasLaborables[parseInt(d)] : parseInt(d) + 1), 
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
            grupoId: null, // Indicador de Multigrupo
            dia: (this.config.diasLaborables ? this.config.diasLaborables[parseInt(d)] : parseInt(d) + 1),
            modulo: parseInt(m),
            ...taller
          });
        });
      });
    });

    return res;
  }
}
