import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {diagramData} from './types';
import {createPieChart} from './utils';

/**
 * An example element.
 *
 * @fires count-changed - Indicates when the count changes
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('my-element')
export class MyElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      max-width: 800px;
    }

    button {
      margin-bottom: 12px;
    }
  `;

  @property()
  name = 'Diagram';

  @property()
  data: diagramData = [
    {name: 'first', value: 10},
    {name: 'second', value: 20},
    {name: 'third', value: 30},
    {name: 'second', value: 20},
    {name: 'third', value: 30},
  ];

  override render() {
    return html`
      <h1>${this.printTitle(this.name)}!</h1>
      <button @click=${this._generateData} part="button">Generate data</button>
      <div id="chart"></div>
      <slot></slot>
    `;
  }

  override updated() {
    const container = this.renderRoot.querySelector('#chart');
    if (container) {
      container.innerHTML = ''; //clear previous chart
      container.appendChild(createPieChart(this.data));
    }
  }

  private _generateData() {
    const count = Math.floor(Math.random() * 7) + 2; //2 to 8 records
    const newData: diagramData = [];

    for (let i = 0; i < count; i++) {
      newData.push({
        name: `Item ${i + 1}`,
        value: (Math.floor(Math.random() * 20) + 1) * 5, //random value 5 to 100 with a step of 5
      });
    }

    this.data = newData;
  }

  printTitle(name: string): string {
    return `${name} diagram`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
