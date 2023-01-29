import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';

import { LoggedInUser, OrgUser, Pages, TeamUser } from '../types';

import { all } from '../styles/styles';
import { ui_helpers } from '../helpers';

import '@polymer/iron-image';
import '@polymer/paper-icon-button/paper-icon-button';

import '@dreamworld/dw-tooltip/dw-tooltip';

@customElement('top-header')
export class TopHeader extends LitElement {
  @property()
  page: Pages = 'projects';

  @property({ attribute: false })
  logged_in_user: LoggedInUser = undefined;

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
        ${this.page === 'projects' ? 'Projects' : 'Statistics'}<paper-icon-button
          icon=${this.page === 'projects' ? 'add-circle' : 'refresh'}
          style="color: var(--theme-primary);"
          @click=${() => {
            if (this.page === 'projects') {
              this.dispatchEvent(new CustomEvent('createProject', {}));
            } else {
              this.dispatchEvent(new CustomEvent('refreshStatistics', {}));
            }
          }}
        ></paper-icon-button>
      </div>
      <div class="flex"></div>
      <div id="logged-in-user" class="layout horizontal center-center">
        ${ui_helpers.renderUser(
          {
            uuid: this.logged_in_user?.uuid,
            username: this.logged_in_user?.username,
            email: this.logged_in_user?.email,
            description: this.logged_in_user?.description,
            profile_picture: this.logged_in_user?.profile_picture,
            created: this.logged_in_user?.created,
            updated: this.logged_in_user?.updated,
          } as OrgUser,
          { uuid: this.logged_in_user?.team_user_uuid, created: '', updated: '' } as TeamUser,
          false
        )}
      </div>
      ${this.logged_in_user?.email
        ? html`
            <dw-tooltip
              placement="bottom"
              offset="[-50, 0]"
              for="logged-in-user"
              .content=${this.logged_in_user?.email}
            ></dw-tooltip>
          `
        : html``}
    </div>`;
  }
}
