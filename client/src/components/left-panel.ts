import { LitElement, html, customElement, css, property } from 'lit-element';
import { database } from '../database';
import { all } from '../styles/styles';

import '@polymer/iron-image/iron-image';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-icons/maps-icons';
import '@polymer/iron-icons/social-icons';
import '@polymer/paper-icon-button/paper-icon-button';

import '@dreamworld/dw-tooltip/dw-tooltip';

import { api } from '../api';
import { Pages, Team } from '../types';
import { ui_helpers } from '../helpers';

@customElement('left-panel')
export class LeftPanel extends LitElement {
  @property()
  page: Pages = 'projects';

  @property({ attribute: false })
  available_teams: Team[] = window.State.Data.teams || [];

  @property({ attribute: false, type: String })
  selected_team_uuid: string = '';

  static styles = all.concat(css`
    :host {
      display: flex;
      width: 8%;
      max-width: 8%;
      min-width: 8%;
      height: 100%;
      min-height: 100%;
      max-height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #f2f3f5;
    }
    .main-container {
      width: 100%;
      max-width: 100%;
      min-width: 100%;
    }
    .team-name {
      font-weight: 600;
    }
    .left-panel-button {
      color: var(--theme-secondary);
      opacity: 0.5;
      transition: 0.3s;
      width: 3rem;
      height: 3rem;
    }
    .left-panel-button:hover {
      color: black;
      opacity: 1;
      width: 3.03rem;
      height: 3.03rem;
    }
    .button-container[active] > paper-icon-button {
      color: var(--theme-primary) !important;
      opacity: 1;
    }
  `);

  render() {
    let team_name =
      this.selected_team_uuid?.length > 0
        ? this.available_teams?.find((team) => team.uuid === this.selected_team_uuid)?.name
        : '';

    return html`<div class="layout vertical main-container">
      <div class="flex" style="flex: 0.10;"></div>
      <div class="layout vertical center-center">
        <iron-icon src="/assets/src/img/logo.png" style="width: 3rem; height: 3rem;"></iron-icon>
      </div>
      ${team_name.length > 0
        ? html`<div class="layout vertical center-center team-name unselectable">
            ${ui_helpers.add3Dots(team_name, 12)}
          </div>`
        : html``}
      <div class="flex"></div>
      <div class="layout vertical center-center button-container" ?active=${this.page === 'projects'}>
        <paper-icon-button
          id="projects-page"
          icon="folder"
          class="left-panel-button"
          @click=${() => {
            this.dispatchEvent(
              new CustomEvent('changePage', {
                detail: { page: 'projects' },
              })
            );
          }}
        ></paper-icon-button>
        <dw-tooltip placement="right" offset="[0, 0]" for="projects-page" .content=${'Projects'}></dw-tooltip>
      </div>
      <div class="flex" style="flex: 0.10;"></div>
      <div class="layout vertical center-center button-container" ?active=${this.page === 'statistics'}>
        <paper-icon-button
          id="statistics-page"
          icon="trending-up"
          class="left-panel-button"
          @click=${() => {
            this.dispatchEvent(
              new CustomEvent('changePage', {
                detail: { page: 'statistics' },
              })
            );
          }}
        ></paper-icon-button>
        <dw-tooltip placement="right" offset="[0, 0]" for="statistics-page" .content=${'Statistics'}></dw-tooltip>
      </div>
      <div class="flex"></div>
      <div class="layout vertical center-center">
        <paper-icon-button
          id="switch-team"
          icon="social:group"
          class="left-panel-button"
          @click=${() => {
            database.removeSelectedTeam();
            location.reload();
          }}
        ></paper-icon-button>
        <dw-tooltip placement="right" offset="[0, 0]" for="switch-team" .content=${'Switch team'}></dw-tooltip>
      </div>
      <div class="flex" style="flex: 0.015;"></div>
      <div class="layout vertical center-center">
        <paper-icon-button
          id="sign-out"
          icon="maps:directions-walk"
          class="left-panel-button"
          @click=${() => {
            api.logout().then(() => {
              database.removeSelectedTeam();
              location.reload();
            });
          }}
        ></paper-icon-button>
        <dw-tooltip placement="right" offset="[0, 0]" for="sign-out" .content=${'Sign out'}></dw-tooltip>
      </div>
      <div class="flex" style="flex: 0.10;"></div>
    </div>`;
  }
}
