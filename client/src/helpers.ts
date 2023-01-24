import { html, TemplateResult } from 'lit-element';
import randomColor = require('randomcolor');
import { OrgUser, TeamUser } from './types';

export const ui_helpers = {
  renderUser(org_user: OrgUser, team_user: TeamUser, icon_only: boolean, overlap_icons?: boolean): TemplateResult {
    if (!org_user || !team_user) {
      return html``;
    }
    if (!org_user.username && !org_user.email) {
      return html``;
    }

    let initials = org_user.username
      .match(/\b(\w)/g)
      .join('')
      .substring(0, 2);

    let seed = team_user.uuid ? team_user.uuid : org_user.email ? org_user.email : org_user.uuid;
    let margin = icon_only ? (overlap_icons ? '-1.5rem' : '0.3rem') : '0.75rem';

    return html`
      <style>
        #${'user-id-' + seed}[initials]:before {
          box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
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
        ${org_user.profile_picture
          ? html`<iron-image
              class="user_picture"
              sizing="cover"
              src=${org_user.profile_picture}
              aria-hidden="true"
              style="min-height: 2.5rem; min-width: 2.5rem; margin-right: ${margin}; border-radius: 50%;"
            ></iron-image>`
          : html`<p id=${'user-id-' + seed} initials=${initials} aria-hidden="true"></p>`}
        ${!icon_only ? html` <div class="user_name">${org_user.username || org_user.email}</div>` : html``}
      </div>
    `;
  },

  sortUsers(a: OrgUser, b: OrgUser): number {
    let a_comp = a.username || a.email;
    let b_comp = b.username || b.email;
    if (!a_comp || !b_comp) {
      return 0;
    }

    if (a_comp < b_comp) {
      return -1;
    }
    if (a_comp > b_comp) {
      return 1;
    }
    return 0;
  },

  color(seed: number | string): string {
    return randomColor({
      seed: seed,
      luminosity: 'dark',
    });
  },
};
