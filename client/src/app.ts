import { LitElement, html, customElement, property, TemplateResult, css } from 'lit-element';
import { database } from './database';
import {
  CreateProjectReq,
  OrgUser,
  Team,
  TeamProject,
  TeamState,
  TeamTask,
  TeamUser,
  UpdateProjectReq,
  LoggedInUser,
  Pages,
  CreateTaskReq,
  UpdateTaskReq,
} from './types';

import { render } from 'lit-html';
import { PaperToastElement } from '@polymer/paper-toast';
import { ui_helpers } from './helpers';

import { all } from './styles/styles';
import { api } from './api';

import '@polymer/iron-pages/iron-pages';
import '@polymer/paper-spinner/paper-spinner';
import '@polymer/paper-toast/paper-toast';
import '@polymer/paper-icon-button/paper-icon-button';

import '@vaadin/vaadin-combo-box/vaadin-combo-box';
import '@vaadin/vaadin-dialog/vaadin-dialog';
import '@vaadin/vaadin-text-field/vaadin-text-field';
import '@vaadin/vaadin-text-field/vaadin-text-area';
import '@polymer/paper-toggle-button/paper-toggle-button';

import '@vaadin/vaadin-button/vaadin-button';

import 'multiselect-combo-box/multiselect-combo-box';

import './components/right-panel';
import './components/top-header';
import './components/left-panel';
import './components/project-page';

declare global {
  interface Window {
    State: any;
  }
}

@customElement('wedo-app')
export class WeDo extends LitElement {
  @property({ attribute: false, type: Boolean })
  loading: boolean = true;

  @property({ attribute: false, type: String })
  selected_team_uuid: string = '';

  @property({ attribute: false })
  available_teams: Team[] = window.State.Data.teams || [];

  @property({ attribute: false })
  logged_in_user: LoggedInUser = undefined;

  @property({ attribute: false })
  team_state: TeamState = undefined;

  @property({ attribute: false })
  team_users: TeamUser[] = [];

  @property({ attribute: false })
  team_to_org_user_map: Map<string, OrgUser> = new Map();

  @property({ attribute: false })
  team_projects: TeamProject[] = [];

  @property({ attribute: false })
  team_tasks: TeamTask[] = [];

  @property({ attribute: false })
  team_tasks_no_project: TeamTask[] = [];

  @property({ attribute: false })
  project_to_tasks_map: Map<string, TeamTask[]> = new Map();

  @property({ attribute: false })
  project_to_assigned_users_map: Map<string, TeamUser[]> = new Map();

  @property({ attribute: false })
  goal_to_tasks_map: Map<string, TeamTask[]> = new Map();

  @property({ attribute: false })
  create_project_req: CreateProjectReq = undefined;

  @property({ attribute: false })
  update_project_req: UpdateProjectReq = undefined;

  @property({ attribute: false })
  create_task_req: CreateTaskReq = undefined;

  @property({ attribute: false })
  update_task_req: UpdateTaskReq = undefined;

  @property({ attribute: false })
  dialog_opened: boolean = false;

  @property({ attribute: false })
  change_tasks_state_disabled: boolean = false;

  @property()
  page: Pages = 'projects';

  private dialog: any = undefined;

  static styles = all.concat(css`
    .wedo-page,
    iron-pages {
      width: 100%;
      height: 100%;
    }
    .center-div {
      position: fixed;
      top: 50%;
      left: 50%;
      -webkit-transform: translate(-50%, -50%);
      transform: translate(-50%, -50%);
    }
    paper-spinner.loading {
      --paper-spinner-layer-1-color: var(--theme-primary);
      --paper-spinner-layer-2-color: var(--paper-cyan-500);
      --paper-spinner-layer-3-color: var(--theme-primary);
      --paper-spinner-layer-4-color: var(--paper-cyan-500);
      --paper-spinner-stroke-width: 5px;
      width: 10rem;
      height: 10rem;
    }
    .team-selector {
      width: 20rem;
    }
    #toast {
      z-index: 200000000000;
      font-weight: 500;
      font-size: 1.1rem;
    }
    .max-height {
      height: 100%;
    }
    .max-width {
      width: 100%;
    }
    .main-window-container {
      width: 100%;
      height: 90%;
    }
    .main-window-iron-pages-container {
      width: 75%;
      outline: 0.2rem solid #f2f3f5;
      z-index: 999;
      background: white;
    }
    .right-panel-container {
      width: 25%;
    }
  `);

