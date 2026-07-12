class CalendarService {
  async getEvents() {
    return [
      { 
        id: 'evt_1', 
        summary: 'Lumina Discovery Sync', 
        start: new Date(Date.now() + 24 * 3600000).toISOString(), 
        end: new Date(Date.now() + 25 * 3600000).toISOString(),
        description: 'Initial brainstorming session for design system.'
      },
      { 
        id: 'evt_2', 
        summary: 'Weekly Sprint Alignment', 
        start: new Date(Date.now() + 3 * 24 * 3600000).toISOString(), 
        end: new Date(Date.now() + 3.5 * 24 * 3600000).toISOString(),
        description: 'Reviewing backlog items and task distribution.'
      }
    ];
  }

  async bookEvent({ summary, description, startTime }) {
    const start = new Date(startTime || Date.now()).toISOString();
    const end = new Date(new Date(start).getTime() + 30 * 60 * 1000).toISOString();
    return {
      id: `evt_${Date.now()}`,
      summary: summary || 'Lumina Ad-Hoc Sync',
      description: description || 'Scheduled via Lumina AI Assistant.',
      start,
      end
    };
  }

  async deleteEvent(id) {
    return true;
  }
}

module.exports = new CalendarService();
