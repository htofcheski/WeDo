import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';

import { all } from '../styles/styles';
import randomColor = require('randomcolor');

import '@polymer/iron-image/iron-image';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-icons/hardware-icons';
import '@polymer/paper-progress/paper-progress';

import moment = require('moment');

export interface CHK_TEAM_USER {
  uuid?: string;
  name?: string;
  picture?: string;
  email?: string;
}

@customElement('task-list')
export class LeftPanel extends LitElement {
  @property({ attribute: false })
  page_name: string = 'My Projects';

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
      overflow: hidden;
      background: white;
    }
    .main {
      background: white;
      width: 100%;
      margin: 0 2rem;
    }
    .project-summary {
      margin-top: 2rem;
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
      height: 10rem;
      background: white;
      margin-top: 1rem;
      box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    }
  `);

  render() {
    return html`<div class="layout vertical main">
      <div class="layout vertical">
        <div class="layout horizontal justified project-summary">
          <div class="flex" style="flex: 0.08;"></div>
          <div
            class="expand-project"
            @click=${() => {
              let elem = this.shadowRoot.getElementById('project-uuid');
              if (elem) {
                if (elem.hasAttribute('hidden')) {
                  elem.removeAttribute('hidden');
                } else {
                  elem.setAttribute('hidden', 'true');
                }
              }

              console.log('expanding.');
            }}
          >
            <iron-icon style="color: #333;width: 4rem; height: 4rem;" icon="hardware:keyboard-arrow-down"></iron-icon>
          </div>
          <div>
            <div class="layout vertical">
              <span style="font-size: 1.1rem; font-weight: 500;">Project Name</span><span>project desc</span>
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
          <div class="flex" style="flex: 0.08;"></div>
        </div>
        <div id="project-uuid" hidden class="layout horizontal justified expanded-part">This is the part for tasks</div>
      </div>
    </div>`;
  }
}