  render() {
    return this.loading
      ? html`<div class="center-div"><paper-spinner class="loading" active></paper-spinner></div>`
      : this.selected_team_uuid.length > 0
      ? html`
          <dom-module id="purple" theme-for="vaadin-*-* multiselect-combo-box">
            <template>
              <style>
                :host([readonly][theme~='purple']) [part='label'] {
                  color: var(--theme-primary) !important;
                }
                :host([theme~='purple']) [part='label']:not(:hover) {
                  color: var(--theme-primary) !important;
                }
              </style>
            </template>
          </dom-module>
          <dom-module id="vaadin-combo-box-overlay-styles" theme-for="vaadin-combo-box-overlay">
            <template>
              <style>
                :host {
                  z-index: 900000000000;
                  width: var(--vaadin-combo-box-overlay-width, var(--_vaadin-combo-box-overlay-default-width, auto));
                }
              </style>
            </template>
          </dom-module>
          <paper-toast id="toast">
            <div class="layout horizontal center-center">
              <vaadin-button
                hidden
                @click=${() => {
                  const toast = this.shadowRoot.querySelector<PaperToastElement>('#toast');
                  if (toast) {
                    toast.toggle();
                  }
                }}
                >Close
              </vaadin-button>
            </div>
          </paper-toast>
          <div class="layout horizontal max-height">
            <left-panel
              .page=${this.page}
              .selected_team_uuid=${this.selected_team_uuid}
              @changePage=${(e) => {
                let new_page = String(e.detail.page) as Pages;
                if (new_page) {
                  this.page = new_page;
                }
              }}
            ></left-panel>
            <div class="layout vertical max-width">
              <top-header
                .page=${this.page}
                .logged_in_user=${this.logged_in_user}
                @createProject=${() => {
                  this.openDialog(this.projectDialogTemplate());
                }}
              ></top-header>
              <div class="layout horizontal main-window-container">
                <div class="layout horizontal main-window-iron-pages-container">
                  <iron-pages selected=${this.page} attr-for-selected="page">
                    <div class="wedo-page" page="projects">
                      <project-page
                        .change_tasks_state_disabled=${this.change_tasks_state_disabled}
                        .logged_in_user=${this.logged_in_user}
                        .team_users=${this.team_users}
                        .team_to_org_user_map=${this.team_to_org_user_map}
                        .team_tasks_no_project=${this.team_tasks_no_project}
                        .goal_to_tasks_map=${this.goal_to_tasks_map}
                        .team_projects=${this.team_projects}
                        .project_to_tasks_map=${this.project_to_tasks_map}
                        .project_to_assigned_users_map=${this.project_to_assigned_users_map}
                        @deleteProject=${(e) => {
                          if (e.detail.project_uuid) {
                            this.openDialog(this.deleteProjectOrTaskTemplate(e.detail.project_uuid, ''));
                          }
                        }}
                        @deleteTask=${(e) => {
                          if (e.detail.task_uuid) {
                            this.openDialog(this.deleteProjectOrTaskTemplate('', e.detail.task_uuid));
                          }
                        }}
                        @createTaskForProject=${(e) => {
                          if (e.detail.project_uuid) {
                            this.openDialog(this.taskDialogTemplate(e.detail.project_uuid));
                          } else {
                            this.openDialog(this.taskDialogTemplate());
                          }
                        }}
                        @updateTask=${(e) => {
                          if (e.detail.task_uuid) {
                            let task = this.team_tasks.find((task) => task.uuid === e.detail.task_uuid);
                            if (task) {
                              this.openDialog(this.taskDialogTemplate('', task));
                            }
                          }
                        }}
                        @updateProject=${(e) => {
                          if (e.detail.project_uuid) {
                            let project = this.team_projects.find((project) => project.uuid === e.detail.project_uuid);
                            if (project) {
                              this.openDialog(this.projectDialogTemplate(project));
                            }
                          }
                        }}
                        @changeTasksState=${(e) => {
                          this.change_tasks_state_disabled = true;

                          let task = this.team_tasks.find((task) => task.uuid === e.detail.task_uuid);
                          if (task) {
                            let task_state = task.state;
                            if (task_state === 2) {
                              task_state = -1;
                            }
                            api
                              .updateTasksState(task.uuid, task_state + 1)
                              .then(() => {
                                ui_helpers.show_toast(
                                  'success',
                                  'Task: ' + "'" + task.name + "'" + ' was successfully updated.'
                                );
                                this.change_tasks_state_disabled = false;
                              })
                              .catch(() => {
                                ui_helpers.show_toast('error', 'Task modification failed.');
                                this.change_tasks_state_disabled = false;
                              });
                          } else {
                            this.change_tasks_state_disabled = false;
                          }
                        }}
                      ></project-page>
                    </div>
                    <div class="wedo-page" page="statistics"></div>
                  </iron-pages>
                </div>
                <div class="layout horizontal right-panel-container">
                  <right-panel
                    .team_users=${this.team_users}
                    .team_to_org_user_map=${this.team_to_org_user_map}
                    .team_tasks=${this.team_tasks}
                    @viewTeam=${() => {
                      this.openDialog(this.viewTeamTemplate());
                    }}
                    @updateTask=${(e) => {
                      if (e.detail.task_uuid) {
                        let task = this.team_tasks.find((task) => task.uuid === e.detail.task_uuid);
                        if (task) {
                          this.openDialog(this.taskDialogTemplate('', task));
                        }
                      }
                    }}
                  ></right-panel>
                </div>
              </div>
            </div>
          </div>
        `
      : html` ${this.available_teams.length > 0
          ? html` <div class="center-div">
              <vaadin-combo-box
                @opened-changed=${(e) => {
                  console.log('AAA');
                }}
                class="team-selector"
                placeholder="Select team"
                .items=${this.available_teams.map((team) => {
                  return { label: team.name, value: team.uuid };
                })}
                @selected-item-changed=${(e) => {
                  if (e?.detail?.value?.value) {
                    this.selected_team_uuid = e.detail.value.value;
                    database.setSelectedTeam(this.selected_team_uuid);
                  }
                }}
              ></vaadin-combo-box>
            </div>`
          : html` <div class="center-div">
              You don't belong to any team.
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
            </div>`}`;
  }

