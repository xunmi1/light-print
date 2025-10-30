class TimeNow extends HTMLElement {
  #timer;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `
      <style>
        :host { display: block } .time { font-family: sans-serif }
        ::slotted([slot="label"])::after { content: ':'; margin: 0 4px 0 2px; }
      </style>
      <slot name="label"></slot><span class="time">${this.now}</span>
    `.trim();
  }

  get now() {
    return new Date().toLocaleString();
  }

  connectedCallback() {
    const time = this.shadowRoot.querySelector('.time');
    this.#timer = setInterval(() => {
      const now = this.now;
      time.textContent = now;
      this.title = now;
    }, 1000);
  }

  disconnectedCallback() {
    clearInterval(this.#timer);
    this.#timer = null;
  }
}

window.customElements.define('time-now', TimeNow);
