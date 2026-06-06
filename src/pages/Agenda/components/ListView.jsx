import React from 'react';
import { Calendar as CalendarIcon, Clock, Tag, User, AlignLeft } from 'lucide-react';
import './ListView.css';

const ListView = ({ events, onEventClick }) => {
  // Sort events by date and time
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.hora}`);
    const dateB = new Date(`${b.fecha}T${b.hora}`);
    return dateA - dateB;
  });

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(`${dateString}T12:00:00`); // Force local timezone
    return date.toLocaleDateString('es-MX', options);
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="empty-state">
        <CalendarIcon size={48} className="text-muted" />
        <h3>No hay eventos programados</h3>
        <p>Haz clic en "Nuevo Evento" para agregar uno.</p>
      </div>
    );
  }

  return (
    <div className="list-container">
      {sortedEvents.map(event => (
        <div 
          key={event.id} 
          className="list-card"
          onClick={() => onEventClick(event)}
        >
          <div className={`status-indicator bg-status-${event.estado.replace(' ', '-')}`}></div>
          
          <div className="list-card-content">
            <div className="list-card-header">
              <h3>{event.titulo}</h3>
              <span className={`badge badge-${event.estado.replace(' ', '-')}`}>
                {event.estado}
              </span>
            </div>
            
            <div className="list-card-details">
              <div className="detail-item">
                <CalendarIcon size={16} />
                <span style={{ textTransform: 'capitalize' }}>{formatDate(event.fecha)}</span>
              </div>
              <div className="detail-item">
                <Clock size={16} />
                <span>{event.hora}</span>
              </div>
              <div className="detail-item">
                <Tag size={16} />
                <span>{event.tipo}</span>
              </div>
              <div className="detail-item">
                <User size={16} />
                <span>{event.responsable}</span>
              </div>
            </div>

            {event.descripcion && (
              <div className="detail-description">
                <AlignLeft size={16} />
                <p>{event.descripcion}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListView;
