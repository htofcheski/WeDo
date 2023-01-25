import { PaperToastElement } from '@polymer/paper-toast';
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
    let margin = icon_only ? (overlap_icons ? '-1.1rem' : '0.3rem') : '0.75rem';
    let margin_hover = overlap_icons ? '-1rem' : '0';

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
        #${'user-id-' + seed}[initials]:hover {
          margin-top: ${margin_hover};
        }
        [initials] {
          filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
          transition: 0.3s;
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

  show_toast(type: 'success' | 'error' | 'info', message: string, persistent?: boolean) {
    const main_app: HTMLElement = document.getElementById('main-app');
    if (main_app) {
      let background_color = '';

      switch (type) {
        case 'error':
          background_color = getComputedStyle(main_app).getPropertyValue('--theme-error');
          break;
        case 'success':
          background_color = getComputedStyle(main_app).getPropertyValue('--theme-primary');
          break;
        default:
          background_color = getComputedStyle(main_app).getPropertyValue('--theme-secondary');
          break;
      }
      main_app.style.setProperty('--paper-toast-background-color', background_color);

      const toast = main_app.shadowRoot.querySelector<PaperToastElement>('#toast');
      if (toast) {
        if (persistent) {
          toast.setAttribute('duration', '0');
          toast.querySelector('vaadin-button').removeAttribute('hidden');
        } else {
          toast.close();
          toast.setAttribute('duration', '5000');
          toast.querySelector('vaadin-button').setAttribute('hidden', '');
        }

        toast.show({ text: message });
      }
    }
  },
  add3Dots(string: string, limit: number): string {
    var dots = '...';
    if (string.length > limit) {
      string = string.substring(0, limit) + dots;
    }

    return string;
  },
};