  protected firstUpdated() {
    this.selectedTeam();
  }

  protected updated(_changedProperties: Map<string | number | symbol, unknown>): void {
    if (_changedProperties.has('selected_team_uuid') && this.selected_team_uuid.length > 0) {
      this.resetCreateProjectReq();
      this.resetUpdateProjectReq();
      this.resetCreateTaskReq();
      this.resetUpdateTaskReq();

      api.teamState(this.selected_team_uuid).then((resp) => {
        this.team_state = this.rebuildTeamState(resp);
        this.team_users = this.team_state.team_users?.length > 0 ? [].concat(this.team_state.team_users) : [];
        this.team_to_org_user_map = new Map(this.team_state.team_to_org_user_map);
        this.team_projects = this.team_state.team_projects?.length > 0 ? [].concat(this.team_state.team_projects) : [];
        this.team_tasks = this.team_state.team_tasks?.length > 0 ? [].concat(this.team_state.team_tasks) : [];
        this.rebuildMaps();
        this.buildLoggedInUser();
      });
    }
  }

  selectedTeam() {
    database
      .getSelectedTeam()
      .then((team_uuid) => {
        let team_found: boolean = false;
        for (let i = 0; i < this.available_teams.length; i++) {
          if (this.available_teams[i].uuid === team_uuid) {
            team_found = true;
            break;
          }
        }
        if (!team_found) {
          database.removeSelectedTeam();
          this.loading = false;
          return;
        }
        this.selected_team_uuid = team_uuid;
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
      });
  }

  rebuildTeamState(team_state: TeamState): TeamState {
    if (team_state?.team_to_org_user_map) {
      let obj_entries = Object.entries(team_state.team_to_org_user_map);
      let new_map = new Map<string, OrgUser>();

      if (obj_entries.length > 0) {
        obj_entries.forEach((e) => {
          new_map.set(e[0], e[1]);
        });
      }

      team_state.team_to_org_user_map = new_map;
    } else {
      return team_state;
    }

    return Object.assign({}, team_state);
  }

  buildLoggedInUser() {
    let org_user_from_window_state = window.State.Data.logged_in_org_user as OrgUser;
    let team_users_for_logged_in_org_user = window.State.Data.teams_user_for_logged_in_org_user as TeamUser[];
    if (team_users_for_logged_in_org_user && team_users_for_logged_in_org_user.length > 0) {
      team_users_for_logged_in_org_user.forEach((team_user) => {
        let org_user = this.team_to_org_user_map.get(team_user.uuid);
        if (org_user) {
          if (org_user.uuid === org_user_from_window_state.uuid) {
            this.logged_in_user = Object.assign(
              {},
              {
                uuid: org_user.uuid,
                username: org_user.username,
                email: org_user.email,
                description: org_user.description,
                profile_picture: org_user.profile_picture,
                created: org_user.created,
                updated: org_user.updated,
                team_user_uuid: team_user.uuid,
              }
            );
            return;
          }
        }
      });
    }
  }

  rebuildMaps() {
    let tasks_in_projects: string[] = [];

    if (this.team_projects?.length > 0 && this.team_tasks.length > 0) {
      let project_to_tasks_map: Map<string, TeamTask[]> = new Map();
      let project_to_assigned_users_map: Map<string, TeamUser[]> = new Map();

      this.team_projects.forEach((project) => {
        let project_tasks_uuids = project.tasks_uuids?.length > 0 ? project.tasks_uuids.split(',') : [];
        let project_tasks_arr: TeamTask[] = [];
        let project_team_users_arr: TeamUser[] = [];

        for (let i = 0; i < project_tasks_uuids.length; i++) {
          let task = this.team_tasks.find((task) => task.uuid === project_tasks_uuids[i]);

          if (task) {
            // removes duplicates (not allowed anyway).
            let duplicate_task_index = project_tasks_arr.findIndex((pt) => pt.uuid === task.uuid);
            if (duplicate_task_index === -1) {
              project_tasks_arr.push(task);
              tasks_in_projects.push(task.uuid);

              if (this.team_users?.length > 0) {
                let project_assigned_users_uuids =
                  task.assigned_users_uuids?.length > 0 ? task.assigned_users_uuids.split(',') : [];

                for (let j = 0; j < project_assigned_users_uuids.length; j++) {
                  let team_user = this.team_users.find(
                    (team_user) => team_user.uuid === project_assigned_users_uuids[j]
                  );
                  if (team_user) {
                    // removes duplicates (not allowed anyway).
                    let duplicate_user_index = project_team_users_arr.findIndex((ptu) => ptu.uuid === team_user.uuid);
                    if (duplicate_user_index === -1) {
                      project_team_users_arr.push(team_user);
                    }
                  }
                }
              }
            }
          }
        }

        project_to_tasks_map.set(project.uuid, project_tasks_arr);
        project_to_assigned_users_map.set(project.uuid, project_team_users_arr);
      });

      this.project_to_tasks_map = new Map(project_to_tasks_map);
      this.project_to_assigned_users_map = new Map(project_to_assigned_users_map);
    }

    if (this.team_tasks.length > 0) {
      let goal_to_tasks_map: Map<string, TeamTask[]> = new Map();
      let team_tasks_no_project: TeamTask[] = [];
      this.team_tasks.forEach((task) => {
        if (tasks_in_projects.findIndex((task_in_proj) => task_in_proj === task.uuid) === -1) {
          team_tasks_no_project.push(task);
        }

        if (task.goal) {
          let goal_arr = goal_to_tasks_map.get(task.goal) || [];
          goal_arr.push(task);
          goal_to_tasks_map.set(task.goal, goal_arr);
        }
      });

      this.team_tasks_no_project = team_tasks_no_project.length > 0 ? [].concat(team_tasks_no_project) : [];
      this.goal_to_tasks_map = new Map(goal_to_tasks_map);
    }
  }

