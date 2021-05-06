class ItemCard extends HTMLElement{
    static get observedAttributes() {
        return ['img-src'];
    }
    constructor(){
        super();
        const shadow = this.attachShadow({mode:'open'});
        const template = `<template id="item-card-temp">
            <style>
                .item-card {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    grid-template-rows: 1fr auto auto;
                    box-shadow:0;
                    transition: box-shadow .3s, transform .3s;
                }
                .item-card:hover {
                    box-shadow: 0px 3px 15px -3px var(--card-shadow);
                    transform: translateY(-.1rem);
                }
                .item-picture-div {
                    width: 100%;
                    grid-row-start: 1;
                    grid-row-end: 2;
                    grid-column-start: 1;
                    grid-column-end: -1;
                    overflow: hidden;
                }
                .item-picture {
                    width:100%;
                    object-fit: cover;
                }
                .item-title {
                    grid-row-start: 2;
                    grid-row-end: 3;
                    grid-column-start: 1;
                    grid-column-end: -1;
                    margin: 1em .7em .5em .7em;
                    
                }
                .item-descrip {
                    grid-row-start: 3;
                    grid-row-end: 4;
                    grid-column-start: 1;
                    grid-column-end: -1;
                    margin: .1em .7em 1em .7em; 
                    line-height: 1.4em;
                }
            </style>
            <div class="item-card">
                <div class="item-picture-div"><img src="image/default.jpg" class="item-picture" loading="lazy"></div>
                    <h3 class="item-title"><slot name="item-title">Default Title</slot></h3>
                <p class="item-descrip"><slot name="item-descrip">Default item summary</slot></p>
            </div>
        </template>`;
    shadow.innerHTML = template;
    const templateContent = shadow.getElementById('item-card-temp').content;
    shadow.appendChild(templateContent.cloneNode(true));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            case 'img-src':
                this.shadowRoot.querySelector('.item-picture').setAttribute('src', newValue);
            break;
        }
    }
}

customElements.define('item-card', ItemCard);