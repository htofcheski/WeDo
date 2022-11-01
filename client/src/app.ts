import { LitElement, html, customElement, property, TemplateResult, css } from 'lit-element';

import { all } from './styles/styles';
import './components/right-panel';

@customElement('wedo-app')
export class WeDo extends LitElement {
  static styles = all.concat(css``);

  @property()
  name = 'Hristijan Tofcheski';

  render() {
    return html`<right-panel></right-panel>`;
  }
}
