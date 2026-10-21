function createPlaylist(name) {
    // Create a Playlist
    localStorage.setItem("jspl_" + name, JSON.stringify([]))
}

function addtoPlaylist(url, titel, artist, name) {
    const playlist_name = "jspl_" + name
    // Add a Song to a Playlist
    // Beispiel: [{ titel: "Boxenstopp 2026 10 18", songs: [ { id: 1, url: "Gott-isch-mit-uus", titel: "Gott isch mit üüs", artist: "Eden Music" }, { id: 2, url: "jesus-sohn-vo-gott", titel: "Jesus, Sohn vo Gott", artist: "Ligu Lehm" }, { id: 3, url: "abba", titel: "Abba", artist: "Eden Music"}]}]
    // const titel = "Boxenstopp 2026 10 18";
    // const songs = [{ id: 1, url: "Gott-isch-mit-uus", titel: "Gott isch mit üüs", artist: "Eden Music" }, { id: 2, url: "jesus-sohn-vo-gott", titel: "Jesus, Sohn vo Gott", artist: "Ligu Lehm" }, { id: 3, url: "abba", titel: "Abba", artist: "Eden Music"}];
    // localStorage.setItem(titel, JSON.stringify(songs));
    
    const key = "jspl_" + name;
    const playlist = JSON.parse(localStorage.getItem(key) || "[]");

    if (playlist.some(s => s.url === url)) {
        console.log("Song bereits vorhanden");
        window.alert("Dieser Song ist schon vorhanden");
        return;
    }

    const nextId = Math.max(0, ...playlist.map(s => s.id)) + 1;

    playlist.push({
        id: nextId,
        url: url,
        titel: titel,
        artist: artist
    });

    localStorage.setItem(key, JSON.stringify(playlist));
}

function removefromPlaylist(song, name) {
    const key = "jspl_" + name;

    let playlist = JSON.parse(localStorage.getItem(key)) || [];

    // Song anhand der URL entfernen
    playlist = playlist.filter(s => s.url !== song);

    // Aktualisierte Playlist speichern
    localStorage.setItem(key, JSON.stringify(playlist));
}

function deletePlaylist(name) {
    // Delete a Playlist
    const playlist_name = "jspl_" + name
}

function sharePlaylist(name) {
    // Shares a Playlist with a File
    const playlist_name = "jspl_" + name
}

function importPlaylist(name, value) {
    // Import a Playlist with a File
    const playlist_name = "jspl_" + name
}

function listPlaylist() {
    // List all Playlists

    const playlists = Object.keys(localStorage)
        .filter(key => key.startsWith("jspl_"))
        .map(key => key.slice(5));

    return(playlists)
    }