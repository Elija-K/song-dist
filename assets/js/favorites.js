function getFavorites() {
    if (localStorage.getItem("fav") === null) {
        localStorage.setItem("fav", JSON.stringify([]));
    }
    const fav = localStorage.getItem("fav");
    return fav;
}

function addFavorites() {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("lied");

    const titel = document.getElementsByClassName("title")[0].innerText;

    const fav = JSON.parse(localStorage.getItem("fav")) || [];

    if (fav.some(s => s.url === url)) {
        console.log("Song bereits in den Favoriten");
        window.alert("Der Song ist bereits vorhanden in deinen Favoriten.");
        return;
    }
    const nextId = Math.max(0, ...fav.map(s => s.id)) + 1;

    fav.push({
        id: nextId,
        url: url,
        titel: titel,
        artist: "Not Implemented"
    });

    localStorage.setItem("fav", JSON.stringify(fav));
}

function removeFavorites() {
    let favorites = JSON.parse(localStorage.getItem("fav")) || [];

    favorites = favorites.filter(s => s.url !== song);

    localStorage.setItem("fav", JSON.stringify(favorites));
}

function clearFavorites() {

}