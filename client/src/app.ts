import { LitElement, html, customElement, property, TemplateResult, css } from 'lit-element';
import { database } from './database';
import { OrgUser, Team, TeamState, TeamTask, TeamUser } from './types';

import '@polymer/iron-pages/iron-pages';
import '@polymer/paper-spinner/paper-spinner';

import '@vaadin/vaadin-combo-box';

import { all } from './styles/styles';
import { api } from './api';
import './components/right-panel';
import './components/top-header';
import './components/left-panel';
import './components/task-list';

type Pages = 'one' | 'two' | 'three';

declare global {
  interface Window {
    State: any;
  }
}

@customElement('wedo-app')
export class WeDo extends LitElement {
  @property({ attribute: false, type: String })
  selected_team_uuid: string = '';

  @property({ attribute: false })
  available_teams: Team[] = window.State.Data.teams || [];

  @property({ attribute: false, type: Boolean })
  loading: boolean = true;

  @property({ attribute: false })
  team_state: TeamState = undefined;

  @property({ attribute: false })
  project_to_tasks_map: Map<string, TeamTask[]> = new Map();

  @property({ attribute: false })
  project_to_assigned_users_map: Map<string, TeamUser[]> = new Map();

  @property({ attribute: false })
  goal_to_tasks_map: Map<string, TeamTask[]> = new Map();

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
  `);

  @property()
  page: Pages = 'one';

  @property()
  name = 'Hristijan Tofcheski';

  render() {
    return this.loading
      ? html`<div class="center-div"><paper-spinner class="loading" active></paper-spinner></div>`
      : this.selected_team_uuid.length > 0
      ? html`
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
                        .team_state=${this.team_state}
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
      api.teamState(this.selected_team_uuid).then((resp) => {
        this.team_state = this.rebuildTeamState(resp);
        console.log(this.team_state);
        this.buildMapsFromTeamState();
        console.log(this.project_to_tasks_map);
        console.log(this.project_to_assigned_users_map);
        console.log(this.goal_to_tasks_map);
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
      this.team_state.team_tasks.forEach((task) => {
        if (task.goal) {
          let goal_arr = goal_to_tasks_map.get(task.goal) || [];
          goal_arr.push(task);
          goal_to_tasks_map.set(task.goal, goal_arr);
        }
      });

      this.goal_to_tasks_map = goal_to_tasks_map;
    }
  }
}
