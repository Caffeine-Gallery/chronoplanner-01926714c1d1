import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { backend } from 'declarations/backend';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [onThisDay, setOnThisDay] = useState(null);
  const [incompleteCounts, setIncompleteCounts] = useState({});

  useEffect(() => {
    fetchIncompleteCounts();
  }, [currentDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchNotes();
      fetchOnThisDay();
    }
  }, [selectedDate]);

  const fetchIncompleteCounts = async () => {
    const counts = {};
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
      counts[date] = await backend.getIncompleteNoteCount(date);
    }
    setIncompleteCounts(counts);
  };

  const fetchNotes = async () => {
    const fetchedNotes = await backend.getNotes(formatDate(selectedDate));
    setNotes(fetchedNotes);
  };

  const fetchOnThisDay = async () => {
    const data = await backend.getOnThisDay(formatDate(selectedDate));
    setOnThisDay(data);
  };

  const addNote = async () => {
    if (newNote.trim() !== '') {
      await backend.addNote(formatDate(selectedDate), newNote);
      setNewNote('');
      fetchNotes();
      fetchIncompleteCounts();
    }
  };

  const toggleNoteComplete = async (noteId) => {
    await backend.toggleNoteComplete(formatDate(selectedDate), noteId);
    fetchNotes();
    fetchIncompleteCounts();
  };

  const requestOnThisDay = async () => {
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.selected && data.selected.length > 0) {
        const item = data.selected[0];
        await backend.setOnThisDay(formatDate(selectedDate), item.text, item.year, item.pages[0].content_urls.desktop.page);
        fetchOnThisDay();
      }
    } catch (error) {
      console.error('Error fetching On This Day data:', error);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dateString = formatDate(date);
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      days.push(
        <div
          key={i}
          className={`calendar-day ${isPast ? 'past' : ''} ${dateString === formatDate(selectedDate) ? 'selected' : ''}`}
          onClick={() => !isPast && setSelectedDate(date)}
        >
          {i}
          {!isPast && <span className="incomplete-count">{incompleteCounts[dateString] || 0}</span>}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="app">
      <h1>Daily Planner</h1>
      <div className="calendar">
        <div className="calendar-header">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>Prev</button>
          <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>Next</button>
        </div>
        <div className="calendar-grid">
          <div className="calendar-day">Sun</div>
          <div className="calendar-day">Mon</div>
          <div className="calendar-day">Tue</div>
          <div className="calendar-day">Wed</div>
          <div className="calendar-day">Thu</div>
          <div className="calendar-day">Fri</div>
          <div className="calendar-day">Sat</div>
          {renderCalendar()}
        </div>
      </div>
      {selectedDate && (
        <div className="day-detail">
          <h2>{selectedDate.toDateString()}</h2>
          <div className="on-this-day">
            <h3>On This Day</h3>
            {onThisDay ? (
              <div>
                <p>{onThisDay.title} ({onThisDay.year})</p>
                <a href={onThisDay.wikiLink} target="_blank" rel="noopener noreferrer">Read more</a>
              </div>
            ) : (
              <button onClick={requestOnThisDay}>Request Data</button>
            )}
          </div>
          <div className="notes">
            <h3>Notes</h3>
            <ul>
              {notes.map((note) => (
                <li key={note.id}>
                  <input
                    type="checkbox"
                    checked={note.isComplete}
                    onChange={() => toggleNoteComplete(note.id)}
                  />
                  <span className={note.isComplete ? 'completed' : ''}>{note.content}</span>
                </li>
              ))}
            </ul>
            <div className="add-note">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="New note"
              />
              <button onClick={addNote}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.render(<Calendar />, document.getElementById('root'));
