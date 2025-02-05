
const scrollToggle = () => {
    const btnScroll = document.querySelector('.btnScroll');
    btnScroll.addEventListener('click', scrollToggle);

    const mainDiv = document.querySelector('.main');
    mainDiv.scroll(800, 0);
    alert('hola lolos');
}