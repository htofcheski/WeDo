import localforage = require('localforage');
import mitt from 'mitt';

class Database {
  events = mitt();

  private main: LocalForage = localforage.createInstance({
    name: 'we-do',
    storeName: 'main',
    version: 1,
  });

  getSelectedTeam(): Promise<string> {
    return this.main.getItem('selected.team');
  }

  setSelectedTeam(team_uuid: string) {
    this.main.setItem('selected.team', team_uuid);
  }

  removeSelectedTeam() {
    this.main.removeItem('selected.team');
  }
}

export const database = new Database();
