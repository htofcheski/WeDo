import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';
import { ui_helpers } from '../helpers';
import { all } from '../styles/styles';
import { OrgUser, TeamStatistics, TeamUser } from '../types';

import '@vaadin/vaadin-combo-box/vaadin-combo-box';

@customElement('team-statistics')
export class TeamStatisticsElement extends LitElement {
  @property({ attribute: false })
  team_statistics: TeamStatistics = undefined;

  @property({ attribute: false })
  team_users: TeamUser[] = [];

  @property({ attribute: false })
  team_to_org_user_map: Map<string, OrgUser> = new Map();

  @property({ attribute: false, type: String })
  selected_team_user_uuid: string = '';

  static styles = all.concat(css`
    :host {
      display: flex;
      width: 100%;
      max-width: 100%;
      min-width: 100%;
      height: 100%;
      min-height: 100%;
      max-height: 100%;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      background: white;
    }
    .main {
      width: 100%;
      margin: 0 2rem;
    }
    .header {
      font-size: 1.1rem;
      font-weight: 500;
      color: rgb(51, 51, 51);
      margin: 1.5rem 0.2rem;
      min-width: 15rem;
      text-align: center;
    }
    .header-title {
      font-size: 1.2rem;
      font-weight: 600;
      text-align: left;
    }
    .header-title[completed] {
      color: var(--theme-done);
      text-decoration: line-through 1px black;
    }
    .header-title-center {
      font-size: 1.2rem;
      font-weight: 600;
      text-align: center;
    }
    .team-user-selector {
      min-width: 20rem;
    }
    .same > iron-icon {
      color: var(--theme-active);
    }
    .increase > iron-icon {
      color: var(--theme-done);
    }
    .decrease > iron-icon {
      color: var(--theme-error);
    }
  `);