  setDialogOpened(opened: boolean, template: TemplateResult) {
    if (this.dialog_opened === opened) {
      return;
    }
    this.dialog_opened = opened;

    const main_app = document.getElementById('main-app');
    if (main_app) {
      if (this.dialog_opened && !this.dialog) {
        main_app.style.setProperty('z-index', '-1');
        main_app.style.setProperty('position', 'relative');

        this.dialog = document.createElement('vaadin-dialog') as any;
        this.dialog.id = `${this.nodeName.toLowerCase()}-${new Date().toISOString()}`;
        this.dialog.noCloseOnOutsideClick = true;
        this.dialog.noCloseOnEsc = true;
        this.dialog.renderer = (root) => {
          render(template, root);
        };

        window.document.body.appendChild(this.dialog);

        this.dialog.addEventListener(
          'opened-changed',
          (e: CustomEvent) => {
            const overlay = window.document.body.querySelector('#overlay');
            if (overlay) {
              // append styles so we can use them in our dialogs.
              let overlayShadowStylesExtended = all + overlay.querySelector('#dialog-styles').innerHTML;
              overlay.querySelector('#dialog-styles').innerHTML = overlayShadowStylesExtended;
            }

            this.dispatchEvent(
              new CustomEvent('opened-changed', {
                detail: { opened: this.dialog.opened },
              })
            );
          },
          { once: true }
        );

        this.dialog.opened = true;
      } else if (!this.dialog_opened && this.dialog) {
        this.dialog.addEventListener(
          'opened-changed',
          () => {
            this.dialog.remove();
            // let the animation finish.
            setTimeout(() => {
              main_app.style.removeProperty('z-index');
              main_app.style.removeProperty('position');
            }, 200);
            this.dispatchEvent(
              new CustomEvent('opened-changed', {
                detail: { opened: this.dialog.opened },
              })
            );
          },
          { once: true }
        );
        this.dialog.opened = false;
        this.dialog = undefined;
      }
    }
  }

  openDialog(template: TemplateResult) {
    this.setDialogOpened(true, template);
  }

  closeDialog() {
    this.setDialogOpened(false, html``);
  }

  isCreateProjectReqValid(): boolean {
    if (!this.create_project_req) {
      return false;
    }

    return (
      this.create_project_req?.team_uuid?.length > 0 &&
      this.create_project_req?.team_uuid === this.selected_team_uuid &&
      this.create_project_req?.name?.length > 0
    );
  }

  isUpdateProjectReqValid(): boolean {
    if (!this.update_project_req) {
      return false;
    }

    return (
      this.update_project_req?.project_uuid?.length > 0 &&
      this.update_project_req?.team_uuid?.length > 0 &&
      this.update_project_req?.team_uuid === this.selected_team_uuid &&
      this.update_project_req?.name?.length > 0
    );
  }

  isCreateTaskReqValid(): boolean {
    if (!this.create_task_req) {
      return false;
    }

    return (
      this.create_task_req?.team_uuid?.length > 0 &&
      this.create_task_req?.team_uuid === this.selected_team_uuid &&
      this.create_task_req?.name?.length > 0 &&
      this.create_task_req?.state >= 0 &&
      this.create_task_req?.state < 3
    );
  }

  isUpdateTaskReqValid(): boolean {
    if (!this.update_task_req) {
      return false;
    }

    return (
      this.update_task_req?.task_uuid?.length > 0 &&
      this.update_task_req?.team_uuid?.length > 0 &&
      this.update_task_req?.team_uuid === this.selected_team_uuid &&
      this.update_task_req?.name?.length > 0 &&
      this.update_task_req?.state >= 0 &&
      this.update_task_req?.state < 3
    );
  }

  resetCreateProjectReq() {
    this.create_project_req = Object.assign(
      {},
      {
        team_uuid: this.selected_team_uuid?.length > 0 ? this.selected_team_uuid : '',
        tasks_uuids: [],
        name: '',
        description: '',
      }
    );
  }

  resetUpdateProjectReq() {
    this.update_project_req = Object.assign(
      {},
      {
        project_uuid: '',
        team_uuid: this.selected_team_uuid?.length > 0 ? this.selected_team_uuid : '',
        tasks_uuids: [],
        name: '',
        description: '',
      }
    );
  }

