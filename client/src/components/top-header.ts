import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';

import { all } from '../styles/styles';
import randomColor = require('randomcolor');

import '@polymer/iron-image';
import '@polymer/paper-icon-button/paper-icon-button';

import moment = require('moment');

export interface CHK_TEAM_USER {
  uuid?: string;
  name?: string;
  picture?: string;
  email?: string;
}

@customElement('top-header')
export class TopHeader extends LitElement {
  @property({ attribute: false })
  page_name: string = 'My Projects';

  @property({ attribute: false })
  user: CHK_TEAM_USER = { uuid: 'aa', name: 'Hristijan Tofcheski', email: 'diplomska@pls.com' };
  static styles = all.concat(css`
    :host {
      display: flex;
      width: 100%;
      max-width: 100%;
      min-width: 100%;
      height: 10%;
      min-height: 10%;
      max-height: 10%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: white;
      outline: 0.2rem solid #f2f3f5;
      z-index: 999;
    }
    .main-container {
      margin: 0 2.2rem;
      width: 100%;
    }
    .page-name {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }
  `);

  render() {
    return html`<div class="layout horizontal main-container">
      <div class="layout horizontal center-center page-name">
        ${this.page_name}<paper-icon-button
          ?hidden=${this.page_name != 'My Projects'}
          icon="add-circle"
          style="color: var(--theme-primary);"
        ></paper-icon-button>
      </div>
      <div class="flex"></div>
      <div class="layout horizontal center-center">${this.renderUser(this.user, false)}</div>
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
