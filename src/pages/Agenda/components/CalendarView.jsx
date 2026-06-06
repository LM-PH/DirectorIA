import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarView.css';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CalendarView = ({ events, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar logic
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar grid
  const renderCells = () => {
    const cells = [];
    
    // Empty cells before 1st of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      // Find events for this day
      const dayEvents = events.filter(e => e.fecha === dateStr);
      
      // Is today?
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      cells.push(
        <div key={d} className={`calendar-cell ${isToday ? 'today' : ''}`}>
          <div className="cell-header">
            <span className="day-number">{d}</span>
          </div>
          <div className="cell-events">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className={`event-badge status-${event.estado.replace(' ', '-')}`}
                onClick={() => onEventClick(event)}
                title={`${event.hora} - ${event.titulo}`}
              >
                <span className="event-time">{event.hora}</span>
                <span className="event-title">{event.titulo}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="month-selector">
          <button onClick={handlePrevMonth} className="btn-icon"><ChevronLeft size={20}/></button>
          <h2>{MONTHS[month]} {year}</h2>
          <button onClick={handleNextMonth} className="btn-icon"><ChevronRight size={20}/></button>
        </div>
      </div>
      
      <div className="calendar-grid">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
        {renderCells()}
      </div>
    </div>
  );
};

export default CalendarView;