  projectDialogTemplate(existing?: TeamProject): TemplateResult {
    const is_update = existing && existing?.uuid?.length > 0;

    let tasks = [];
    let selected_tasks = [];
    this.team_tasks_no_project.forEach((task) => {
      tasks = [
        ...tasks,
        {
          label: task.name,
          value: task.uuid,
        },
      ];
    });

    if (is_update) {
      this.update_project_req.project_uuid = existing.uuid;

      let selected_tasks_uuids = existing.tasks_uuids?.length > 0 ? existing.tasks_uuids.split(',') : [];

      // find selected tasks and append them to selectable task array.
      if (selected_tasks_uuids.length > 0) {
        this.team_tasks.forEach((task) => {
          if (selected_tasks_uuids.includes(task.uuid)) {
            selected_tasks = [
              ...selected_tasks,
              {
                label: task.name,
                value: task.uuid,
              },
            ];

            tasks = [
              ...tasks,
              {
                label: task.name,
                value: task.uuid,
              },
            ];
          }
        });
      }
    }

    return html`<!-- Don't remove style tag, used to pass styles from main component -->
      <style id="dialog-styles">
        .dialog-header {
          font-weight: 500;
          font-size: 1.1rem;
          min-width: 20rem;
          align-items: center;
        }
        .max-width {
          width: 100%;
        }
        .button-row {
          padding-top: 3rem;
        }
        .button-row > .s-button,
        .button-row > .c-button {
          width: 49%;
          color: white;
        }
        .s-button {
          background: var(--theme-primary);
        }
        .c-button {
          background: var(--theme-secondary);
        }
      </style>
      <div class="layout vertical center">
        <div class="layout horizontal justified dialog-header">
          <div>${is_update ? 'Update Project' : 'Create Project'}</div>
          <div class="flex"></div>
          <div>
            <paper-icon-button
              icon="close"
              @click=${() => {
                this.closeDialog();
                if (is_update) {
                  this.resetUpdateProjectReq();
                } else {
                  this.resetCreateProjectReq();
                }
              }}
            ></paper-icon-button>
          </div>
        </div>
        <div class="layout horizontal max-width">
          <vaadin-text-field
            required
            class="max-width"
            label="Name"
            theme="purple"
            value=${is_update ? existing?.name : ''}
            @value-changed=${(e: any) => {
              if (is_update) {
                if (this.update_project_req) {
                  this.update_project_req.name = e.detail.value;
                }
              } else {
                if (this.create_project_req) {
                  this.create_project_req.name = e.detail.value;
                }
              }
            }}
          ></vaadin-text-field>
        </div>
        <div class="layout horizontal max-width">
          <vaadin-text-field
            class="max-width"
            label="Description"
            theme="purple"
            value=${is_update ? existing?.description : ''}
            @value-changed=${(e: any) => {
              if (is_update) {
                if (this.update_project_req) {
                  this.update_project_req.description = e.detail.value;
                }
              } else {
                if (this.create_project_req) {
                  this.create_project_req.description = e.detail.value;
                }
              }
            }}
          ></vaadin-text-field>
        </div>
        <div class="layout horizontal max-width" ?hidden=${tasks.length === 0}>
          <multiselect-combo-box
            class="max-width"
            compact-mode
            clear-button-visible
            theme="purple"
            @selected-items-changed=${(e) => {
              if (is_update) {
                if (this.update_project_req) {
                  this.update_project_req.tasks_uuids = [].concat(
                    e.detail.value.map((entry) => {
                      return entry['value'];
                    })
                  );
                }
              } else {
                if (this.create_project_req) {
                  this.create_project_req.tasks_uuids = [].concat(
                    e.detail.value.map((entry) => {
                      return entry['value'];
                    })
                  );
                }
              }
            }}
            label="Tasks"
            item-value-path="value"
            item-id-path="value"
            item-label-path="label"
            .selectedItems=${selected_tasks}
            .items=${tasks}
          ></multiselect-combo-box>
        </div>
        <div class="layout horizontal justified max-width button-row">
          <vaadin-button
            class="c-button"
            @click=${() => {
              this.closeDialog();
              if (is_update) {
                this.resetUpdateProjectReq();
              } else {
                this.resetCreateProjectReq();
              }
            }}
            >Cancel</vaadin-button
          >
          <vaadin-button
            class="s-button"
            @click=${() => {
              if (is_update) {
                if (this.isUpdateProjectReqValid()) {
                  api
                    .updateProject(this.update_project_req)
                    .then((updated_project) => {
                      this.closeDialog();
                      ui_helpers.show_toast(
                        'success',
                        'Project: ' + "'" + this.update_project_req.name + "'" + ' was successfully updated.'
                      );
                      this.resetUpdateProjectReq();

                      // @note for future WS impl.
                      this.team_projects = this.team_projects.map((project) =>
                        project.uuid === updated_project.uuid ? updated_project : project
                      );
                      this.rebuildMaps();
                    })
                    .catch(() => {
                      this.closeDialog();
                      ui_helpers.show_toast('error', 'Project modification failed.');
                      this.resetUpdateProjectReq();
                    });
                } else {
                  ui_helpers.show_toast('error', 'Project modification failed, invalid request.');
                }
              } else {
                if (this.isCreateProjectReqValid()) {
                  api
                    .createProject(this.create_project_req)
                    .then((created_project) => {
                      this.closeDialog();
                      ui_helpers.show_toast(
                        'success',
                        'Project: ' + "'" + this.create_project_req?.name + "'" + ' was successfully created.'
                      );
                      this.resetCreateProjectReq();

                      // @note for future WS impl.
                      this.team_projects = this.team_projects.concat(created_project);
                      this.rebuildMaps();
                    })
                    .catch(() => {
                      this.closeDialog();
                      ui_helpers.show_toast('error', 'Project creation failed.');
                      this.resetCreateProjectReq();
                    });
                } else {
                  ui_helpers.show_toast('error', 'Project creation failed, invalid request.');
                }
              }
            }}
            >Submit</vaadin-button
          >
        </div>
      </div>`;
  }

