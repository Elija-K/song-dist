
function loadChordPro() {
    if (window.ChordSheetJS) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/assets/js/chordpro.bundle.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function loadSong() {
    await loadChordPro();
    const params = new URLSearchParams(window.location.search);
    const lied = params.get("lied");

    if (!lied) {
        document.getElementById("song").innerText = "Kein Lied angegeben.";
        return;
    }

    try {
        const response = await fetch(`/songs/${lied}.cho`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const chordPro = await response.text();

        const parser = new ChordSheetJS.ChordProParser();
        const song = parser.parse(chordPro);

        const formatter = new ChordSheetJS.HtmlTableFormatter();
        document.getElementById("song").innerHTML = formatter.format(song);
        formatter.format(song);
        const title = document.getElementsByClassName("title")[0].innerText;
        document.title = title;

    } catch (error) {
        console.error(error);

        document.getElementById("song").innerText =
            "Lied konnte nicht geladen werden.";
    }
}

loadSong();