async function set_extras() {
    const [navbar_response, footer_response] = await Promise.all([
        fetch('/assets/html/navbar.html'),
        fetch('/assets/html/footer.html')
    ]);

    if (!navbar_response.ok || !footer_response.ok) {
        throw new Error('Failed to load shared page elements.');
    }

    const [navbar, footer] = await Promise.all([
        navbar_response.text(),
        footer_response.text()
    ]);

    document.body.insertAdjacentHTML('afterbegin', navbar);
    document.body.insertAdjacentHTML('beforeend', footer);

    document.dispatchEvent(new CustomEvent('extrasloaded'));
}

function change_dark_light_mode() {
    var color_mode = localStorage.getItem('color-mode');

    if (color_mode === 'dark') {
        localStorage.setItem('color-mode', 'light');
    } else {
        localStorage.setItem('color-mode', 'dark');
    }
    set_dark_light_mode();
}

function set_dark_light_mode() {
    var color_mode = localStorage.getItem('color-mode');

    document.body.classList.toggle(
        'dark-mode', color_mode === 'dark'
    );
}

document.addEventListener('DOMContentLoaded', function () {
    set_dark_light_mode();

    set_extras().catch((error) => {
        console.error('Unable to load navbar and footer:', error);
    });
});