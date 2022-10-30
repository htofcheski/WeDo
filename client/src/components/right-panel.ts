import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';

import { all } from '../styles/styles';
import randomColor = require('randomcolor');

import '@polymer/iron-image';

import moment = require('moment');

export interface team_user {
  uuid?: string;
  name?: string;
  picture?: string;
  email?: string;
}

@customElement('right-pannel')
export class RightPannel extends LitElement {
  @property({ type: String, attribute: false })
  icon = '';

  @property({ type: String, attribute: false })
  title = '';

  @property({ type: Boolean, attribute: false })
  back_button = false;

  @property({ type: Boolean, attribute: false })
  primary_back_button = false;

  @property({ type: Boolean, attribute: false })
  action_buttons = false;

  @property({ attribute: false })
  team: team_user[] = [
    {
      uuid: '1',
      name: 'NTurtle',
      picture: 'https://i.pinimg.com/736x/93/45/89/934589f3aa2f266b260de8bfeb3ae1ab.jpg',
      email: 'test@test.com',
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
    {
      uuid: '7',
      name: 'Tortelini',
      email: 'test3@test3.com',
    },
    {
      uuid: '8',
      name: 'Testolini',
      email: 'test3@test3.com',
    },
  ];

  @property({ attribute: false })
  calendar_moment = moment();

  @property({ attribute: false })
  tasks: any[] = [
    {
      uuid: '000999',
      name: 'Ova e primer task sto e epten dolg u slucaj da otide na nova linija. Ajde uste malu da otide pak u nova linija',
      updated: '1666887627',
    },
    { uuid: '321998', name: 'Peri dishes', updated: '1666887627' },
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
    }
    .main-container {
      width: 100%;
    }
    .icons {
      justify-content: center;
      margin: 0.7rem 0;
    }
    hr {
      display: block;
      height: 1px;
      border: 0;
      border-top: 2px solid #f2f3f5;
      margin: 0.7rem 1rem;
      padding: 0;
    }
    .buttonss {
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
    .buttonss2 {
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
      margin: 0;
      padding: 0.35rem 0.7rem;
      text-align: center;
    }
    .buttonss2:hover {
      background-color: lightgray;
    }

    .scroll-demo::-webkit-scrollbar {
      width: 10px;
    }

    .scroll-demo::-webkit-scrollbar-track {
      box-shadow: inset 0 0 10px whitesmoke;
      border-radius: 50px;
    }
    .scroll-demo::-webkit-scrollbar-thumb {
      background: silver;
      border-radius: 50px;
    }
    .scroll-demo::-webkit-scrollbar-thumb:hover {
      background: #7771eb;
    }
  `);

  render() {
    return html`
      <div class="layout vertical main-container">
        <div class="layout vertical" style="margin: 0 1.5rem;">
          <div class="layout horizontal justified" style="margin-top: 1rem;">
            <span
              ><b style="font-size: 1.1rem; color: #333;"
                >Team <span style="color: #7771eb;">(${this.team.length})</span></b
              ></span
            >
            <span class="flex"></span
            ><span
              style="color: #7771eb; font-size: 0.75rem; align-self: center;"
              @click=${() => {
                console.log('opening');
              }}
              ><b>View all</b></span
            >
          </div>
          <div class="layout horizontal icons">
            ${this.team
              .sort(this.compare)
              .slice(0, 6)
              .map((team_member) => {
                return this.renderUser(team_member, true);
              })}
          </div>
        </div>
        <hr />
        <div class="layout vertical" style="margin: 1rem 1.5rem;">
          <div class="layout horizontal justified">
            <span style="color: #555;font-size: 1.1rem;">Calendar</span>
          </div>
          <div class="layout horizontal justified" style="font-size: 1.2rem; color: #333;">
            <b>${this.calendar_moment.format('MMMM, YYYY')}</b><span class="flex"></span>
            <button
              class="buttonss"
              @click=${() => {
                this.calendar_moment = this.calendar_moment.startOf('week').subtract(7, 'days');
                this.requestUpdate();
              }}
            >
              <</button
            ><button
              class="buttonss"
              style="margin-left: 0.7rem;"
              @click=${() => {
                this.calendar_moment = this.calendar_moment.startOf('week').add(7, 'days');
                this.requestUpdate();
              }}
            >
              >
            </button>
          </div>

          <div class="layout horizontal justified" style="margin-top: 1rem;">${this.renderDates()}</div>
        </div>
        <hr />
        <div
          class="layout vertical scroll-demo"
          style="margin: 0 1.5rem; margin-top: 1rem; overflow-y: scroll; height: 100%;"
        >
          <div class="layout horizontal justified">
            <span style="color: #333;font-size: 1.2rem;"><b>Recent Task Updates</b></span>
          </div>

          <div class="layout vertical justified">${this.renderRecentTasks()}</div>
        </div>
      </div>
    `;
  }

  renderRecentTasks(): TemplateResult {
    let temp_arr: TemplateResult[] = [];

    this.tasks.forEach((task) => {
      temp_arr.push(
        html`
          <div class="layout horizontal justified">
            <button class="buttonss2" style="margin: 1rem 1rem 0 0">
              <div class="layout horizontal">
                <div
                  class="layout vertical justified"
                  style="background: ${this.color(task.uuid)}; width: 4%; height: 0.5rem; border-radius: 50%;"
                ></div>
                <div
                  class="layout vertical justified"
                  style="background: green; width: 4%; height: 0.5rem; border-radius: 50%;"
                ></div>
              </div>

              <div class="layout horizontal justified">${task.name}</div>
            </button>
          </div>
        `
      );
    });

    return html`${temp_arr.map((test) => {
      return test;
    })}`;
  }

  renderDates(): TemplateResult {
    let temp_arr: TemplateResult[] = [];

    for (let i = 0; i < 7; i++) {
      temp_arr.push(
        html`<div class="layout vertical justified">
          <div class="layout horizontal justified" style="margin-bottom: 1rem; color: #555; min-width: 1.5rem;">
            ${this.calendar_moment.startOf('week').add(i, 'days').format('ddd')}
          </div>
          <div class="layout horizontal justified" styles="min-width: 1.5rem;">
            ${this.calendar_moment.startOf('week').add(i, 'days').format('D')}
          </div>
        </div>`
      );
    }
    // let test = moment().startOf('week').add(7, 'days');

    return html`${temp_arr.map((test) => {
      return test;
    })}`;
  }

  compare(a: team_user, b: team_user): number {
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

  renderUser(user: team_user, icon_only: boolean): TemplateResult {
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

  color(seed: number | string): string {
    return randomColor({
      seed: seed,
      luminosity: 'dark',
    });
  }
}
