import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { uploadToCloudinary } from '../../services/cloudinary';
import { 
  Briefcase, FileText, Send, CheckCircle, 
  ChevronLeft, BookOpen, AlertCircle, Layers, CheckSquare 
} from 'lucide-react';
import './PortalDocente.css';

const TIPOS_SOLICITUD = [
  { id: 'planeacion', label: 'Planeación Didáctica', icon: <BookOpen size={28}/>, color: '#10b981', desc: 'Entrega de planeaciones de clase' },
  { id: 'programa_analitico', label: 'Programa Analítico', icon: <Layers size={28}/>, color: '#8b5cf6', desc: 'Entrega de codiseño y programa analítico' },
  { id: 'reporte', label: 'Reporte de Actividades', icon: <CheckSquare size={28}/>, color: '#ec4899', desc: 'Reporte final o periódico de actividades' },
  { id: 'permiso', label: 'Permiso Económico', icon: <Briefcase size={28}/>, color: '#3b82f6', desc: 'Ausencia justificada por motivos personales' },
  { id: 'documento', label: 'Otro Documento / Oficio', icon: <FileText size={28}/>, color: '#f59e0b', desc: 'Cualquier otro documento o comunicación oficial' },
];

const PortalDocente = () => {
  const { schoolId } = useParams();
  const [step, setStep] = useState('select'); // 'select' | 'form' | 'success' | 'error'
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    fecha: new Date().toISOString().split('T')[0],
    motivo: '',
    descripcion: '',
    linkAdjunto: '',
  });

  const handleSelectType = (tipo) => {
    setTipoSeleccionado(tipo);
    setStep('form');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!schoolId) { setStep('error'); return; }
    setLoading(true);

    try {
      let adjuntos = [];

      // Si el docente adjuntó un archivo físico (PDF, Word, etc.)
      if (archivo) {
        const res = await uploadToCloudinary(archivo, `schools/${schoolId}/public_uploads`);
        adjuntos.push({
          url: res.url,
          nombre: archivo.name,
          tipo: 'file'
        });
      }

      // Si también agregó un link externo
      if (form.linkAdjunto) {
        adjuntos.push({
          url: form.linkAdjunto,
          nombre: 'Enlace externo',
          tipo: 'link'
        });
      }

      const payload = {
        remitenteNombre: form.nombre,
        remitenteEmail: form.email,
        fecha: new Date().toISOString(),
        asunto: `${tipoSeleccionado.label} - ${form.nombre}`,
        cuerpo: form.descripcion || form.motivo,
        estado: 'pendiente',
        tipoSugerido: tipoSeleccionado.id === 'permiso' ? 'Permisos' : 'Repositorio',
        adjuntos: adjuntos,
        metadatos: {
          tipo: tipoSeleccionado.id,
          fechaSolicitud: form.fecha,
          motivo: form.motivo || '',
        },
        source: 'portal_docente',
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'schools', schoolId, 'correos_recibidos'), payload);
      setStep('success');
    } catch (err) {
      console.error(err);
      setStep('error');
    }
    setLoading(false);
  };

  return (
    <div className="portal-container">
      <header className="portal-header">
        <div className="portal-logo">
          <h1>Director<span>IA</span></h1>
          <p>Portal de Envío Docente</p>
        </div>
      </header>

      <main className="portal-main">
        {/* STEP 1: Selección de tipo */}
        {step === 'select' && (
          <div className="portal-card">
            <h2>¿Qué deseas enviar?</h2>
            <p className="portal-subtitle">Selecciona el tipo de documento o solicitud.</p>
            <div className="tipo-grid">
              {TIPOS_SOLICITUD.map(tipo => (
                <button
                  key={tipo.id}
                  className="tipo-card"
                  style={{ '--tipo-color': tipo.color }}
                  onClick={() => handleSelectType(tipo)}
                >
                  <div className="tipo-icon" style={{ color: tipo.color }}>{tipo.icon}</div>
                  <strong>{tipo.label}</strong>
                  <span>{tipo.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Formulario */}
        {step === 'form' && tipoSeleccionado && (
          <div className="portal-card">
            <div className="form-header">
              <button className="portal-back" onClick={() => setStep('select')}>
                <ChevronLeft size={18}/> Cambiar tipo
              </button>
              <div className="form-tipo-badge" style={{ background: tipoSeleccionado.color }}>
                {tipoSeleccionado.icon} {tipoSeleccionado.label}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="portal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Tu nombre completo *</label>
                  <input name="nombre" required value={form.nombre} onChange={handleChange} placeholder="Ej. María López García"/>
                </div>
                <div className="form-group">
                  <label>Tu correo electrónico *</label>
                  <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="tu@correo.com"/>
                </div>
              </div>

              <div className="form-group">
                <label>Fecha {tipoSeleccionado.id === 'permiso' ? 'del permiso' : 'de entrega'} *</label>
                <input type="date" name="fecha" required value={form.fecha} onChange={handleChange}/>
              </div>

              {tipoSeleccionado.id === 'permiso' && (
                <div className="form-group">
                  <label>Motivo del permiso *</label>
                  <input name="motivo" required value={form.motivo} onChange={handleChange} placeholder="Ej. Cita médica, asunto familiar..."/>
                </div>
              )}

              <div className="form-group">
                <label>Descripción adicional</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} placeholder="Información adicional que quieras comunicar al director..."/>
              </div>

              <div className="form-group">
                <label>Adjuntar Archivo Físico (PDF, Word, Imagen, etc.) [Opcional]</label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArchivo(e.target.files[0]);
                    }
                  }}
                  style={{ background: '#f8fafc', padding: '0.6rem' }}
                />
                <small>Puedes adjuntar directamente tu archivo de planeación, reporte o justificante (Máximo 20MB).</small>
              </div>

              <div className="form-group">
                <label>O comparte un enlace del documento (Google Drive, Dropbox, etc.)</label>
                <input name="linkAdjunto" value={form.linkAdjunto} onChange={handleChange} placeholder="https://drive.google.com/... o cualquier enlace"/>
                <small>Usa esto si prefieres compartir un enlace externo de tu archivo.</small>
              </div>

              <button type="submit" className="portal-submit-btn" disabled={loading}>
                {loading ? 'Enviando archivo...' : <><Send size={18}/> Enviar al Director</>}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Éxito */}
        {step === 'success' && (
          <div className="portal-card portal-result">
            <div className="result-icon success">
              <CheckCircle size={64}/>
            </div>
            <h2>¡Enviado con éxito!</h2>
            <p>Tu {tipoSeleccionado?.label?.toLowerCase()} ha sido entregada al director. Recibirás respuesta pronto.</p>
            <button className="portal-submit-btn" onClick={() => { setStep('select'); setArchivo(null); setForm({ nombre:'', email:'', fecha: new Date().toISOString().split('T')[0], motivo:'', descripcion:'', linkAdjunto:'' }); }}>
              Enviar otro documento
            </button>
          </div>
        )}

        {/* STEP 4: Error */}
        {step === 'error' && (
          <div className="portal-card portal-result">
            <div className="result-icon error">
              <AlertCircle size={64}/>
            </div>
            <h2>Enlace no válido</h2>
            <p>Este enlace de portal no está activo. Por favor solicita un nuevo enlace a tu director.</p>
          </div>
        )}
      </main>

      <footer className="portal-footer">
        <p>Powered by <strong>DirectorIA</strong> — Sistema de Gestión Escolar</p>
      </footer>
    </div>
  );
};

export default PortalDocente;
