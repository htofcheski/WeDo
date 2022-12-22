import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';
import { database } from '../database';
import { all } from '../styles/styles';
import randomColor = require('randomcolor');

import '@polymer/iron-image/iron-image';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-icons/maps-icons';

import moment = require('moment');

import { api } from '../api';

export interface CHK_TEAM_USER {
  uuid?: string;
  name?: string;
  picture?: string;
  email?: string;
}

@customElement('left-panel')
export class LeftPanel extends LitElement {
  @property({ attribute: false })
  page_name: string = 'My Projects';

  @property({ attribute: false })
  user: CHK_TEAM_USER = { uuid: 'aa', name: 'Hristijan Tofcheski', email: 'diplomska@pls.com' };
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
    .outside-icons {
    }
  `);

  render() {
    return html`<div class="layout vertical main-container">
      <div class="flex" style="flex: 0.04"></div>
      <div class="layout vertical center-center outside-icons">
        <iron-icon src="/assets/src/img/logo.png" style="width: 3rem; height: 3rem;"></iron-icon>
      </div>
      <div class="flex"></div>
      <div class="layout vertical center-center outside-icons">
        <iron-icon
          icon="delete"
          style="width: 1.5rem;"
          @click=${() => {
            database.removeSelectedTeam();
            location.reload();
          }}
        ></iron-icon>
        <iron-icon
          icon="maps:directions-walk"
          style="width: 1.5rem;"
          @click=${() => {
            api.logout().then(() => {
              database.removeSelectedTeam();
              location.reload();
            });
          }}
        ></iron-icon>
      </div>
      <div class="flex" style="flex: 0.04"></div>
    </div>`;
  }

  renderUser(user: CHK_TEAM_USER, icon_only: boolean): TemplateResult {
    if (!user) {
      return html``;
    }
    if (!user.name || !user.email) {
      return html``;
    }

    let initials = user.name
      .match(/\b(\w)/g)
      .join('')
      .substring(0, 2);

    let seed = user.uuid ? user.uuid : user.email;
    let margin = icon_only ? '0.3rem' : '0.75rem';

    return html`
      <style>
        #${'user-id-' + seed}[initials]:before {
          content: attr(initials);
          display: inline-block;
          font-size: 0.75rem;
          width: 2.5rem;
          height: 2.5rem;
          line-height: 2.5rem;
          text-align: center;
          border-radius: 50%;
          background: ${this.color(seed)};
          vertical-align: middle;
          margin-right: ${margin};
          color: white;
        }
        [initials] {
          margin: 0;
          padding: 0;
        }
      </style>
      <div class="user layout horizontal center">
        ${user.picture
          ? html`<iron-image
              class="user_picture"
              sizing="cover"
              src=${user.picture}
              aria-hidden="true"
              style="min-height: 2.5rem; min-width: 2.5rem; margin-right: ${margin}; border-radius: 50%;"
            ></iron-image>`
          : html`<p id=${'user-id-' + seed} initials=${initials} aria-hidden="true"></p>`}
        ${!icon_only ? html` <div class="user_name">${user.name || user.email}</div>` : html``}
      </div>
    `;
  }
  color(seed: number | string): string {
    return randomColor({
      seed: seed,
      luminosity: 'dark',
    });
  }
}
