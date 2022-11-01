import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';

import { all } from '../styles/styles';
import randomColor = require('randomcolor');

import '@polymer/iron-image';

import moment = require('moment');

export interface CHK_TEAM_USER {
  uuid?: string;
  name?: string;
  picture?: string;
  email?: string;
}

@customElement('right-panel')
export class RightPanel extends LitElement {
  @property({ attribute: false })
  team: CHK_TEAM_USER[] = [
    {
      uuid: '82',
      name: 'Peyton Prescott',
      picture: 'https://randomuser.me/api/portraits/women/82.jpg',
      email: 'peyton.prescott@example.com',
    },
    {
      uuid: '2',
      name: 'HipBob',
      picture: 'https://i.pinimg.com/originals/a3/63/ab/a363abfb9c0ca6380275db29f70443eb.jpg',
      email: 'test2@test2.com',
    },
    {
      uuid: '3',
      name: 'John',
      email: 'test3@test3.com',
    },
    {
      uuid: '4',
      name: 'JUus',
      email: 'test@test.com',
    },
    {
      uuid: '5',
      name: 'Dzoni',
      email: 'test2@test2.com',
    },
    {
      uuid: '6',
      name: 'Johnefer',
      email: 'test3@test3.com',
    },
  ];

  @property({ attribute: false })
  projects_calendar_moment: moment.Moment = moment();

  @property({ attribute: false })
  tasks: any[] = [
    {
      uuid: '000999',
      name: 'Ova e primer task sto e epten dolg u slucaj da otide na nova linija. Ajde uste malu da otide pak u nova linija',
      updated: '1666887627',
    },
    { uuid: '321998', name: 'test21123', updated: '1666887627' },
    { uuid: '654997', name: 'test 3', updated: '1666887627' },
    { uuid: '987996', name: 'test 4', updated: '1666887627' },
    { uuid: '789995', name: 'test 5', updated: '1666887627' },
    { uuid: '456994', name: 'test 6', updated: '1666887627' },
    { uuid: '123993', name: 'test 73', updated: '1666887627' },
    { uuid: '111111', name: 'test 711', updated: '1666887627' },
    { uuid: '333333', name: 'test 72', updated: '1666887627' },
    { uuid: '555555', name: 'test 32', updated: '1666887627' },
  ];

  static styles = all.concat(css`
    :host {
      display: flex;
      width: 20%;
      max-width: 20%;
      min-width: 20%;
      height: 100%;
      min-height: 100%;
      max-height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: white;
      border-left: 0.1rem solid #f2f3f5;
    }
    .main-container {
      margin: 0 1.5rem;
      width: 100%;
    }
    .push-down {
      margin-top: 1rem;
    }
    .push-down-half {
      margin-top: 0.5rem;
    }
    .section-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }
    .section-sub-title {
      font-size: 1.1rem;
      color: #555;
    }
    .span-to-button {
      color: var(--theme-primary);
      align-self: center;
      font-weight: 600;
      cursor: pointer;
    }
    .span-to-button[disabled] {
      color: #777 !important;
      cursor: not-allowed;
    }
    .week-year[current],
    .week-day[current] {
      color: var(--theme-primary) !important;
    }
    .calendar-item {
      min-width: 1.5rem;
      width: 1.5rem;
      max-width: 1.5rem;
    }
    .user-icons {
      justify-content: center;
      margin: 0.7rem 0;
    }
    .dir-buttons {
      background-color: rgba(51, 51, 51, 0.05);
      border-radius: 50%;
      border-width: 0;
      color: #333333;
      cursor: pointer;
      font-weight: 600;
      line-height: 20px;
      list-style: none;
      margin: 0;
      padding: 0.35rem 0.7rem;
      text-align: center;
    }
    .dir-buttons:hover {
      color: var(--theme-primary) !important;
    }
    .recent-task {
      background-color: rgba(51, 51, 51, 0.05);
      border-radius: 5%;
      box-sizing: unset;
      width: 100%;
      border-width: 0;
      color: #333333;
      cursor: pointer;
      font-weight: 500;
      line-height: 20px;
      list-style: none;
      margin: 1rem 1rem 0 0;
      padding: 0.35rem 0.7rem;
      text-align: center;
    }
    .recent-task:hover {
      background-color: lightgray;
    }
  `);