  render() {
    if (!this.team_statistics) {
      return html``;
    }

    let yearly_completed_tasks = this.team_statistics?.year_task_count?.completed ?? 0;
    let yearly_left_tasks = this.team_statistics?.year_task_count?.left ?? 0;

    let yearly_mvp_org_user = this.team_to_org_user_map.get(this.team_statistics?.year_team_user_mvp ?? '');
    let yearly_mvp_team_user = this.team_users.find(
      (team_user) => team_user.uuid === this.team_statistics?.year_team_user_mvp
    );

    let goal_task_count_arr = Array.from(this.team_statistics?.goal_task_count);

    let period_month_selected_team_user: number =
      this.selected_team_user_uuid?.length > 0
        ? this.team_statistics?.period?.get('month').team_user_completed_tasks_count?.get(this.selected_team_user_uuid)
        : 0;
    let period_week_selected_team_user: number =
      this.selected_team_user_uuid?.length > 0
        ? this.team_statistics?.period?.get('week').team_user_completed_tasks_count?.get(this.selected_team_user_uuid)
        : 0;
    let period_day_selected_team_user: number =
      this.selected_team_user_uuid?.length > 0
        ? this.team_statistics?.period?.get('day').team_user_completed_tasks_count?.get(this.selected_team_user_uuid)
        : 0;
    let period_prev_day_selected_team_user: number =
      this.selected_team_user_uuid?.length > 0
        ? this.team_statistics?.period
            ?.get('previous_day')
            .team_user_completed_tasks_count?.get(this.selected_team_user_uuid)
        : 0;
    let period_prev_week_selected_team_user: number =
      this.selected_team_user_uuid?.length > 0
        ? this.team_statistics?.period
            ?.get('previous_week')
            .team_user_completed_tasks_count?.get(this.selected_team_user_uuid)
        : 0;
    let period_prev_month_selected_team_user: number =
      this.selected_team_user_uuid?.length > 0
        ? this.team_statistics?.period
            ?.get('previous_month')
            .team_user_completed_tasks_count?.get(this.selected_team_user_uuid)
        : 0;

    return html`
      <div class="layout vertical main">
        <div class="layout horizontal justified">
          <span class="header header-title">Yearly</span>
          <span class="flex"></span>
          <span class="header">All team tasks: ${yearly_completed_tasks + yearly_left_tasks}</span>
          <span class="flex"></span>
          <span class="header">Completed: ${yearly_completed_tasks}</span>
          <span class="header">Left: ${yearly_left_tasks}</span>
        </div>
        <hr
          style="margin-top: 0; margin-bottom: ${yearly_mvp_org_user && yearly_mvp_team_user ? '1rem;' : '0;'}"
          class="hr-style"
        />
        <div class="layout horizontal justified">
          <div class="flex"></div>
          <div>
            ${yearly_mvp_org_user && yearly_mvp_team_user
              ? ui_helpers.renderUser(yearly_mvp_org_user, yearly_mvp_team_user, false, false, true)
              : html``}
          </div>
          <div class="flex"></div>
        </div>
        ${yearly_mvp_org_user && yearly_mvp_team_user
          ? html`<hr style="margin-top: 1rem; margin-bottom: 0;" class="hr-style" />`
          : html``}
        <div class="layout horizontal justified">
          <span class="flex"></span>
          <span class="header header-title-center"
            >${Array.isArray(goal_task_count_arr) && goal_task_count_arr?.length > 0 ? 'Goals' : 'No goals'}</span
          >
          <span class="flex"></span>
        </div>
        ${Array.isArray(goal_task_count_arr) && goal_task_count_arr?.length > 0
          ? goal_task_count_arr.map(([goal, task_count]) => {
              return html` <hr style="margin-top: 0; margin-bottom: 0;" class="hr-style" />
                <div class="layout horizontal justified">
                  <span class="header header-title" ?completed=${task_count.left === 0}>${goal}</span>
                  <span class="flex"></span>
                  <span class="header">Completed: ${task_count.completed}</span>
                  <span class="header">Left: ${task_count.left}</span>
                </div>`;
            })
          : html``}
        <hr style="margin-top: 0; margin-bottom: 0;" class="hr-style" />
        <div class="layout horizontal justified">
          <span class="flex"></span>
          <span class="header header-title-center">
            <vaadin-combo-box
              class="team-user-selector"
              theme="purple"
              clear-button-visible
              placeholder="Select team user"
              .items=${this.team_users.map((team_user) => {
                return { label: this.team_to_org_user_map.get(team_user?.uuid).username, value: team_user.uuid };
              })}
              @selected-item-changed=${(e) => {
                if (e?.detail?.value?.value) {
                  this.selected_team_user_uuid = e.detail.value.value;
                } else {
                  this.selected_team_user_uuid = '';
                }
              }}
            ></vaadin-combo-box
          ></span>
          <span class="flex"></span>
        </div>
        ${this.selected_team_user_uuid?.length > 0
          ? html`<hr style="margin-top: 0; margin-bottom: 0;" class="hr-style" />
              <div class="layout horizontal justified">
                <span class="header header-title">Day</span>
                <span class="flex"></span>
                <span class="header">Completed: ${period_day_selected_team_user || 0}</span>
                <span class="header"
                  >From Previous:
                  ${this.calculatePercentageIncreaseOrDecrease(
                    period_prev_day_selected_team_user || 0,
                    period_day_selected_team_user || 0
                  )}</span
                >
              </div>
              <hr style="margin-top: 0; margin-bottom: 0;" class="hr-style" />
              <div class="layout horizontal justified">
                <span class="header header-title">Week</span>
                <span class="flex"></span>
                <span class="header">Completed: ${period_week_selected_team_user || 0}</span>
                <span class="header"
                  >From Previous:
                  ${this.calculatePercentageIncreaseOrDecrease(
                    period_prev_week_selected_team_user || 0,
                    period_week_selected_team_user || 0
                  )}</span
                >
              </div>
              <hr style="margin-top: 0; margin-bottom: 0;" class="hr-style" />
              <div class="layout horizontal justified">
                <span class="header header-title">Month</span>
                <span class="flex"></span>
                <span class="header">Completed: ${period_month_selected_team_user || 0}</span>
                <span class="header"
                  >From Previous:
                  ${this.calculatePercentageIncreaseOrDecrease(
                    period_prev_month_selected_team_user || 0,
                    period_month_selected_team_user || 0
                  )}</span
                >
              </div>`
          : html``}
      </div>
    `;
  }

  private calculatePercentageIncreaseOrDecrease(old_num: number, new_num: number): TemplateResult {
    if (old_num <= 0 || old_num === new_num) {
      return html`<span class="same">0% <iron-icon icon="trending-flat"></iron-icon></span>`;
    }
    if (new_num > old_num) {
      let increase = new_num - old_num;
      let increase_perc = (increase / old_num) * 100;

      return html`<span class="increase">${increase_perc}% <iron-icon icon="trending-up"></iron-icon></span>`;
    } else {
      let decrease = old_num - new_num;
      let decrease_perc = (decrease / old_num) * 100;

      return html`<span class="decrease">${decrease_perc}% <iron-icon icon="trending-down"></iron-icon></span>`;
    }
  }
}
