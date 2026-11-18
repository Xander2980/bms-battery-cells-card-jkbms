// Minimal Home Assistant stand-in for screenshots of the card (no HA needed).
// Bundled by render.mjs with esbuild; the page then calls window.renderCards(...).
import { LitElement, html, css } from 'lit';
import * as mdi from '@mdi/js';

// The card takes LitElement from HA's "ha-lit-element".
LitElement.prototype.html = html;
LitElement.prototype.css = css;
customElements.define('ha-lit-element', class extends LitElement {});

// <ha-icon icon="mdi:..."> with the real Material Design Icons
const toMdi = (name) => 'mdi' + String(name || '').replace(/^mdi:/, '').split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
customElements.define('ha-icon', class extends HTMLElement {
  static get observedAttributes() { return ['icon']; }
  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }
  render() {
    const path = mdi[toMdi(this.getAttribute('icon'))] || mdi.mdiHelpCircleOutline;
    this.style.display = 'inline-flex';
    this.style.width = 'var(--mdc-icon-size, 24px)';
    this.style.height = 'var(--mdc-icon-size, 24px)';
    this.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="${path}"/></svg>`;
  }
});

// <ha-card> like the HA default theme
customElements.define('ha-card', class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML =
      '<style>:host{display:block;background:var(--card-background-color);border-radius:12px;border:1px solid var(--divider-color);box-sizing:border-box}</style><slot></slot>';
  }
});

window.renderCards = async ({ cards, states, language = 'de', columns = 1, width = 400 }) => {
  await import('./card.js');
  const Card = customElements.get('bms-battery-cells-card-jkbms');
  const grid = document.getElementById('grid');
  grid.style.gridTemplateColumns = `repeat(${columns}, ${width}px)`;
  const hass = { states, locale: { language }, language, callService() {} };
  for (const config of cards) {
    const el = new Card();
    grid.appendChild(el);
    el.setConfig(config);
    el.hass = hass;
  }
  await new Promise(r => setTimeout(r, 1500));
  return true;
};
