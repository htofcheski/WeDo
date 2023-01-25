import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';
import { all } from '../styles/styles';
import { LoggedInUser, OrgUser, TeamProject, TeamTask, TeamUser } from '../types';
import { ui_helpers } from '../helpers';

import moment = require('moment');

import '@polymer/paper-progress/paper-progress';
import '@polymer/paper-tabs/paper-tab';
import '@polymer/paper-tabs/paper-tabs';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-toggle-button/paper-toggle-button';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-icons/image-icons';
import '@polymer/iron-icons/social-icons';

import '@dreamworld/dw-tooltip/dw-tooltip';

@customElement('project-page')
export class LeftPanel extends LitElement {
  @property({ attribute: false })
  page: string = '0';

  @property({ attribute: false })
  page_name: string = 'My Tasks';

  @property({ attribute: false })
  logged_in_user: LoggedInUser = undefined;

  @property({ attribute: false })
  team_users: TeamUser[] = [];

  @property({ attribute: false })
  team_to_org_user_map: Map<string, OrgUser> = new Map();

  @property({ attribute: false })
  team_projects: TeamProject[] = [];

  @property({ attribute: false })
  project_to_tasks_map: Map<string, TeamTask[]> = new Map();

  @property({ attribute: false })
  team_tasks_no_project: TeamTask[] = [];

  @property({ attribute: false })
  hide_team_tasks_no_project: boolean = false;

  @property({ attribute: false })
  project_to_assigned_users_map: Map<string, TeamUser[]> = new Map();

  @property({ attribute: false })
  is_expanded_map: Map<string, boolean> = new Map();

  @property({ attribute: false })
  change_tasks_state_disabled: boolean = false;