  resetCreateTaskReq() {
    this.create_task_req = Object.assign(
      {},
      {
        project_uuid: '',
        team_uuid: this.selected_team_uuid?.length > 0 ? this.selected_team_uuid : '',
        assigned_users_uuids: [],
        name: '',
        description: '',
        goal: '',
        state: 0,
      }
    );
  }

  resetUpdateTaskReq() {
    this.update_task_req = Object.assign(
      {},
      {
        task_uuid: '',
        team_uuid: this.selected_team_uuid?.length > 0 ? this.selected_team_uuid : '',
        assigned_users_uuids: [],
        name: '',
        description: '',
        goal: '',
        state: 0,
      }
    );
  }

  taskDialogTemplate(existing_project_uuid?: string, existing?: TeamTask): TemplateResult {
    const is_update = existing && existing?.uuid?.length > 0;

    let selected_team_users = [];

    if (is_update) {
      this.update_task_req.task_uuid = existing.uuid;

      let selected_team_users_uuids =
        existing.assigned_users_uuids?.length > 0 ? existing.assigned_users_uuids.split(',') : [];

      // find selected team users and append them to selectable team users array.
      if (selected_team_users_uuids.length > 0) {
        this.team_users.forEach((team_user) => {
          if (selected_team_users_uuids.includes(team_user.uuid)) {
            let org_user = this.team_to_org_user_map?.get(team_user.uuid);
            let name = 'Unknown team user';
            if (org_user?.uuid) {
              name = org_user?.username + (org_user?.email ? ' (' + org_user.email + ')' : '');
            }

            selected_team_users = [
              ...selected_team_users,
              {
                label: name,
                value: team_user.uuid,
              },
            ];
          }
        });
      }
    } else {
      if (existing_project_uuid) {
        this.create_task_req.project_uuid = existing_project_uuid;
      }
    }

    return html`<!-- Don't remove style tag, used to pass styles from main component -->
      <style id="dialog-styles">
        .container {
          min-width: 70rem;
          min-height: 35rem;
        }
        .dialog-header {
          width: 100%;
          font-weight: 500;
          font-size: 1.1rem;
          align-items: center;
        }
        vaadin-text-area {
          min-height: 15rem;
        }
        .max-width {
          width: 100%;
        }
        .button-row {
          padding-top: 3rem;
        }
        .button-row > .s-button,
        .button-row > .c-button {
          width: 49%;
          color: white;
        }
        .s-button {
          background: var(--theme-primary);
        }
        .c-button {
          background: var(--theme-secondary);
        }
        .third {
          width: 33.33%;
        }
      </style>
      <div class="layout vertical center container">
        <div class="layout horizontal justified dialog-header">
          <div>${is_update ? 'Update Task' : 'Create Task'}</div>
          <div class="flex"></div>
          <div>
            <paper-icon-button
              icon="close"
              @click=${() => {
                this.closeDialog();
                if (is_update) {
                  this.resetUpdateTaskReq();
                } else {
                  this.resetCreateTaskReq();
                }
              }}
            ></paper-icon-button>
          </div>
        </div>
        <div class="layout horizontal max-width">
          <vaadin-text-field
            required
            class="max-width"
            label="Name"
            theme="purple"
            value=${is_update ? existing?.name : ''}
            @value-changed=${(e: any) => {
              if (is_update) {
                if (this.update_task_req) {
                  this.update_task_req.name = e.detail.value;
                }
              } else {
                if (this.create_task_req) {
                  this.create_task_req.name = e.detail.value;
                }
              }
            }}
          ></vaadin-text-field>
        </div>
        <div class="layout horizontal max-width">
          <vaadin-text-area
            class="max-width"
            label="Description"
            theme="purple"
            value=${is_update ? existing?.description : ''}
            @value-changed=${(e: any) => {
              if (is_update) {
                if (this.update_task_req) {
                  this.update_task_req.description = e.detail.value;
                }
              } else {
                if (this.create_task_req) {
                  this.create_task_req.description = e.detail.value;
                }
              }
            }}
          ></vaadin-text-area>
        </div>
        <div class="layout horizontal max-width">
          <vaadin-text-field
            class="max-width"
            label="Goal"
            theme="purple"
            value=${is_update ? existing?.goal : ''}
            @value-changed=${(e: any) => {
              if (is_update) {
                if (this.update_task_req) {
                  this.update_task_req.goal = e.detail.value;
                }
              } else {
                if (this.create_task_req) {
                  this.create_task_req.goal = e.detail.value;
                }
              }
            }}
          ></vaadin-text-field>
        </div>
        <div class="layout horizontal max-width">
          <multiselect-combo-box
            class="max-width"
            compact-mode
            clear-button-visible
            theme="purple"
            @selected-items-changed=${(e) => {
              if (is_update) {
                if (this.update_task_req) {
                  this.update_task_req.assigned_users_uuids = [].concat(
                    e.detail.value.map((entry) => {
                      return entry['value'];
                    })
                  );
                }
              } else {
                if (this.create_task_req) {
                  this.create_task_req.assigned_users_uuids = [].concat(
                    e.detail.value.map((entry) => {
                      return entry['value'];
                    })
                  );
                }
              }
            }}
            label="Assigned team users"
            item-value-path="value"
            item-id-path="value"
            item-label-path="label"
            .selectedItems=${selected_team_users}
            .items=${this.team_users.map((team_user) => {
              let org_user = this.team_to_org_user_map?.get(team_user.uuid);
              let name = 'Unknown team user';
              if (org_user?.uuid) {
                name = org_user?.username + (org_user?.email ? ' (' + org_user.email + ')' : '');
              }

              return {
                label: name,
                value: team_user.uuid,
              };
            })}
          ></multiselect-combo-box>
        </div>
        <div class="layout horizontal max-width">
          <vaadin-combo-box
            class="third"
            label="State"
            theme="purple"
            value=${is_update ? existing?.state?.toString() : '0'}
            .items=${[
              { label: 'Open', value: '0' },
              { label: 'Active', value: '1' },
              { label: 'Done', value: '2' },
            ]}
            @selected-item-changed=${(e) => {
              if (e?.detail?.value?.value) {
                if (is_update) {
                  if (this.update_task_req) {
                    this.update_task_req.state = Number(e.detail.value.value);
                  }
                } else {
                  if (this.create_task_req) {
                    this.create_task_req.state = Number(e.detail.value.value);
                  }
                }
              }
            }}
          ></vaadin-combo-box>
        </div>
        <div class="layout horizontal justified max-width button-row">
          <vaadin-button
            class="c-button"
            @click=${() => {
              this.closeDialog();
              if (is_update) {
                this.resetUpdateTaskReq();
              } else {
                this.resetCreateTaskReq();
              }
            }}
            >Cancel</vaadin-button
          >
          <vaadin-button
            class="s-button"
            @click=${() => {
              if (is_update) {
                if (this.isUpdateTaskReqValid()) {
                  api
                    .updateTask(this.update_task_req)
                    .then((updated_task) => {
                      this.closeDialog();
                      ui_helpers.show_toast(
                        'success',
                        'Task: ' + "'" + this.update_task_req.name + "'" + ' was successfully updated.'
                      );
                      this.resetUpdateTaskReq();

                      // @note for future WS impl.
                      this.team_tasks = this.team_tasks.map((task) =>
                        task.uuid === updated_task.uuid ? updated_task : task
                      );
                      this.rebuildMaps();
                    })
                    .catch(() => {
                      this.closeDialog();
                      ui_helpers.show_toast('error', 'Task modification failed.');
                      this.resetUpdateTaskReq();
                    });
                } else {
                  ui_helpers.show_toast('error', 'Task modification failed, invalid request.');
                }
              } else {
                if (this.isCreateTaskReqValid()) {
                  api
                    .createTask(this.create_task_req)
                    .then((created_task_obj) => {
                      this.closeDialog();
                      ui_helpers.show_toast(
                        'success',
                        'Task: ' + "'" + this.create_task_req.name + "'" + ' was successfully created.'
                      );
                      this.resetCreateTaskReq();

                      // @note for future WS impl.
                      if (created_task_obj?.project?.uuid) {
                        this.team_projects = this.team_projects.map((project) =>
                          project.uuid === created_task_obj.project.uuid ? created_task_obj.project : project
                        );
                      }
                      this.team_tasks = this.team_tasks.concat(created_task_obj.task);
                      this.rebuildMaps();
                    })
                    .catch(() => {
                      this.closeDialog();
                      ui_helpers.show_toast('error', 'Task creation failed.');
                      this.resetCreateTaskReq();
                    });
                } else {
                  ui_helpers.show_toast('error', 'Task creation failed, invalid request.');
                }
              }
            }}
            >Submit</vaadin-button
          >
        </div>
      </div>`;
  }

