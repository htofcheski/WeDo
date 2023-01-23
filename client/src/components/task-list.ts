import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';

import { all } from '../styles/styles';
import randomColor = require('randomcolor');

import '@polymer/iron-image/iron-image';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import '@polymer/paper-progress/paper-progress';
import '@polymer/paper-tabs/paper-tab';
import '@polymer/paper-tabs/paper-tabs';

import '@vaadin/vaadin-button/vaadin-button';

import moment = require('moment');
import { TeamTask } from '../types';

export interface CHK_TEAM_USER {
  uuid?: string;
  name?: string;
  picture?: string;
  email?: string;
}

@customElement('task-list')
export class LeftPanel extends LitElement {
  @property({ attribute: false })
  page_name: string = 'My Tasks';

  @property({ attribute: false })
  tasks: any[] = [
    {
      uuid: '000999',
      name: 'Ova e primer task sto e epten dolg u slucaj da otide na nova linija. Ajde uste malu da otide pak u nova linija',
      updated: '1666887627',
      status: 1,
    },
    { uuid: '321998', name: 'test21123', updated: '1666887627', status: 0 },
    { uuid: '654997', name: 'test 3', updated: '1666887627', status: 1 },
    { uuid: '987996', name: 'test 4', updated: '1666887627', status: 2 },
    { uuid: '789995', name: 'test 5', updated: '1666887627', status: 1 },
    { uuid: '456994', name: 'test 6', updated: '1666887627', status: 0 },
    { uuid: '123993', name: 'test 73', updated: '1666887627', status: 0 },
    { uuid: '111111', name: 'test 711', updated: '1666887627', status: 2 },
    { uuid: '333333', name: 'test 72', updated: '1666887627', status: 1 },
    { uuid: '555555', name: 'test 32', updated: '1666887627', status: 0 },
  ];

  @property({ attribute: false })
  team_state: any = undefined;

  @property({ attribute: false })
  project_to_tasks_map: Map<string, TeamTask[]> = new Map();

  @property({ attribute: false })
  team_tasks_no_project: TeamTask[] = [];

  @property({ attribute: false })
  is_expanded_map: Map<string, boolean> = new Map();

