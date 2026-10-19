async function set_extras() {
    // Get Recent Body
    const html_body = document.body.innerHTML;
    // Get Extras
    const navbar_response = await fetch(`/assets/html/navbar.html`);
    const footer_response = await fetch(`/assets/html/footer.html`);
    // Set Extras together
    const navbar = await navbar_response.text();
    const footer = await footer_response.text();
    const new_body = navbar + html_body + footer;
    // Set new Body
    document.body.innerHTML = new_body;
}

set_extras()