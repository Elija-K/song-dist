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

    // Do not replace document.body.innerHTML: that would remove page state,
    // form values, and event listeners, including settings controls.
    document.body.insertAdjacentHTML('afterbegin', navbar);
    document.body.insertAdjacentHTML('beforeend', footer);

    // Settings and other page scripts can initialize after the navbar exists.
    document.dispatchEvent(new CustomEvent('extrasloaded'));
}

set_extras().catch((error) => {
    console.error('Unable to load navbar and footer:', error);
});