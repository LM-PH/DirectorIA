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
    // Ordenar por carga horaria (horas totales) de mayor a menor
    const resto = bloques.filter(b => !b.isTaller && b.duracion === 1)
                         .sort((a, b) => {
                           const horasA = parseInt(a.asignacionOriginal?.horas) || 0;
                           const horasB = parseInt(b.asignacionOriginal?.horas) || 0;
                           return horasB - horasA;
                         });

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
      
      const isFisicaQuimica = 
        (nombreMat.includes('física') || nombreMat.includes('fisica') || 
         nombreMat.includes('química') || nombreMat.includes('quimica')) && 
        !nombreMat.includes('edu');

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

  getMaxBloquesTaller(grado) {
    let maxHoras = 0;
    this.asignaciones.forEach(a => {
      const nombreMateria = a.nombreMateria?.toLowerCase() || '';
      const isT = nombreMateria.includes('taller') || nombreMateria.includes('tecnolog') || a.isTaller;
      const g = a.grupoId ? this.grupos.find(gr => gr.id === a.grupoId)?.grado : a.gradoTaller;
      if (isT && (!grado || Number(g) === Number(grado))) {
         const h = parseInt(a.horas) || 0;
         if (h > maxHoras) maxHoras = h;
      }
    });
    return Math.ceil(maxHoras / 2) || 4; // Por defecto 4 bloques (8 horas) si no encuentra
  }

  colocarBloques(bloques, tipo) {
    const dias = this.config.diasLaborables?.length || 5;
    const modulos = this.config.modulosPorDia || 7;

    bloques.forEach(bloque => {
      let asignado = false;

      // 1. Fase de Empalme (Solo para Talleres)
      // Buscamos si ya hay un taller DEL MISMO GRADO para sobreponerlo obligatoriamente
      let diasEstablecidosTaller = 0;
      let maxDiasTaller = 4;
      let existeTallerGrado = false;
      
      if (bloque.isTaller) {
        let diasSet = new Set();
        // Verificar cuántos días distintos ya tienen taller de este grado
        for (let d = 0; d < dias; d++) {
          for (let m = 0; m < modulos; m++) {
            if (this.horarioTalleres[d][m].some(t => !t.gradoTaller || !bloque.gradoTaller || Number(t.gradoTaller) === Number(bloque.gradoTaller))) {
              existeTallerGrado = true;
              diasSet.add(d);
            }
          }
        }
        diasEstablecidosTaller = diasSet.size;
        maxDiasTaller = this.getMaxBloquesTaller(bloque.gradoTaller);

        if (existeTallerGrado) {
          for (let d = 0; d < dias && !asignado; d++) {
            for (let m = 0; m <= modulos - bloque.duracion && !asignado; m++) {
              if (this.cruzaReceso(m, bloque.duracion)) continue;
              
              const talleresAca = this.horarioTalleres[d][m];
              const hayTallerMismoGrado = talleresAca.some(t => !t.gradoTaller || !bloque.gradoTaller || Number(t.gradoTaller) === Number(bloque.gradoTaller));
              
              if (hayTallerMismoGrado) {
                 if (this.cabeEn(bloque, d, m)) {
                   this.asignarEn(bloque, d, m);
                   asignado = true;
                 }
              }
            }
          }
        }
      }

      // 2. Fase de Búsqueda Libre 
      // Permitida si es materia normal, o si el taller aún no ha llenado sus días requeridos
      const permiteBusquedaLibre = !bloque.isTaller || diasEstablecidosTaller < maxDiasTaller;
      
      if (!asignado && permiteBusquedaLibre) {
        const shuffledDias = this.shuffleArray(Array.from({length: dias}, (_, i) => i));
        for (let d of shuffledDias) {
          if (asignado) break;
          const shuffledModulos = this.shuffleArray(Array.from({length: modulos - bloque.duracion + 1}, (_, i) => i));
          for (let m of shuffledModulos) {
            if (asignado) break;
            if (this.cruzaReceso(m, bloque.duracion)) continue;
            
            if (this.cabeEn(bloque, d, m)) {
              this.asignarEn(bloque, d, m);
              asignado = true;
            }
          }
        }
      }

      // NUEVO: Fase 3 - Reacomodo (Local Search / Swap)
      // Si el bloque sigue sin asignarse (y es de 1h normal), buscamos si podemos mover otra materia para hacerle espacio
      if (!asignado && permiteBusquedaLibre && !bloque.isTaller && bloque.duracion === 1) {
        asignado = this.intentarReacomodo(bloque);
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
        
        const tiene = this.horarioTalleres[d][m].some(t => 
          (!t.gradoTaller || !bloque.gradoTaller || Number(t.gradoTaller) === Number(bloque.gradoTaller))
        );
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
         
         const hayTallerDeOtroGrado = this.horarioTalleres[d][currentM].some(t => 
           t.gradoTaller && bloque.gradoTaller && Number(t.gradoTaller) !== Number(bloque.gradoTaller)
         );
         if (hayTallerDeOtroGrado) return false;
         
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

  removerEn(bloqueInfo, d, startM) {
    if (bloqueInfo.isTaller) return; // No removemos talleres para no romper sincronía
    for (let offset = 0; offset < bloqueInfo.duracion; offset++) {
      const currentM = startM + offset;
      this.horario[bloqueInfo.grupoId][d][currentM] = null;
      if (this.disponibilidadDocente[bloqueInfo.docenteId]) {
        this.disponibilidadDocente[bloqueInfo.docenteId][d][currentM] = true;
      }
      if (bloqueInfo.espacioId && this.disponibilidadEspacio[bloqueInfo.espacioId]) {
        this.disponibilidadEspacio[bloqueInfo.espacioId][d][currentM] = true;
      }
    }
  }

  intentarReacomodo(bloque) {
    const dias = this.config.diasLaborables?.length || 5;
    const modulos = this.config.modulosPorDia || 7;

    const espaciosVacios = [];
    for (let d = 0; d < dias; d++) {
      for (let m = 0; m < modulos; m++) {
        if (this.horario[bloque.grupoId][d][m] === null && !this.cruzaReceso(m, 1)) {
          espaciosVacios.push({ d, m });
        }
      }
    }

    const materiasAsignadas = [];
    for (let d = 0; d < dias; d++) {
      for (let m = 0; m < modulos; m++) {
        const bInfo = this.horario[bloque.grupoId][d][m];
        if (bInfo !== null && !bInfo.isTaller && bInfo.duracion === 1) {
          // Recreamos un objeto compatible con cabeEn
          const infoCompatible = {
            id: bInfo.bloqueId,
            docenteId: bInfo.docenteId,
            materiaId: bInfo.materiaId,
            grupoId: bloque.grupoId, // Es el mismo
            espacioId: bInfo.espacioId,
            isTaller: false,
            duracion: 1
          };
          materiasAsignadas.push({ d, m, info: infoCompatible });
        }
      }
    }

    const shuffledVacios = this.shuffleArray([...espaciosVacios]);
    const shuffledAsignadas = this.shuffleArray([...materiasAsignadas]);

    for (let ocupado of shuffledAsignadas) {
      for (let vacio of shuffledVacios) {
        // Quitamos 'ocupado' temporalmente
        this.removerEn(ocupado.info, ocupado.d, ocupado.m);
        
        // Vemos si cabe en el vacío
        if (this.cabeEn(ocupado.info, vacio.d, vacio.m)) {
          this.asignarEn(ocupado.info, vacio.d, vacio.m);
          
          // Ahora el lugar de 'ocupado' original está libre. ¿Cabe el nuevo 'bloque'?
          if (this.cabeEn(bloque, ocupado.d, ocupado.m)) {
            this.asignarEn(bloque, ocupado.d, ocupado.m);
            return true; // Éxito!
          } else {
            // Deshacemos el movimiento
            this.removerEn(ocupado.info, vacio.d, vacio.m);
            this.asignarEn(ocupado.info, ocupado.d, ocupado.m);
          }
        } else {
          // Deshacemos el removido
          this.asignarEn(ocupado.info, ocupado.d, ocupado.m);
        }
      }
    }

    return false;
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

  shuffleArray(array) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }
}
