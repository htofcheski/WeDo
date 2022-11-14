import { LitElement, html, customElement, property, TemplateResult, css } from 'lit-element';

import '@polymer/iron-pages/iron-pages';

import { all } from './styles/styles';
import './components/right-panel';
import './components/top-header';
import './components/left-panel';
import './components/task-list';

type Pages = 'one' | 'two' | 'three';

@customElement('wedo-app')
export class WeDo extends LitElement {
  static styles = all.concat(css`
    .wedo-page,
    iron-pages {
      width: 100%;
      height: 100%;
    }
  `);

  @property()
  page: Pages = 'one';

  @property()
  name = 'Hristijan Tofcheski';

  render() {
    return html`<div class="layout horizontal" style="height: 100%;">
      <left-panel></left-panel>
      <div class="layout vertical" style="width: 100%;">
        <top-header></top-header>
        <div class="layout horizontal" style="width: 100%; height: 90%">
          <div
            class="layout horizontal"
            style="width: 75%;outline: 0.2rem solid #f2f3f5; z-index: 999; background: white;"
          >
            <iron-pages selected=${this.page} attr-for-selected="page">
              <div class="wedo-page" page="one"><task-list></task-list></div>
              <div class="wedo-page" page="two"></div>
              <div class="wedo-page" page="three"></div>
            </iron-pages>
          </div>
          <div class="layout horizontal" style="width: 25%;"><right-panel></right-panel></div>
        </div>
      </div>
    </div> `;
  }
}
