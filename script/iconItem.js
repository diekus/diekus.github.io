class IconItem extends HTMLElement {
  static get observedAttributes() {
    return ['icon-src', 'text', 'link', 'link-color'];
  }
  constructor() {
    super();
    
    const shadow = this.attachShadow({mode:'open'});
    const template = 
      `<template id="icon-item-template">
        <style>
          .icon-default {
            padding-bottom: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .centered {
            text-align:center;
          }
          #icon-image {
            width: 5em;
            margin: 1em;
            border-radius: 50%;
            box-shadow:0;
            transition: box-shadow .3s, transform .3s;
          }
          .icon-default:hover #icon-image {
            box-shadow: 0px 3px 15px -3px var(--card-shadow);
            transform: translateY(-.1rem);
          }
          #link {
            background: -webkit-linear-gradient(90deg, var(--tint) 0%, var(--accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-decoration: none;
          }
        </style>
        <div class="icon-default">
          <slot name="icon-image"><img id="icon-image" src="#" loading="lazy"></slot>
          <strong><slot name="icon-title" class="centered" id="ico-title"><a href="#" id="link">title</a></slot></strong>
        </div>
      </template>`;
      shadow.innerHTML = template;
      const templateContent = shadow.getElementById('icon-item-template').content;
      shadow.appendChild(templateContent.cloneNode(true));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch(name) {
      case 'icon-src':
      this.shadowRoot.querySelector('#icon-image').setAttribute('src', newValue);
        break;
      case 'text':
        this.shadowRoot.querySelector('#link').textContent = newValue;
        break;
      case 'link':
        this.shadowRoot.querySelector('#link').setAttribute('href', newValue);
        break;
      case 'link-color':
        this.shadowRoot.querySelector('#link').setAttribute('style', `color:${newValue}`);
        break;
      }
  }
}

customElements.define('icon-item', IconItem);