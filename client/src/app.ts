import { LitElement, html, customElement, property, TemplateResult, css } from 'lit-element';
import { database } from './database';
import { CreateProjectReq, OrgUser, Team, TeamProject, TeamState, TeamTask, TeamUser } from './types';

import '@polymer/iron-pages/iron-pages';
import '@polymer/paper-spinner/paper-spinner';
import '@polymer/paper-toast/paper-toast';

import '@vaadin/vaadin-combo-box/vaadin-combo-box';
import '@vaadin/vaadin-dialog/vaadin-dialog';
import '@vaadin/vaadin-text-field/vaadin-text-field';

import 'multiselect-combo-box/multiselect-combo-box';

import { all } from './styles/styles';
import { api } from './api';
import './components/right-panel';
import './components/top-header';
import './components/left-panel';
import './components/task-list';
import { render } from 'lit-html';
import { PaperToastElement } from '@polymer/paper-toast';

type Pages = 'one' | 'two' | 'three';

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
  dialog_type: 'create-project' | 'update-project' | '' = '';

  @property({ attribute: false })
  create_project_req: CreateProjectReq = undefined;

  @property({ attribute: false })
  opened: boolean = false;

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
    }
  `);

  @property()
  page: Pages = 'one';

  @property()
  name = 'Hristijan Tofcheski';

  private dialog: any = undefined;

  render() {
    return this.loading
      ? html`<div class="center-div"><paper-spinner class="loading" active></paper-spinner></div>`
      : this.selected_team_uuid.length > 0
      ? html`
          <dom-module id="purple" theme-for="vaadin-*-*">
            <template>
              <style>
                :host([readonly][theme~='purple']) [part='label'] {
                  color: #7771eb !important;
                }
                :host([theme~='purple']) [part='label']:not(:hover) {
                  color: #7771eb !important;
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
          <div class="layout horizontal" style="height: 100%;">
            <left-panel></left-panel>
            <div class="layout vertical" style="width: 100%;">
              <top-header></top-header>
              <div class="layout horizontal" style="width: 100%; height: 90%">
                <div
                  class="layout horizontal"
                  style="width: 75%;outline: 0.2rem solid #f2f3f5; z-index: 999; background: white;"
                >
                  <iron-pages selected=${this.page} attr-for-selected="page">
                    <div class="wedo-page" page="one">
                      <task-list
                        .project_to_tasks_map=${this.project_to_tasks_map}
                        .team_tasks_no_project=${this.team_tasks_no_project}
                        .team_state=${this.team_state}
                        @test=${(e) => {
                          this.dialog_type = e.detail.type;
                          this.open(this.createProjectDialogTemplate());
                        }}
                      ></task-list>
                    </div>
                    <div class="wedo-page" page="two"></div>
                    <div class="wedo-page" page="three"></div>
                  </iron-pages>
                </div>
                <div class="layout horizontal" style="width: 25%;"><right-panel></right-panel></div>
              </div>
            </div>
          </div>
        `
      : html` ${this.available_teams.length > 0
          ? html` <div class="center-div">
              <vaadin-combo-box
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
      this.resetCreateProjectReq(true);
      api.teamState(this.selected_team_uuid).then((resp) => {
        this.team_state = this.rebuildTeamState(resp);
        this.team_users = [].concat(this.team_state.team_users);
        this.team_to_org_user_map = new Map(this.team_state.team_to_org_user_map);
        this.team_projects = [].concat(this.team_state.team_projects);
        this.team_tasks = [].concat(this.team_state.team_tasks);
        this.buildMapsFromTeamState();
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

  buildMapsFromTeamState() {
    if (!this.team_state) {
      return;
    }

    let tasks_in_projects: string[] = [];

    if (this.team_state?.team_projects && this.team_state?.team_tasks) {
      let project_to_tasks_map: Map<string, TeamTask[]> = new Map();
      let project_to_assigned_users_map: Map<string, TeamUser[]> = new Map();

      this.team_state.team_projects.forEach((project) => {
        let project_tasks_uuids = project.tasks_uuids.length > 0 ? project.tasks_uuids.split(',') : [];
        let project_tasks_arr: TeamTask[] = [];
        let project_team_users_arr: TeamUser[] = [];

        for (let i = 0; i < project_tasks_uuids.length; i++) {
          let task = this.team_state.team_tasks.find((task) => task.uuid === project_tasks_uuids[i]);

          if (task) {
            // removes duplicates (not allowed anyway)
            let duplicate_task_index = project_tasks_arr.findIndex((pt) => pt.uuid === task.uuid);
            if (duplicate_task_index === -1) {
              project_tasks_arr.push(task);
              tasks_in_projects.push(task.uuid);

              if (this.team_state?.team_users) {
                let project_assigned_users_uuids =
                  task.assigned_users_uuids.length > 0 ? task.assigned_users_uuids.split(',') : [];

                for (let j = 0; j < project_assigned_users_uuids.length; j++) {
                  let team_user = this.team_state.team_users.find(
                    (team_user) => team_user.uuid === project_assigned_users_uuids[j]
                  );
                  if (team_user) {
                    // removes duplicates (not allowed anyway)
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

      this.project_to_tasks_map = project_to_tasks_map;
      this.project_to_assigned_users_map = project_to_assigned_users_map;
    }

    if (this.team_state?.team_tasks) {
      let goal_to_tasks_map: Map<string, TeamTask[]> = new Map();
      let team_tasks_no_project: TeamTask[] = [];
      this.team_state.team_tasks.forEach((task) => {
        if (tasks_in_projects.findIndex((task_in_proj) => task_in_proj === task.uuid) === -1) {
          team_tasks_no_project.push(task);
        }

        if (task.goal) {
          let goal_arr = goal_to_tasks_map.get(task.goal) || [];
          goal_arr.push(task);
          goal_to_tasks_map.set(task.goal, goal_arr);
        }
      });

      this.team_tasks_no_project = team_tasks_no_project;
      this.goal_to_tasks_map = goal_to_tasks_map;
    }
  }

  updateProjectDialogTemplate(): TemplateResult {
    let tasks = [];
    this.team_tasks_no_project.forEach((task) => {
      tasks = [
        ...tasks,
        {
          label: task.name,
          value: task.uuid,
        },
      ];
    });

    let test = html`<div class="layout vertical center">
      <div class="layout horizontal" style="font-weight: 500; font-size: 1.1rem;">Update Project</div>
      <div class="layout horizontal">
        <vaadin-text-field
          label="Name"
          theme="purple"
          @value-changed=${(e: any) => {
            if (this.create_project_req) {
              this.create_project_req.name = e.detail.value;
            }
          }}
        ></vaadin-text-field>
      </div>
      <div class="layout horizontal">
        <vaadin-text-field
          label="Description"
          theme="purple"
          @value-changed=${(e: any) => {
            if (this.create_project_req) {
              this.create_project_req.description = e.detail.value;
            }
          }}
        ></vaadin-text-field>
      </div>
      <div class="layout horizontal">
        <multiselect-combo-box
          theme="purple"
          compact-mode
          clear-button-visible
          @selected-items-changed=${(e) => {
            if (this.create_project_req) {
              this.create_project_req.tasks_uuids = [].concat(
                e.detail.value.map((entry) => {
                  return entry['value'];
                })
              );
            }
          }}
          label="Tasks"
          item-value-path="value"
          item-id-path="value"
          item-label-path="label"
          .selectedItems=${[]}
          .items=${tasks}
        ></multiselect-combo-box>
      </div>
      <div class="layout horizontal">
        <vaadin-button
          @click=${() => {
            if (this.isCreateProjectReqValid()) {
              api.createProject(this.create_project_req).then((resp) => {
                const dialog = this.shadowRoot.getElementById('dialog');
                console.log(dialog);

                if (dialog) {
                  //@ts-ignore
                  dialog.opened = false;
                }
                this.show_toast('success', 'project created.');
              });
            } else {
              this.show_toast('error', 'invalid');
            }
          }}
          >Create</vaadin-button
        ><vaadin-button
          @click=${() => {
            this.close();
          }}
          >EXIT</vaadin-button
        >
      </div>
    </div>`;

    return html`${test}`;
  }

  createProjectDialogTemplate(): TemplateResult {
    let tasks = [];
    this.team_tasks_no_project.forEach((task) => {
      tasks = [
        ...tasks,
        {
          label: task.name,
          value: task.uuid,
        },
      ];
    });

    let test = html`<div class="layout vertical center">
      <div class="layout horizontal" style="font-weight: 500; font-size: 1.1rem;">Create Project</div>
      <div class="layout horizontal">
        <vaadin-text-field
          label="Name"
          theme="purple"
          @value-changed=${(e: any) => {
            if (this.create_project_req) {
              this.create_project_req.name = e.detail.value;
            }
          }}
        ></vaadin-text-field>
      </div>
      <div class="layout horizontal">
        <vaadin-text-field
          label="Description"
          theme="purple"
          @value-changed=${(e: any) => {
            if (this.create_project_req) {
              this.create_project_req.description = e.detail.value;
            }
          }}
        ></vaadin-text-field>
      </div>
      <div class="layout horizontal">
        <multiselect-combo-box
          theme="purple"
          compact-mode
          clear-button-visible
          @selected-items-changed=${(e) => {
            if (this.create_project_req) {
              this.create_project_req.tasks_uuids = [].concat(
                e.detail.value.map((entry) => {
                  return entry['value'];
                })
              );
            }
          }}
          label="Tasks"
          item-value-path="value"
          item-id-path="value"
          item-label-path="label"
          .selectedItems=${[]}
          .items=${tasks}
        ></multiselect-combo-box>
      </div>
      <div class="layout horizontal">
        <vaadin-button
          @click=${() => {
            if (this.isCreateProjectReqValid()) {
              api.createProject(this.create_project_req).then((resp) => {
                const dialog = this.shadowRoot.getElementById('dialog');
                console.log(dialog);

                if (dialog) {
                  //@ts-ignore
                  dialog.opened = false;
                }
                this.show_toast('success', 'project created.');
              });
            } else {
              this.show_toast('error', 'invalid');
            }
          }}
          >Create</vaadin-button
        ><vaadin-button
          @click=${() => {
            this.close();
          }}
          >EXIT</vaadin-button
        >
      </div>
    </div>`;

    return html`${test}`;
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

  resetCreateProjectReq(init?: boolean) {
    if (init) {
      this.create_project_req = Object.assign(
        {},
        {
          team_uuid: this.selected_team_uuid?.length > 0 ? this.selected_team_uuid : '',
          tasks_uuids: [],
          name: '',
          description: '',
        }
      );
    } else {
      this.create_project_req.team_uuid = this.selected_team_uuid?.length > 0 ? this.selected_team_uuid : '';
      this.create_project_req.tasks_uuids = [];
      this.create_project_req.name = '';
      this.create_project_req.description = '';
    }
  }

  show_toast(type: 'success' | 'error' | 'info', message: string, persistent?: boolean) {
    const app: HTMLElement = document.getElementById('main-app');
    if (app) {
      let background_color = '';

      switch (type) {
        case 'error':
          background_color = getComputedStyle(app).getPropertyValue('--theme-error');
          break;
        case 'success':
          background_color = getComputedStyle(app).getPropertyValue('--theme-primary');
          break;
        default:
          background_color = '#666';
          break;
      }
      app.style.setProperty('--paper-toast-background-color', background_color);

      const toast = app.shadowRoot.querySelector<PaperToastElement>('#toast');
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
  }

  open(template: TemplateResult) {
    this.setOpened(true, template);
  }

  close() {
    this.setOpened(false, html``);
  }

  setOpened(opened: boolean, template: TemplateResult) {
    if (this.opened === opened) {
      return;
    }
    this.opened = opened;

    const main_app = document.getElementById('main-app');

    if (main_app) {
      if (this.opened && !this.dialog) {
        main_app.setAttribute('style', 'z-index: -1; position: relative;');

        this.dialog = document.createElement('vaadin-dialog') as any;
        this.dialog.id = `${this.nodeName.toLowerCase()}-${new Date().toISOString()}`;
        this.dialog.noCloseOnOutsideClick = true;
        this.dialog.noCloseOnEsc = true;
        this.dialog.renderer = (root, dialog) => {
          render(template, root);
        };

        window.document.body.appendChild(this.dialog);

        this.dialog.addEventListener(
          'opened-changed',
          (e: CustomEvent) => {
            this.dispatchEvent(
              new CustomEvent('opened-changed', {
                detail: { opened: this.dialog.opened },
              })
            );
          },
          { once: true }
        );

        this.dialog.opened = true;
      } else if (!this.opened && this.dialog) {
        this.dialog.addEventListener(
          'opened-changed',
          () => {
            this.dialog.remove();
            // let the animation finish
            setTimeout(() => {
              main_app.removeAttribute('style');
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
}
