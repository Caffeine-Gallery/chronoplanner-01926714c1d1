import { backend } from 'declarations/backend';

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.notes = [];
        this.onThisDay = null;
        this.incompleteCounts = {};

        this.calendarElement = document.getElementById('calendar');
        this.dayDetailElement = document.getElementById('day-detail');

        this.renderCalendar();
        this.fetchIncompleteCounts();
    }

    async fetchIncompleteCounts() {
        const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = this.formatDate(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), i));
            this.incompleteCounts[date] = await backend.getIncompleteNoteCount(date);
        }
        this.renderCalendar();
    }

    async fetchNotes() {
        this.notes = await backend.getNotes(this.formatDate(this.selectedDate));
        this.renderDayDetail();
    }

    async fetchOnThisDay() {
        this.onThisDay = await backend.getOnThisDay(this.formatDate(this.selectedDate));
        this.renderDayDetail();
    }

    async addNote(content) {
        if (content.trim() !== '') {
            await backend.addNote(this.formatDate(this.selectedDate), content);
            await this.fetchNotes();
            await this.fetchIncompleteCounts();
        }
    }

    async toggleNoteComplete(noteId) {
        await backend.toggleNoteComplete(this.formatDate(this.selectedDate), noteId);
        await this.fetchNotes();
        await this.fetchIncompleteCounts();
    }

    async requestOnThisDay() {
        const month = this.selectedDate.getMonth() + 1;
        const day = this.selectedDate.getDate();
        const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.selected && data.selected.length > 0) {
                const item = data.selected[0];
                await backend.setOnThisDay(this.formatDate(this.selectedDate), item.text, item.year, item.pages[0].content_urls.desktop.page);
                await this.fetchOnThisDay();
            }
        } catch (error) {
            console.error('Error fetching On This Day data:', error);
        }
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    renderCalendar() {
        const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).getDay();

        let calendarHTML = `
            <div class="calendar-header">
                <button id="prev-month">Prev</button>
                <h2>${this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button id="next-month">Next</button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day">Sun</div>
                <div class="calendar-day">Mon</div>
                <div class="calendar-day">Tue</div>
                <div class="calendar-day">Wed</div>
                <div class="calendar-day">Thu</div>
                <div class="calendar-day">Fri</div>
                <div class="calendar-day">Sat</div>
        `;

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), i);
            const dateString = this.formatDate(date);
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
            const isSelected = dateString === this.formatDate(this.selectedDate);

            calendarHTML += `
                <div class="calendar-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateString}">
                    ${i}
                    ${!isPast ? `<span class="incomplete-count">${this.incompleteCounts[dateString] || 0}</span>` : ''}
                </div>
            `;
        }

        calendarHTML += '</div>';
        this.calendarElement.innerHTML = calendarHTML;

        this.calendarElement.querySelector('#prev-month').addEventListener('click', () => this.changeMonth(-1));
        this.calendarElement.querySelector('#next-month').addEventListener('click', () => this.changeMonth(1));

        this.calendarElement.querySelectorAll('.calendar-day:not(.empty):not(.past)').forEach(day => {
            day.addEventListener('click', () => this.selectDate(new Date(day.dataset.date)));
        });
    }

    renderDayDetail() {
        if (!this.selectedDate) {
            this.dayDetailElement.innerHTML = '';
            return;
        }

        let dayDetailHTML = `
            <h2>${this.selectedDate.toDateString()}</h2>
            <div class="on-this-day">
                <h3>On This Day</h3>
                ${this.onThisDay ? `
                    <div>
                        <p>${this.onThisDay.title} (${this.onThisDay.year})</p>
                        <a href="${this.onThisDay.wikiLink}" target="_blank" rel="noopener noreferrer">Read more</a>
                    </div>
                ` : `
                    <button id="request-on-this-day">Request Data</button>
                `}
            </div>
            <div class="notes">
                <h3>Notes</h3>
                <ul>
                    ${this.notes.map(note => `
                        <li>
                            <input type="checkbox" ${note.isComplete ? 'checked' : ''} data-note-id="${note.id}">
                            <span class="${note.isComplete ? 'completed' : ''}">${note.content}</span>
                        </li>
                    `).join('')}
                </ul>
                <div class="add-note">
                    <input type="text" id="new-note" placeholder="New note">
                    <button id="add-note">Add</button>
                </div>
            </div>
        `;

        this.dayDetailElement.innerHTML = dayDetailHTML;

        if (!this.onThisDay) {
            this.dayDetailElement.querySelector('#request-on-this-day').addEventListener('click', () => this.requestOnThisDay());
        }

        this.dayDetailElement.querySelectorAll('.notes input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.toggleNoteComplete(parseInt(e.target.dataset.noteId)));
        });

        const addNoteButton = this.dayDetailElement.querySelector('#add-note');
        const newNoteInput = this.dayDetailElement.querySelector('#new-note');
        addNoteButton.addEventListener('click', () => {
            this.addNote(newNoteInput.value);
            newNoteInput.value = '';
        });
    }

    changeMonth(delta) {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + delta, 1);
        this.renderCalendar();
        this.fetchIncompleteCounts();
    }

    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
        this.fetchNotes();
        this.fetchOnThisDay();
    }
}

new Calendar();
