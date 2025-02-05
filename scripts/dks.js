let curSection = 1;
const mainDiv = document.querySelector('.main');

const scrollToggle = () => {
    let sectionWidth = window.innerWidth;
    let numSections = Math.floor(mainDiv.scrollWidth / sectionWidth);
    mainDiv.scroll(curSection * sectionWidth, 0);
    curSection != numSections-1 ? curSection += 1 : curSection = 0 ;
}

const btnScroll = document.querySelector('.btnScroll');
btnScroll.addEventListener('click', scrollToggle);