  @property({ attribute: false })
  hide_team_tasks_no_project: boolean = false;

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
    .container {
      margin-top: 1.5rem;
    }
    .container[first] {
      margin-top: 0.5rem;
    }
    .container[last] {
      padding-bottom: 1.5rem;
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
    paper-progress.red {
      --paper-progress-active-color: var(--theme-primary);
      --paper-progress-height: 0.5rem;
    }
    .progress {
      font-weight: 500;
      color: #333;
    }
    .expanded-part {
      background: white;
      margin-top: 1.5rem;
      box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
      border-radius: 0.8rem;
      overflow-y: scroll;
      max-height: 20rem;
    }
    .header {
      font-size: 1.2rem;
      font-weight: 600;
      color: rgb(51, 51, 51);
      margin: 1.5rem 0.2rem;
    }
    .paper-tabs {
      --paper-tabs-selection-bar-color: var(--theme-primary);
    }
    .task-item {
      margin: 1.5rem 0 1.5rem 2rem;
      font-size: 1.1rem;
      font-weight: 500;
    }
    .kocka-status {
      margin-right: 1rem;
      width: 1rem;
      height: 1rem;
      align-self: center;
      border-radius: 0.2rem;
    }
    .kocka-status[open] {
      background: gray;
    }
    .kocka-status[active] {
      background: blue;
    }
    .kocka-status[done] {
      background: green;
    }
    .add-button {
      height: 100%;
      justify-content: center;
      padding: 0 1.2rem;
      border-radius: 0 0.8rem 0.8rem 0;
      transition: 0.3s;
    }
    .add-button:hover {
      background: var(--theme-primary);
      box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
      color: white;
    }
  `);

  render() {
    return html`<div class="layout vertical main">
      <span class="header">My Tasks</span>
      <div class="layout horizontal">
        <div class="flex" style="margin-top: 0.6rem;">
          <paper-tabs class="paper-tabs" selected="0">
            <paper-tab>Open</paper-tab>
            <paper-tab>Past</paper-tab>
          </paper-tabs>
        </div>
        <div class="flex" style="flex: 3"></div>
      </div>
      <hr style="margin-top: 0;" class="hr-style" />

      ${this.team_state?.team_projects?.map((project, index) => {
        return html`
          <div
            class="layout vertical container"
            ?first=${index === 0}
            ?last=${index === this.team_state?.team_projects?.length - 1 && this.team_tasks_no_project.length === 0}
          >
            <div class="layout horizontal justified project-summary">
              <div class="flex" style="flex: 0.08;"></div>
              <div
                class="expand-project unselectable"
                @click=${() => {
                  let elem = this.shadowRoot.getElementById(project.uuid);
                  if (elem) {
                    if (elem.hasAttribute('hidden')) {
                      elem.removeAttribute('hidden');
                      this.is_expanded_map.set(project.uuid, true);
                    } else {
                      elem.setAttribute('hidden', 'true');
                      this.is_expanded_map.set(project.uuid, false);
                    }
                  }

                  this.requestUpdate('is_expanded_map');
                  console.log(this.is_expanded_map);
                  console.log('expanding.');
                }}
              >
                <iron-icon
                  style="color: #333;width: 4rem; height: 4rem;"
                  icon=${this.is_expanded_map.get(project.uuid) ? 'icons:arrow-drop-up' : 'icons:arrow-drop-down'}
                ></iron-icon>
              </div>
              <div>
                <div class="layout vertical">
                  <span style="font-size: 1.1rem; font-weight: 500;"
                    >${project.name}<vaadin-button
                      @click=${() => {
                        this.dispatchEvent(
                          new CustomEvent('test', { detail: { type: 'update-project', project_uuid: project.uuid } })
                        );
                      }}
                      theme="primary"
                      >EDIT</vaadin-button
                    ></span
                  ><span>${project.description}</span>
                </div>
              </div>
              <div class="flex"></div>
              <div>Icons</div>
              <div class="flex"></div>
              <div class="layout vertical progress">
                <div class="layout horizontal justified" style="margin-bottom: 0.5rem;">
                  <span>Progress</span>
                  <span>80%</span>
                </div>
                <div><paper-progress value="80" min="0" max="100" class="red"></paper-progress></div>
              </div>
              <div class="flex" style="flex: 0.16;"></div>
              <div class="layout vertical add-button"><iron-icon icon="icons:add"></iron-icon></div>
            </div>
            <div
              id=${project.uuid}
              hidden
              class="layout vertical justified expanded-part"
              style=${'height: ' +
              (
                (this.project_to_tasks_map?.get(project.uuid)?.length > 0
                  ? this.project_to_tasks_map?.get(project.uuid)?.length
                  : 1) * 4.5
              ).toString() +
              'rem;'}
            >
              ${this.project_to_tasks_map?.get(project.uuid)?.length > 0
                ? this.project_to_tasks_map?.get(project.uuid)?.map((task) => {
                    return html`<div class="layout horizontal task-item">
                      <div
                        class="kocka-status"
                        ?open=${task.state === 0}
                        ?active=${task.state === 1}
                        ?done=${task.state === 2}
                      ></div>
                      ${task.name}
                    </div>`;
                  })
                : html`<div class="layout horizontal task-item" style="font-weight: 400;">No tasks here!</div>`}
            </div>
          </div>
        `;
      })}
      ${this.team_tasks_no_project?.length > 0
        ? html` <div class="layout vertical container" last>
            <div class="layout horizontal justified" style="margin: 0 1rem;">
              <div>TITLE</div>
              <div>
                <paper-icon-button
                  icon="add-circle"
                  style="color: var(--theme-primary);"
                  @click=${() => {
                    this.dispatchEvent(new CustomEvent('test', { detail: { type: 'create-project' } }));
                  }}
                ></paper-icon-button>
              </div>
              <div>
                <paper-icon-button
                  icon="delete"
                  style="color: var(--theme-primary);"
                  @click=${() => {
                    this.hide_team_tasks_no_project = !this.hide_team_tasks_no_project;
                  }}
                ></paper-icon-button>
              </div>
            </div>
            <div
              ?hidden=${this.hide_team_tasks_no_project}
              class="layout vertical justified expanded-part"
              style=${'height: ' + (this.team_tasks_no_project.length * 4.5).toString() + 'rem;'}
            >
              ${this.team_tasks_no_project.map((task) => {
                return html`<div class="layout horizontal task-item">
                  <div
                    class="kocka-status"
                    ?open=${task.state === 0}
                    ?active=${task.state === 1}
                    ?done=${task.state === 2}
                  ></div>
                  ${task.name}
                </div>`;
              })}
            </div>
          </div>`
        : html``}
    </div> `;
  }
}
