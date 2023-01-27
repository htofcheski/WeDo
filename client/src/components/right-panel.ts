import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';

import { all } from '../styles/styles';
import { OrgUser, TeamTask, TeamUser } from '../types';

import { ui_helpers } from '../helpers';

import moment = require('moment');

@customElement('right-panel')
export class RightPanel extends LitElement {
  @property({ attribute: false })
  team_users: TeamUser[] = [];

  @property({ attribute: false })
  team_to_org_user_map: Map<string, OrgUser> = new Map();

  @property({ attribute: false })
  team_tasks: TeamTask[] = [];

  @property({ attribute: false })
  projects_calendar_moment: moment.Moment = moment();

  static styles = all.concat(css`
    :host {
      display: flex;
      height: 100%;
      min-height: 100%;
      max-height: 100%;
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: white;
      outline: 0.2rem solid #f2f3f5;
      z-index: 999;
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
      font-weight: 500;
    }
    .calendar-item {
      min-width: 1.5rem;
      width: 1.5rem;
      max-width: 1.5rem;
    }
    .user-icons {
      justify-content: center;
      margin: 0.94rem 0;
      min-height: 2.55rem;
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
      margin: 0.3rem 1rem 0.7rem 0;
      padding: 0.35rem 0.7rem;
      text-align: center;
    }
    .recent-task:hover {
      background-color: lightgray;
    }
    .recent-task-container {
      word-break: break-all;
    }
    .scroll-tasks {
      overflow-y: scroll;
      height: 100%;
    }
    .state {
      width: 0.7rem;
      height: 0.7rem;
      border-radius: 50%;
      align-self: center;
    }
    .state[state='0'] {
      background: var(--theme-open) !important;
    }
    .state[state='1'] {
      background: var(--theme-active) !important;
    }
    .state[state='2'] {
      background: var(--theme-done) !important;
    }
    .recent-tasks-empty {
      width: 70%;
      height: 70%;
      opacity: 0.1;
      place-self: center;
      margin-top: 2rem;
    }
  `);

  render() {
    return html`
      <div class="layout vertical main-container">
        <div class="layout vertical">
          <div class="layout horizontal justified push-down">
            <span class="section-title"
              >Team <span style="color: var(--theme-primary);">(${this.team_users?.length || 0})</span></span
            ><span class="flex"></span
            ><span
              class="span-to-button unselectable"
              style="font-size: 0.75rem;"
              @click=${() => {
                this.dispatchEvent(new CustomEvent('viewTeam', {}));
              }}
              >View all</span
            >
          </div>
          <div class="layout horizontal user-icons">
            ${this.team_users
              ?.sort(ui_helpers.sortUsers)
              ?.slice(0, 5)
              ?.map((team_user) => {
                return ui_helpers.renderUser(this.team_to_org_user_map.get(team_user.uuid), team_user, true);
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
        <div class="layout vertical push-down scroll-tasks">
          <div class="layout vertical justified">${this.renderRecentTasks()}</div>
        </div>
      </div>
    `;
  }

  renderDates(): TemplateResult {
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
    let moment_now_utc = moment().subtract(1, 'day').utc();

    this.team_tasks
      ?.filter((team_task) => moment.utc(team_task?.updated).isAfter(moment_now_utc))
      .sort(ui_helpers.sortTeamTask)
      .slice(0, 50)
      .forEach((team_task) => {
        recent_task_arr.push(
          html`
            <div class="layout horizontal justified recent-task-container">
              <button
                class="recent-task"
                @click=${() => {
                  this.dispatchEvent(new CustomEvent('updateTask', { detail: { task_uuid: team_task?.uuid } }));
                }}
              >
                <div class="layout horizontal">
                  <div class="layout vertical justified state" state=${team_task?.state}></div>
                  <div class="flex"></div>
                  <div>${moment.utc(team_task?.updated).local().format('DD.MM.YYYY HH:mm:ss')}</div>
                </div>
                <div class="layout horizontal justified">${team_task?.name}</div>
              </button>
            </div>
          `
        );
      });

    if (recent_task_arr.length > 0) {
      return html`${recent_task_arr.map((recent_task) => {
        return recent_task;
      })}`;
    } else {
      return html`<iron-icon class="recent-tasks-empty" icon="alarm-on"></iron-icon>`;
    }
  }
}
