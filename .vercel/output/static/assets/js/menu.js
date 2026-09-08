const btn = document.getElementById('btn-menu');
const menu = document.getElementById('menu');
btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
});
