import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Calendar as CalendarIcon, List, Plus, Trash2, Edit2 } from 'lucide-react';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import EventModal from './components/EventModal';
import './Agenda.css';

const Agenda = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);

  useEffect(() => {
    // Listen to agenda collection
    const q = query(collection(db, 'agenda'), orderBy('fecha', 'asc'), orderBy('hora', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching agenda:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleOpenNewEvent = () => {
    setEventToEdit(null);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleEditClick = (event) => {
    setEventToEdit(event);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('¿Estás seguro de eliminar este evento?')) {
      try {
        await deleteDoc(doc(db, 'agenda', eventId));
        setSelectedEvent(null);
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (eventData.id) {
        // Update
        const { id, ...dataToUpdate } = eventData;
        await updateDoc(doc(db, 'agenda', id), {
          ...dataToUpdate,
          updatedAt: new Date()
        });
      } else {
        // Create
        await addDoc(collection(db, 'agenda'), {
          ...eventData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error("Error saving event:", error);
      throw error;
    }
  };

  return (
    <div className="module-container agenda-module">
      <div className="agenda-header">
        <div>
          <h1 className="module-title">Agenda Directiva</h1>
          <p className="module-description">Programa y gestiona las actividades escolares.</p>
        </div>
        
        <div className="agenda-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Vista de Calendario"
            >
              <CalendarIcon size={18} />
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista de Lista"
            >
              <List size={18} />
            </button>
          </div>
          
          <button className="btn-primary" onClick={handleOpenNewEvent}>
            <Plus size={18} /> Nuevo Evento
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando eventos...</div>
      ) : (
        <div className="agenda-content">
          {viewMode === 'calendar' ? (
            <CalendarView events={events} onEventClick={handleEventClick} />
          ) : (
            <ListView events={events} onEventClick={handleEventClick} />
          )}

          {/* Side panel for selected event details */}
          {selectedEvent && (
            <div className="event-details-panel">
              <div className="panel-header">
                <h3>Detalles del Evento</h3>
                <button className="btn-close" onClick={() => setSelectedEvent(null)}>×</button>
              </div>
              <div className="panel-body">
                <span className={`badge badge-${selectedEvent.estado.replace(' ', '-')}`}>
                  {selectedEvent.estado}
                </span>
                <h2 className="detail-title">{selectedEvent.titulo}</h2>
                <div className="detail-meta">
                  <p><strong>Fecha:</strong> {selectedEvent.fecha}</p>
                  <p><strong>Hora:</strong> {selectedEvent.hora}</p>
                  <p><strong>Tipo:</strong> {selectedEvent.tipo}</p>
                  <p><strong>Responsable:</strong> {selectedEvent.responsable}</p>
                </div>
                {selectedEvent.descripcion && (
                  <div className="detail-block">
                    <h4>Descripción</h4>
                    <p>{selectedEvent.descripcion}</p>
                  </div>
                )}
                {selectedEvent.observaciones && (
                  <div className="detail-block">
                    <h4>Observaciones</h4>
                    <p>{selectedEvent.observaciones}</p>
                  </div>
                )}
              </div>
              <div className="panel-footer">
                <button className="btn-icon text-primary" onClick={() => handleEditClick(selectedEvent)}>
                  <Edit2 size={18} /> Editar
                </button>
                <button className="btn-icon text-error" onClick={() => handleDelete(selectedEvent.id)}>
                  <Trash2 size={18} /> Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
      />
    </div>
  );
};

export default Agenda;