  viewTeamTemplate(): TemplateResult {
    return html`<!-- Don't remove style tag, used to pass styles from main component -->
      <style id="dialog-styles">
        .container {
          min-width: 25rem;
          min-height: 10rem;
          max-height: 40rem;
        }
        .dialog-header {
          font-weight: 500;
          font-size: 1.1rem;
          align-items: center;
          width: 100%;
          margin-bottom: 1rem;
        }
        .user-row {
          width: 100%;
          font-weight: 500;
          padding: 0.5rem 1rem;
        }
      </style>
      <div class="layout vertical center container">
        <div class="layout horizontal justified dialog-header">
          <div>Team</div>
          <div class="flex"></div>
          <div>
            <paper-icon-button
              icon="close"
              @click=${() => {
                this.closeDialog();
              }}
            ></paper-icon-button>
          </div>
        </div>
        ${this.team_users.map((team_user) => {
          let org_user = this.team_to_org_user_map?.get(team_user.uuid);
          let name = 'Unknown team user';
          if (org_user?.uuid) {
            name = org_user?.username + (org_user?.email ? ' (' + org_user.email + ')' : '');
          }

          return html`<div class="layout horizontal center-center user-row">
            <div>${ui_helpers.renderUser(org_user, team_user, true)}</div>
            <div class="flex"></div>
            <div>${name}</div>
          </div>`;
        })}
      </div>`;
  }

