import { LitElement, html, customElement, property, TemplateResult, css } from 'lit-element';

@customElement('wedo-app')
export class WeDo extends LitElement {
  static styles = css`
    p {
      color: blue;
    }
  `;

  @property()
  name = 'Hristijan';

  render() {
    return html`<p>Hello ${this.name}, this works!</p>`;
  }
}
