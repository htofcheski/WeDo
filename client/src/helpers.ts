import { PaperToastElement } from '@polymer/paper-toast';
import { html, TemplateResult } from 'lit-element';
import randomColor = require('randomcolor');
import { OrgUser, TeamProject, TeamTask, TeamUser } from './types';

import moment = require('moment');

import '@dreamworld/dw-tooltip/dw-tooltip';

export const ui_helpers = {
  renderUser(
    org_user: OrgUser,
    team_user: TeamUser,
    icon_only: boolean,
    overlap_icons?: boolean,
    mvp?: boolean
  ): TemplateResult {
    if (!org_user || !team_user) {
      return html``;
    }
    if (!org_user.username && !org_user.email) {
      return html``;
    }

    if (mvp) {
      icon_only = true;
      overlap_icons = false;
    }

    let initials = org_user.username
      .match(/\b(\w)/g)
      .join('')
      .substring(0, 2);

    let seed = team_user.uuid ? team_user.uuid : org_user.email ? org_user.email : org_user.uuid;
    let margin = icon_only ? (overlap_icons ? '-1.1rem' : '0.3rem') : '0.75rem';
    let margin_hover = overlap_icons ? '-1rem' : '0';
    let circle_size = mvp ? '10rem' : '2.5rem';
    let font_size = mvp ? '3rem' : '0.75rem';

    return html`
      <style>
        #${'user-id-' + seed}[initials]:before {
          content: attr(initials);
          display: inline-block;
          font-size: ${font_size};
          width: ${circle_size};
          height: ${circle_size};
          line-height: ${circle_size};
          text-align: center;
          border-radius: 50%;
          background: ${this.color(seed)};
          vertical-align: middle;
          margin-right: ${margin};
          color: white;
        }
        #${'user-picture-id-' + seed} {
          transition: 0.3s;
        }
        #${'user-id-' + seed}[initials]:hover,
        #${'user-picture-id-' + seed}:hover {
          margin-top: ${margin_hover};
        }
        [initials] {
          filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
          transition: 0.3s;
          margin: 0;
          padding: 0;
        }
        .user_name {
          font-weight: 500;
          font-size: 1.1rem;
        }
        .user_name_mvp {
          font-size: 2rem;
          font-weight: 500;
          margin-top: 1.5rem;
        }
      </style>
      <div class="user layout ${mvp ? 'vertical' : 'horizontal'} center">
        ${org_user.profile_picture
          ? html`<iron-image
                id=${'user-picture-id-' + seed}
                class="user_picture"
                sizing="cover"
                src=${org_user.profile_picture}
                aria-hidden="true"
                style="min-height: 2.5rem; min-width: 2.5rem; margin-right: ${margin}; border-radius: 50%;"
              ></iron-image>
              ${overlap_icons && org_user?.username
                ? html`
                    <dw-tooltip
                      placement="top"
                      offset="[25, 10]"
                      for=${'user-picture-id-' + seed}
                      .content=${org_user.username}
                    ></dw-tooltip>
                  `
                : html``}`
          : html`<p id=${'user-id-' + seed} initials=${initials} aria-hidden="true"></p>
              ${overlap_icons && org_user?.username
                ? html`
                    <dw-tooltip
                      placement="top"
                      offset="[50, 10]"
                      for=${'user-id-' + seed}
                      .content=${org_user.username}
                    ></dw-tooltip>
                  `
                : html``}`}
        ${!icon_only ? html` <div class="user_name">${org_user.username || org_user.email}</div>` : html``}
        ${mvp ? html` <div class="user_name_mvp">Team MVP: ${org_user.username || org_user.email}</div>` : html``}
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

  sortTeamTask(a: TeamTask, b: TeamTask): number {
    let a_comp = a.updated || a.created;
    let b_comp = b.updated || b.created;
    if (!a_comp || !b_comp) {
      return 0;
    }

    if (moment.utc(a_comp).isAfter(moment.utc(b_comp))) {
      return -1;
    }
    if (moment.utc(a_comp).isBefore(moment.utc(b_comp))) {
      return 1;
    }
    return 0;
  },

  sortTeamProject(a: TeamProject, b: TeamProject): number {
    let a_comp = a.updated || a.created;
    let b_comp = b.updated || b.created;
    if (!a_comp || !b_comp) {
      return 0;
    }

    if (moment.utc(a_comp).isAfter(moment.utc(b_comp))) {
      return -1;
    }
    if (moment.utc(a_comp).isBefore(moment.utc(b_comp))) {
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