  render() {
    return html`
      <div class="layout vertical main-container">
        <div class="layout vertical">
          <div class="layout horizontal justified push-down">
            <span class="section-title"
              >Team <span style="color: var(--theme-primary);">(${this.team.length})</span></span
            ><span class="flex"></span
            ><span
              class="span-to-button unselectable"
              style="font-size: 0.75rem;"
              @click=${() => {
                //@todo CHK
                console.log('opening');
              }}
              >View all</span
            >
          </div>
          <div class="layout horizontal user-icons">
            ${this.team
              .sort(this.sortUsers)
              .slice(0, 5)
              .map((user) => {
                return this.renderUser(user, true);
              })}
          </div>
        </div>
        <hr class="hr-style" />
        <div class="layout vertical">
          <div class="layout horizontal justified">
            <span class="section-title">Calendar</span><span class="flex"></span>
            <span
              ?disabled=${this.projects_calendar_moment.isSame(moment(), 'week')}
              class="span-to-button unselectable"
              style="font-size: 0.75rem;"
              @click=${() => {
                this.projects_calendar_moment = moment();
                this.requestUpdate();
              }}
              >This week</span
            >
          </div>
          <div class="layout horizontal justified section-sub-title push-down-half">
            <span
              class="week-year"
              ?current=${this.projects_calendar_moment.isSame(moment(), 'week') &&
              this.projects_calendar_moment.isSame(moment(), 'year')}
              >Week ${this.projects_calendar_moment.week()}, ${this.projects_calendar_moment.format('YYYY')}</span
            ><span class="flex"></span>
            <button
              class="dir-buttons unselectable"
              @click=${() => {
                this.projects_calendar_moment = this.projects_calendar_moment.startOf('week').subtract(7, 'days');
                this.requestUpdate();
              }}
            >
              <
            </button>
            <button
              class="dir-buttons unselectable"
              style="margin-left: 0.7rem;"
              @click=${() => {
                this.projects_calendar_moment = this.projects_calendar_moment.startOf('week').add(7, 'days');
                this.requestUpdate();
              }}
            >
              >
            </button>
          </div>
          <div class="layout horizontal justified push-down">${this.renderDates()}</div>
        </div>
        <hr class="hr-style" />
        <div class="layout horizontal justified">
          <span class="section-title">Recent Task Updates</span>
        </div>
        <div class="layout vertical scroll-style push-down" style="overflow-y: scroll; height: 100%;">
          <div class="layout vertical justified">${this.renderRecentTasks()}</div>
        </div>
      </div>
    `;
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

  sortUsers(a: CHK_TEAM_USER, b: CHK_TEAM_USER): number {
    let a_comp = a.name || a.email;
    let b_comp = b.name || b.email;
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
  }

  color(seed: number | string): string {
    return randomColor({
      seed: seed,
      luminosity: 'dark',
    });
  }

  renderDates(): TemplateResult {
    //@todo CHK
    let day_column_arr: TemplateResult[] = [];
    let projects_calendar_moment_cloned = this.projects_calendar_moment.clone();

    for (let i = 0; i < 7; i++) {
      projects_calendar_moment_cloned = projects_calendar_moment_cloned.startOf('week').add(i, 'days');

      day_column_arr.push(
        html`<div class="layout vertical justified">
          <div
            ?current=${projects_calendar_moment_cloned.isSame(moment(), 'date')}
            class="layout horizontal center-center week-day calendar-item"
            style="color: #555;"
          >
            ${projects_calendar_moment_cloned.format('ddd')}
          </div>
          <div class="layout horizontal center-center calendar-item push-down">
            ${projects_calendar_moment_cloned.format('D')}
          </div>
          <div class="layout horizontal center-center calendar-item" style="margin-top: -0.2rem;">
            ${projects_calendar_moment_cloned.format('MMM')}
          </div>
        </div>`
      );
    }

    return html`${day_column_arr.map((day_column) => {
      return day_column;
    })}`;
  }

  renderRecentTasks(): TemplateResult {
    let recent_task_arr: TemplateResult[] = [];

    //@todo CHK

    this.tasks.forEach((task) => {
      recent_task_arr.push(
        html`
          <div class="layout horizontal justified">
            <button class="recent-task">
              <div class="layout horizontal">
                <div
                  class="layout vertical justified"
                  style="background: ${this.color(task.uuid)}; width: 4%; height: 0.5rem; border-radius: 50%;"
                ></div>
                <div
                  class="layout vertical justified"
                  style="background: green; width: 4%; height: 0.5rem; border-radius: 50%;"
                ></div>
                <div class="flex"></div>
                <div>${moment.utc(task.updated * 1000).format('DD.MM.YYYY HH:mm:ss')}</div>
              </div>
              <div class="layout horizontal justified">${task.name}</div>
            </button>
          </div>
        `
      );
    });

    return html`${recent_task_arr.map((recent_task) => {
      return recent_task;
    })}`;
  }
}