  @property({ attribute: false })
  only_me: boolean = false;

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
      background: white;
      width: 100%;
      margin: 0 2rem;
    }
    .header {
      font-size: 1.2rem;
      font-weight: 600;
      color: rgb(51, 51, 51);
      margin: 1.5rem 0.2rem;
    }
    .paper-tabs-container{
      margin-top: 0.6rem;
     }
     .paper-tabs {
       --paper-tabs-selection-bar-color: var(--theme-primary);
       --paper-tab-ink: transparent;
     }
    .project-summary {
      height: 8rem;
      max-height: 8rem;
      min-height: 8rem;
      background: white;
      width: 100%;
      max-width: 100%;
      min-width: 100%;
      border-radius: 0.8rem;
      box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
    }
    .project-summary > div {
      align-self: center;
    }
    .project-container {
      margin-top: 1.5rem;
    }
    .project-container[first] {
      margin-top: 0.5rem;
    }
    .project-container[last] {
      padding-bottom: 1.5rem;
    }
    .expand-icon {
      color: #333;
      width: 4rem; 
      height: 4rem;
    }
    .project-name {
      font-size: 1.1rem;
      font-weight: 500;
    }
    .project-details {
      min-width: 15rem;
      width: 15rem;
      max-width 15rem;
      max-height: 7rem;
      overflow: auto;
    }
    .update-project {
      color: var(--theme-secondary);
      opacity: 0.5;
      margin-left: 1rem;
      transition: 0.3s;
    }
    .update-project:hover {
      color: black;
      opacity: 1;
    }
    .expand-project {
      margin-right: 1rem;
      border-radius: 1rem;
      min-width: 4rem;
      width: 4rem;
      max-width: 4rem;
      min-height: 4rem;
      height: 4rem;
      max-height: 4rem;
      background: #f2f3f5;
      text-align: center;
      cursor: pointer;
    }
    .expanded-part {
      background: white;
      margin-top: 1.5rem;
      box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
      border-radius: 0.8rem;
      overflow-y: scroll;
      max-height: 20rem;
    }
    .expanded-part[no-project]{
      margin-top: 0;
    }
    .overflow-assigned-users {
      margin-left: 1.8rem;
      font-weight: 500;
    }
    .overflow-assigned-users-to-task {
      margin-left: 1rem;
      font-weight: 500;
      margin-right: 2rem;
      min-width: 2rem;
      max-width: 2rem;
    }
    paper-progress.purple {
      --paper-progress-active-color: var(--theme-primary);
      --paper-progress-height: 0.5rem;
      max-width: 8rem;
    }
    .progress {
      font-weight: 500;
      color: #333;
      min-width: 8rem;
      max-width: 8rem;
      width: 8rem;
    }
    .task-item {
      margin: 1.5rem 0 1.5rem 2rem;
      font-weight: 500;
    }
    .no-task-item {
      margin: 2rem 0 1.5rem 2rem;
      font-weight: 400;
      font-size: 1.1rem;
    }
    .state-button{
      margin-right: 1rem;
    }
    .state-button[state="0"] {
      color: gray !important;
      --paper-icon-button-ink-color: gray !important;
    }
    .state-button[state="1"] {
      color: blue !important;
      --paper-icon-button-ink-color: blue !important;
    }
    .state-button[state="2"] {
      color: green !important;
      --paper-icon-button-ink-color: green !important;
    }
    .state-button[disabled] {
      color: var(--theme-secondary) !important;
      opacity: 0.5;
    }
    .add-button {
      height: 100%;
      justify-content: center;
      padding: 0 1.2rem;
      border-radius: 0 0.8rem 0.8rem 0;
      transition: 0.3s;
      cursor: pointer;
    }
    .add-button[hide] {
      visibility: hidden;
    }
    .add-button:hover {
      background: var(--theme-primary);
      box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
      color: white;
    }
    .task-name {
      min-width: 15rem;
      width: 15rem;
      max-width: 15rem;
    }
    .update-task-button {
      margin: 0 1rem;
    }
    .assigned-users-to-task {
      min-width: 7rem;
      width: 7rem;
      max-width: 7rem;
    }
    .only-me{
      --paper-toggle-button-checked-button-color:  var(--theme-primary);
      --paper-toggle-button-checked-ink-color: var(--theme-primary);
      font-weight: 500;
    }
    .mood-icon{
      margin-left: 0.5rem;
      color: var(--theme-primary);
    }
    .tasks-no-project-header {
      margin: 0 1rem;
      align-items: center;
      font-size: 1.1rem;
      font-weight: 500;
    }
  `);

  render() {
    let team_projects_filtered = this.team_projects?.filter((project) => !this.hideProject(project.uuid));
    let team_tasks_no_project_filtered = this.team_tasks_no_project?.filter((task) => {
      if (this.logged_in_user && this.only_me) {
        let assigned_users_to_task = task?.assigned_users_uuids?.length > 0 ? task.assigned_users_uuids.split(',') : [];
        if (!assigned_users_to_task.includes(this.logged_in_user.team_user_uuid)) {
          return false;
        }
      }

      return this.page === '0' ? task?.state < 2 : task?.state === 2;
    });

    return html`
      <div class="layout vertical main">
        <!-- header -->

        <div class="layout horizontal justified">
          <span class="header">${this.page_name}</span>
          <paper-toggle-button
            .checked=${this.only_me}
            @checked-changed=${(e) => {
              let checked = Boolean(e.detail.value);
              if (checked != this.only_me) {
                this.only_me = checked;
              }
            }}
            class="only-me"
            >Only me</paper-toggle-button
          >
        </div>
        <div class="layout horizontal">
          <div class="flex paper-tabs-container">
            <paper-tabs
              class="paper-tabs"
              .selected=${this.page}
              @selected-changed=${(e) => {
                if (this.page !== String(e.detail.value)) {
                  this.page = String(e.detail.value);
                  for (let [project_uuid, expanded] of this.is_expanded_map) {
                    if (expanded) {
                      this.expandProject(project_uuid);
                    }
                  }
                }
                this.page_name = this.page === '0' ? 'My Tasks' : 'My Past Tasks';
              }}
            >
              <paper-tab>Open</paper-tab>
              <paper-tab>Past</paper-tab>
            </paper-tabs>
          </div>
          <div class="flex" style="flex: 3"></div>
        </div>
        <hr style="margin-top: 0;" class="hr-style" />

        <!-- header-end -->
        <!-- projects -->

        ${team_projects_filtered.map((project, index) => {
          let project_tasks = this.getProjectTeamTasks(project.uuid);

          return html`
            <div
              class="layout vertical project-container"
              ?first=${index === 0}
              ?last=${index === team_projects_filtered?.length - 1 && team_tasks_no_project_filtered.length === 0}
            >
              <div class="layout horizontal justified project-summary">
                <div class="flex" style="flex: 0.08;"></div>
                <div
                  class="expand-project unselectable"
                  @click=${() => {
                    this.expandProject(project.uuid);
                  }}
                >
                  <iron-icon
                    class="expand-icon"
                    icon=${this.is_expanded_map.get(project.uuid) ? 'icons:arrow-drop-up' : 'icons:arrow-drop-down'}
                  ></iron-icon>
                </div>
                <div>
                  <div class="layout vertical project-details">
                    <span class="project-name">${project.name}</span><span>${project.description}</span>
                  </div>
                </div>
                <div>
                  <paper-icon-button
                    class="update-project"
                    icon="settings"
                    @click=${() => {
                      this.dispatchEvent(
                        new CustomEvent('updateProject', {
                          detail: { type: 'update-project', project_uuid: project.uuid },
                        })
                      );
                    }}
                  ></paper-icon-button>
                </div>
                <div class="flex"></div>
                <div class="layout horizontal">${this.getAssignedUsersToProject(project.uuid)}</div>
                <div class="overflow-assigned-users">${this.getOverflowAssignedUsersCount(project.uuid)}</div>
                <div class="flex"></div>
                <div class="layout vertical progress">
                  <div class="layout horizontal justified" style="margin-bottom: 0.5rem;">
                    <span>Progress</span>
                    <span>${this.getProjectCompletionPercentage(project.uuid)}%</span>
                  </div>
                  <div>
                    <paper-progress
                      ?disabled=${project_tasks.length === 0}
                      value=${this.getProjectCompletionPercentage(project.uuid)}
                      min="0"
                      max="100"
                      class="purple"
                    ></paper-progress>
                  </div>
                </div>
                <div class="flex" style="flex: 0.16;"></div>
                <div
                  @click=${() => {
                    this.dispatchEvent(
                      new CustomEvent('createTaskForProject', { detail: { project_uuid: project.uuid } })
                    );
                  }}
                  class="layout vertical add-button"
                  ?hide=${this.page === '1'}
                >
                  <iron-icon icon="icons:add"></iron-icon>
                </div>
              </div>

              <!-- projects-end -->
              <!-- tasks -->

              <div
                id=${project.uuid}
                hidden
                class="layout vertical justified expanded-part"
                style=${'height:' + this.calculateExtendedHeight(project.uuid)}
              >
                ${project_tasks.length > 0
                  ? project_tasks.map((task) => {
                      return html`<div class="layout horizontal center task-item">
                        <paper-icon-button
                          id="tooltip-${task.uuid}_task_state"
                          ?disabled=${this.change_tasks_state_disabled}
                          icon="image:lens"
                          class="state-button"
                          state=${task.state}
                          @click=${() => {
                            this.dispatchEvent(
                              new CustomEvent('changeTasksState', { detail: { task_uuid: task.uuid } })
                            );
                          }}
                        ></paper-icon-button>
                        <dw-tooltip
                          placement="top"
                          offset="[0, 10]"
                          for="tooltip-${task.uuid}_task_state"
                          .content=${this.nextTaskStateMessage(task.state)}
                        ></dw-tooltip>
                        <div id="tooltip-${task.uuid}_task_name" class="task-name">
                          ${ui_helpers.add3Dots(task.name, 30)}
                        </div>
                        ${task.name?.length > 30
                          ? html` <dw-tooltip
                              placement="top"
                              offset="[0, 10]"
                              for="tooltip-${task.uuid}_task_name"
                              .content=${task.name}
                            ></dw-tooltip>`
                          : html``}
                        <div class="flex"></div>
                        <paper-icon-button
                          ?disabled=${this.change_tasks_state_disabled}
                          icon="open-in-new"
                          class="update-task-button update-project"
                          @click=${() => {
                            this.dispatchEvent(new CustomEvent('updateTask', { detail: { task_uuid: task.uuid } }));
                          }}
                        ></paper-icon-button>
                        <div class="flex"></div>
                        <div class="layout horizontal center-center assigned-users-to-task">
                          ${this.getAssignedUsersToTask(project.uuid, task)}
                        </div>
                        <div class="overflow-assigned-users-to-task">
                          ${this.getOverflowAssignedUsersToTaskCount(project.uuid, task)}
                        </div>
                      </div>`;
                    })
                  : html`<div class="layout horizontal center no-task-item">
                      No tasks in this project. <iron-icon class="mood-icon" icon="social:mood"></iron-icon>
                    </div>`}
              </div>
            </div>
          `;
        })}

        <!-- tasks-end -->
        <!-- tasks-no-project -->

        <div class="layout vertical project-container" last>
          <div class="layout horizontal justified tasks-no-project-header">
            <div>Tasks without project</div>
            <div>
              <paper-icon-button
                icon=${!this.hide_team_tasks_no_project ? 'icons:arrow-drop-up' : 'icons:arrow-drop-down'}
                style="color: var(--theme-primary);"
                @click=${() => {
                  this.hide_team_tasks_no_project = !this.hide_team_tasks_no_project;
                }}
              ></paper-icon-button>
            </div>
            <div class="flex"></div>
            <div>
              <paper-icon-button
                icon="add"
                style="color: var(--theme-primary);"
                @click=${() => {
                  this.dispatchEvent(new CustomEvent('createTaskForProject', { detail: { project_uuid: '' } }));
                }}
              ></paper-icon-button>
            </div>
          </div>
        </div>
        ${team_tasks_no_project_filtered?.length > 0
          ? html` <div
              class="layout vertical"
              style="padding-bottom: 1.5rem;"
              ?hidden=${this.hide_team_tasks_no_project}
            >
              <div
                class="layout vertical justified expanded-part"
                no-project
                style=${'height: ' + (team_tasks_no_project_filtered.length * 5.5).toString() + 'rem;'}
              >
                ${team_tasks_no_project_filtered.map((task) => {
                  return html` <div class="layout horizontal center task-item">
                    <paper-icon-button
                      id="tooltip-${task.uuid}_task_state"
                      ?disabled=${this.change_tasks_state_disabled}
                      icon="image:lens"
                      class="state-button"
                      state=${task.state}
                      @click=${() => {
                        this.dispatchEvent(new CustomEvent('changeTasksState', { detail: { task_uuid: task.uuid } }));
                      }}
                    ></paper-icon-button>
                    <dw-tooltip
                      placement="top"
                      offset="[0, 10]"
                      for="tooltip-${task.uuid}_task_state"
                      .content=${this.nextTaskStateMessage(task.state)}
                    ></dw-tooltip>
                    <div id="tooltip-${task.uuid}_task_name" class="task-name">
                      ${ui_helpers.add3Dots(task.name, 30)}
                    </div>
                    ${task.name?.length > 30
                      ? html` <dw-tooltip
                          placement="top"
                          offset="[0, 10]"
                          for="tooltip-${task.uuid}_task_name"
                          .content=${task.name}
                        ></dw-tooltip>`
                      : html``}
                    <div class="flex"></div>
                    <paper-icon-button
                      ?disabled=${this.change_tasks_state_disabled}
                      icon="open-in-new"
                      class="update-task-button update-project"
                      @click=${() => {
                        this.dispatchEvent(new CustomEvent('updateTask', { detail: { task_uuid: task.uuid } }));
                      }}
                    ></paper-icon-button>
                    <div class="flex"></div>
                    <div class="layout horizontal center-center assigned-users-to-task">
                      ${this.getAssignedUsersToTask('', task)}
                    </div>
                    <div class="overflow-assigned-users-to-task">
                      ${this.getOverflowAssignedUsersToTaskCount('', task)}
                    </div>
                  </div>`;
                })}
              </div>
            </div>`
          : html``}
        <!-- tasks-no-project-end -->
      </div>
    `;
  }

  nextTaskStateMessage(state: number): string {
    if (state < 0 || state >= 2) {
      state = -1;
    }

    return 'Change task state to ' + "'" + this.resolveStateName(state + 1) + "'";
  }

  resolveStateName(state: number): string {
    return state === 0 ? 'Open' : state === 1 ? 'Active' : state === 2 ? 'Done' : '';
  }

  hideProject(project_uuid: string): boolean {
    if (this.page === '0') {
      return false;
    }

    let team_tasks = this.project_to_tasks_map?.get(project_uuid);
    if (team_tasks && team_tasks?.length > 0) {
      return !team_tasks.some((task) => {
        return task?.state === 2;
      });
    }
    return true;
  }

  getProjectTeamTasks(project_uuid: string): TeamTask[] {
    let team_tasks = this.project_to_tasks_map?.get(project_uuid);
    if (team_tasks && team_tasks?.length > 0) {
      let team_tasks_filtered = team_tasks.filter((task) => {
        if (this.logged_in_user && this.only_me) {
          let assigned_users_to_task =
            task?.assigned_users_uuids?.length > 0 ? task.assigned_users_uuids.split(',') : [];
          if (!assigned_users_to_task.includes(this.logged_in_user.team_user_uuid)) {
            return false;
          }
        }

        return this.page === '0' ? task?.state < 2 : task?.state === 2;
      });
      if (team_tasks_filtered && team_tasks_filtered.length > 0) {
        return team_tasks_filtered;
      }
    }

    return [];
  }

  expandProject(project_uuid: string) {
    let elem = this.shadowRoot.getElementById(project_uuid);
    if (elem) {
      if (elem.hasAttribute('hidden')) {
        elem.removeAttribute('hidden');
        this.is_expanded_map.set(project_uuid, true);
      } else {
        elem.setAttribute('hidden', 'true');
        this.is_expanded_map.set(project_uuid, false);
      }
      this.requestUpdate('is_expanded_map');
    }
  }

  getAssignedUsersToProject(project_uuid: string): TemplateResult {
    let user_templates: TemplateResult[] = [];

    let team_users = this.project_to_assigned_users_map?.get(project_uuid);
    if (team_users && team_users?.length > 0) {
      team_users
        .sort(ui_helpers.sortUsers)
        .slice(0, 4)
        .forEach((team_user) => {
          let org_user = this.team_to_org_user_map?.get(team_user.uuid);
          if (org_user && org_user?.uuid) {
            user_templates.push(ui_helpers.renderUser(org_user, team_user, true, true));
          }
        });

      if (user_templates.length > 0) {
        return html`${user_templates.map((user_template) => {
          return user_template;
        })}`;
      }
    }

    return html`-`;
  }

  getAssignedUsersToTask(project_uuid: string, task: TeamTask): TemplateResult {
    let user_templates: TemplateResult[] = [];

    let team_users = this.project_to_assigned_users_map?.get(project_uuid);
    if (!project_uuid) {
      team_users = this.team_users;
    }
    if (team_users && team_users?.length > 0) {
      let assigned_users_to_task = task?.assigned_users_uuids?.length > 0 ? task.assigned_users_uuids.split(',') : [];
      if (assigned_users_to_task.length > 0) {
        let team_users_filtered = team_users.filter((team_user) => assigned_users_to_task.includes(team_user.uuid));
        if (team_users_filtered.length > 0) {
          team_users_filtered
            .sort(ui_helpers.sortUsers)
            .slice(0, 4)
            .forEach((team_user) => {
              let org_user = this.team_to_org_user_map?.get(team_user.uuid);
              if (org_user && org_user?.uuid) {
                user_templates.push(ui_helpers.renderUser(org_user, team_user, true, true));
              }
            });

          if (user_templates.length > 0) {
            return html`${user_templates.map((user_template) => {
              return user_template;
            })}`;
          }
        }
      }
    }

    return html`-`;
  }

  getOverflowAssignedUsersCount(project_uuid: string): TemplateResult {
    let team_users = this.project_to_assigned_users_map?.get(project_uuid);
    if (team_users && team_users?.length > 0) {
      if (team_users.length > 4) {
        let count = (team_users.length - 4).toString();

        return html`+${count}`;
      }
    }

    return html``;
  }

  getOverflowAssignedUsersToTaskCount(project_uuid: string, task: TeamTask): TemplateResult {
    let team_users = this.project_to_assigned_users_map?.get(project_uuid);
    if (!project_uuid) {
      team_users = this.team_users;
    }
    if (team_users && team_users?.length > 0) {
      let assigned_users_to_task = task?.assigned_users_uuids?.length > 0 ? task.assigned_users_uuids.split(',') : [];
      if (assigned_users_to_task.length > 0) {
        let team_users_filtered = team_users.filter((team_user) => assigned_users_to_task.includes(team_user.uuid));
        if (team_users_filtered.length > 4) {
          let count = (team_users_filtered.length - 4).toString();

          return html`+${count}`;
        }
      }
    }

    return html``;
  }

  calculateExtendedHeight(project_uuid: string): string {
    let team_tasks = this.project_to_tasks_map?.get(project_uuid);
    if (team_tasks && team_tasks?.length > 0) {
      let team_tasks_filtered = team_tasks.filter((task) => {
        if (this.logged_in_user && this.only_me) {
          let assigned_users_to_task =
            task?.assigned_users_uuids?.length > 0 ? task.assigned_users_uuids.split(',') : [];
          if (!assigned_users_to_task.includes(this.logged_in_user.team_user_uuid)) {
            return false;
          }
        }

        return this.page === '0' ? task?.state < 2 : task?.state === 2;
      });

      if (team_tasks_filtered && team_tasks_filtered?.length > 0) {
        return (team_tasks_filtered.length * 5.5).toString() + 'rem;';
      }
    }
    return '5.5rem;';
  }

  getProjectCompletionPercentage(project_uuid: string): string {
    let project = this.team_projects.find((project) => project.uuid === project_uuid);
    if (project) {
      let project_team_tasks = this.project_to_tasks_map.get(project_uuid);
      if (!project_team_tasks) {
        // nothing to complete.
        return '0';
      } else {
        let not_completed_tasks = 0;
        project_team_tasks.forEach((task) => {
          if (task.state < 2) {
            not_completed_tasks++;
          }
        });
        if (not_completed_tasks === 0) {
          // nothing to complete.
          return '100';
        }

        let project_tasks_uuids = project.tasks_uuids?.length > 0 ? project.tasks_uuids.split(',') : [];
        // just to be sure we are not dividing by zero, this is handled, but another check didn't hurt nobody.
        if (project_tasks_uuids.length === 0) {
          // nothing to complete.
          return '0';
        }

        let completed_tasks = project_tasks_uuids.length - not_completed_tasks;
        if (completed_tasks <= 0) {
          // something unexpected, fallback to 0.
          return '0';
        }

        return ((completed_tasks * 100) / project_tasks_uuids.length).toFixed(0).toString();
      }
    }

    return '0';
  }
}
