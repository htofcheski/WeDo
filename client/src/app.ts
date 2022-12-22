import { LitElement, html, customElement, property, TemplateResult, css } from 'lit-element';
import { database } from './database';
import { Team } from './types';

import '@polymer/iron-pages/iron-pages';
import '@polymer/paper-spinner/paper-spinner';

import '@vaadin/vaadin-combo-box';

import { all } from './styles/styles';
import './components/right-panel';
import './components/top-header';
import './components/left-panel';
import './components/task-list';

type Pages = 'one' | 'two' | 'three';

declare global {
  interface Window {
    State: any;
  }
}

@customElement('wedo-app')
export class WeDo extends LitElement {
  @property({ attribute: false, type: String })
  selected_team_uuid: string = '';

  @property({ attribute: false })
  available_teams: Team[] = window.State.Data.teams;

  @property({ attribute: false, type: Boolean })
  loading: boolean = true;

  static styles = all.concat(css`
    .wedo-page,
    iron-pages {
      width: 100%;
      height: 100%;
    }
    .center-div {
      position: fixed;
      top: 50%;
      left: 50%;
      -webkit-transform: translate(-50%, -50%);
      transform: translate(-50%, -50%);
    }
    paper-spinner.loading {
      --paper-spinner-layer-1-color: var(--theme-primary);
      --paper-spinner-layer-2-color: var(--paper-cyan-500);
      --paper-spinner-layer-3-color: var(--theme-primary);
      --paper-spinner-layer-4-color: var(--paper-cyan-500);
      --paper-spinner-stroke-width: 5px;
      width: 10rem;
      height: 10rem;
    }
    .team-selector {
      width: 20rem;
    }
  `);

  @property()
  page: Pages = 'one';

  @property()
  name = 'Hristijan Tofcheski';

  render() {
    return this.loading
      ? html`<div class="center-div"><paper-spinner class="loading" active></paper-spinner></div>`
      : this.selected_team_uuid.length > 0
      ? html`
          <div class="layout horizontal" style="height: 100%;">
            <left-panel></left-panel>
            <div class="layout vertical" style="width: 100%;">
              <top-header></top-header>
              <div class="layout horizontal" style="width: 100%; height: 90%">
                <div
                  class="layout horizontal"
                  style="width: 75%;outline: 0.2rem solid #f2f3f5; z-index: 999; background: white;"
                >
                  <iron-pages selected=${this.page} attr-for-selected="page">
                    <div class="wedo-page" page="one"><task-list></task-list></div>
                    <div class="wedo-page" page="two"></div>
                    <div class="wedo-page" page="three"></div>
                  </iron-pages>
                </div>
                <div class="layout horizontal" style="width: 25%;"><right-panel></right-panel></div>
              </div>
            </div>
          </div>
        `
      : html` ${this.available_teams.length > 0
          ? html` <div class="center-div">
              <vaadin-combo-box
                class="team-selector"
                placeholder="Select team"
                .items=${this.available_teams.map((team) => {
                  return { label: team.name, value: team.uuid };
                })}
                @selected-item-changed=${(e) => {
                  if (e?.detail?.value?.value) {
                    this.selected_team_uuid = e.detail.value.value;
                    database.setSelectedTeam(this.selected_team_uuid);
                  }
                }}
              ></vaadin-combo-box>
            </div>`
          : html` <div class="center-div">You don't belong to any team.</div>`}`;
  }

  protected firstUpdated() {
    this.selectedTeam();
  }

  selectedTeam() {
    database
      .getSelectedTeam()
      .then((team_uuid) => {
        let team_found: boolean = false;
        for (let i = 0; i < this.available_teams.length; i++) {
          if (this.available_teams[i].uuid === team_uuid) {
            team_found = true;
            break;
          }
        }
        if (!team_found) {
          database.removeSelectedTeam();
          this.loading = false;
          return;
        }
        this.selected_team_uuid = team_uuid;
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
      });
  }
}