  deleteProjectOrTaskTemplate(project_uuid?: string, task_uuid?: string): TemplateResult {
    let delete_project_tasks = false;
    if (!project_uuid && !task_uuid) {
      return html``;
    }
    let project: TeamProject = undefined;
    let task: TeamTask = undefined;
    if (project_uuid) {
      project = this.team_projects.find((project) => project.uuid === project_uuid);
    }
    if (task_uuid) {
      task = this.team_tasks.find((task) => task.uuid === task_uuid);
    }

    return html`<!-- Don't remove style tag, used to pass styles from main component -->
      <style id="dialog-styles">
        .container {
          min-width: 25rem;
          min-height: 10rem;
          max-height: 25rem;
        }
        .dialog-header {
          font-weight: 500;
          font-size: 1.1rem;
          align-items: center;
          width: 100%;
          margin-bottom: 1rem;
        }
        .max-width {
          width: 100%;
          min-height: 0.7rem;
        }
        .button-row {
          padding-top: 3rem;
        }
        .button-row > .d-button,
        .button-row > .c-button {
          width: 49%;
          color: white;
        }
        .d-button {
          background: var(--theme-error);
        }
        .c-button {
          background: var(--theme-secondary);
        }
        .delete-tasks {
          --paper-toggle-button-checked-button-color: var(--theme-error);
          --paper-toggle-button-checked-ink-color: var(--theme-error);
          --paper-toggle-button-checked-bar-color: var(--theme-error);
          font-size: 1.05rem;
        }
      </style>
      <div class="layout vertical center container">
        <div class="layout horizontal justified dialog-header">
          <div>${project_uuid ? 'Delete project' : 'Delete task'}</div>
          <div class="flex"></div>
          <div>
            <paper-icon-button
              icon="close"
              @click=${() => {
                this.closeDialog();
              }}
            ></paper-icon-button>
          </div>
        </div>
        ${project_uuid && project?.tasks_uuids?.length > 0
          ? html`<div class="layout horizontal justified max-width">
              <paper-toggle-button
                .checked=${delete_project_tasks}
                @checked-changed=${(e) => {
                  let checked = Boolean(e.detail.value);
                  if (checked != delete_project_tasks) {
                    delete_project_tasks = checked;
                  }
                }}
                class="delete-tasks"
                >Delete project tasks?</paper-toggle-button
              >
            </div>`
          : html`<div class="layout horizontal justified max-width"></div>`}
        <div class="layout horizontal justified max-width button-row">
          <vaadin-button
            class="c-button"
            @click=${() => {
              this.closeDialog();
            }}
            >Cancel</vaadin-button
          >
          <vaadin-button
            class="d-button"
            @click=${() => {
              if (project_uuid) {
                api
                  .deleteProject(project_uuid, this.selected_team_uuid, delete_project_tasks)
                  .then(() => {
                    this.closeDialog();
                    ui_helpers.show_toast(
                      'success',
                      'Project: ' + "'" + project?.name + "'" + ' was successfully deleted.'
                    );

                    // @note for future WS impl.
                    this.team_projects = this.team_projects.filter(
                      (team_project) => team_project.uuid !== project_uuid
                    );
                    if (delete_project_tasks) {
                      let project_tasks_uuids = project?.tasks_uuids?.length > 0 ? project.tasks_uuids.split(',') : [];
                      if (project_tasks_uuids.length > 0) {
                        this.team_tasks = this.team_tasks.filter(
                          (team_task) => !project_tasks_uuids.includes(team_task.uuid)
                        );
                      }
                    }
                    this.rebuildMaps();
                  })
                  .catch(() => {
                    this.closeDialog();
                    ui_helpers.show_toast('error', 'Project deletion failed.');
                  });
              } else if (task_uuid) {
                api
                  .deleteTask(task_uuid, this.selected_team_uuid)
                  .then(() => {
                    this.closeDialog();
                    ui_helpers.show_toast('success', 'Task: ' + "'" + task?.name + "'" + ' was successfully deleted.');

                    // @note for future WS impl.
                    this.team_tasks = this.team_tasks.filter((team_task) => team_task.uuid != task_uuid);
                    this.rebuildMaps();
                  })
                  .catch(() => {
                    this.closeDialog();
                    ui_helpers.show_toast('error', 'Task deletion failed.');
                  });
              }
            }}
            >Delete</vaadin-button
          >
        </div>
      </div>`;
  }
}
