import { LitElement, html, customElement, property, TemplateResult, css } from 'lit-element';

import { all } from './styles/styles';
import './components/right-panel';
import './components/top-header';
import './components/left-panel';

@customElement('wedo-app')
export class WeDo extends LitElement {
  static styles = all.concat(css``);

  @property()
  name = 'Hristijan Tofcheski';

  render() {
    return html`<div class="layout horizontal" style="height: 100%;">
      <left-panel></left-panel>
      <div class="layout vertical" style="width: 100%;">
        <top-header></top-header>
        <div class="layout horizontal" style="width: 100%; height: 90%">
          <div class="layout horizontal" style="width: 80%;"><div style="background: orange; width: 100%;"></div></div>
          <div class="layout horizontal" style="width: 20%;"><right-panel></right-panel></div>
        </div>
      </div>
    </div> `;
  }
}
