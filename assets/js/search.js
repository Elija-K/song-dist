
 // JustSongs – Suche, Favoriten- und Playlist-Übersicht
let allSongs = [];
let songLoadPromise = null;

function songLink(identifier) {
    const slug = String(identifier || '').trim().replace(/\.cho$/i, '');

    // Beide URL-Parameter werden unterstützt.
    const params = new URLSearchParams({
        lied: slug,
        song: slug
    });

    return `/song.html?${params}`;
}

function makeSongItem(identifier, title) {
    const li = document.createElement('li');
    li.className = 'song-li';

    const a = document.createElement('a');
    a.className = 'song-tag';
    a.href = songLink(identifier);
    a.textContent = title || identifier;

    li.appendChild(a);

    return li;
}

function readArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.warn(`Ungültige Daten in localStorage (${key}):`, error);
        return [];
    }
}


// ================= SONG-SUCHE =================

async function list_song() {
    const list = document.querySelector('#search-list');
    const input = document.querySelector('#search, input[type="search"]');

    if (!list) return;

    // Eventhandler sofort registrieren.
    if (input && !input.dataset.songSearchInitialized) {
        input.addEventListener('input', () => {
            displaySongs(input.value);
        });

        input.dataset.songSearchInitialized = 'true';
    }

    if (songLoadPromise) return songLoadPromise;

    list.textContent = 'Songs werden geladen...';

    songLoadPromise = (async () => {
        const response = await fetch('/songs/manifest.json');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: manifest.json`);
        }

        const files = await response.json();

        if (!Array.isArray(files)) {
            throw new Error('Das Song-Manifest muss ein Array sein.');
        }

        // Ungültige und doppelte Dateien entfernen.
        const uniqueFiles = [...new Set(
            files
                .filter(file =>
                    typeof file === 'string' &&
                    /^[^/\\]+\.cho$/i.test(file.trim())
                )
                .map(file => file.trim())
        )];

        // ChordPro-Titel laden.
        const entries = await Promise.all(
            uniqueFiles.map(async filename => {
                let title = filename.replace(/\.cho$/i, '');

                try {
                    const result = await fetch(
                        `/songs/${encodeURIComponent(filename)}`
                    );

                    if (!result.ok) {
                        throw new Error(`HTTP ${result.status}`);
                    }

                    const content = await result.text();

                    const match = content.match(
                        /^\s*\{\s*(?:title|t)\s*:\s*([^}]+?)\s*\}\s*$/im
                    );

                    if (match) {
                        title = match[1].trim();
                    }
                } catch (error) {
                    console.warn(
                        `Titel von ${filename} nicht lesbar:`,
                        error
                    );
                }

                return { filename, title };
            })
        );

        // Alphabetisch sortieren.
        allSongs = entries.sort((a, b) =>
            a.title.localeCompare(b.title, 'de')
        );

        displaySongs(input?.value || '');
        list_favorites();
    })();

    try {
        await songLoadPromise;
    } catch (error) {
        songLoadPromise = null;

        console.error('Songs konnten nicht geladen werden:', error);
        list.textContent = 'Songs konnten nicht geladen werden.';
    }
}


// ================= SONGS ANZEIGEN =================

function displaySongs(searchText = '') {
    const list = document.querySelector('#search-list');
    const counter = document.querySelector('#search-counter');

    if (!list) return;

    const query = String(searchText).trim().toLocaleLowerCase('de');

    const found = allSongs.filter(song =>
        song.title.toLocaleLowerCase('de').includes(query)
    );

    const fragment = document.createDocumentFragment();

    found.forEach(song => {
        fragment.appendChild(
            makeSongItem(song.filename, song.title)
        );
    });

    list.replaceChildren(fragment);

    if (!found.length) {
        list.textContent = 'Keine Songs gefunden.';
    }

    if (counter) {
        counter.textContent = `Deine Suche - ${found.length}`;
    }
}


// ================= FAVORITEN =================

// favorites.js speichert die Favoriten unter localStorage['fav'].
// Format:
// [
//   {
//     id: 1,
//     url: 'song-slug',
//     titel: 'Songtitel',
//     artist: '...'
//   }
// ]

function list_favorites() {
    const list = document.getElementById('favoriten-list');
    const counter = document.getElementById('favorites-counter');

    if (!list) return;

    const favorites = readArray('fav');
    const fragment = document.createDocumentFragment();
    const seen = new Set();

    for (const favorite of favorites) {
        if (!favorite || typeof favorite !== 'object') {
            continue;
        }

        const identifier = String(favorite.url ?? '').trim();

        if (!identifier) continue;

        const normalized = identifier.replace(/\.cho$/i, '');

        // Keine doppelten Favoriten anzeigen.
        if (seen.has(normalized)) continue;

        seen.add(normalized);

        // Gespeicherten Titel verwenden.
        // Falls keiner vorhanden ist, aus Songdaten ermitteln.
        const title =
            typeof favorite.titel === 'string' &&
            favorite.titel.trim()
                ? favorite.titel.trim()
                : allSongs.find(song =>
                    song.filename.replace(/\.cho$/i, '') === normalized
                )?.title || normalized;

        fragment.appendChild(
            makeSongItem(normalized, title)
        );
    }

    list.replaceChildren(fragment);

    if (seen.size === 0) {
        list.textContent = 'Keine Favoriten';
    }

    if (counter) {
        counter.textContent = `Deine Favoriten - ${seen.size}`;
    }
}


// ================= PLAYLISTS =================


function list_playlist() {
    const list = document.querySelector('#playlist-list');
    const counter = document.querySelector('#playlist-counter');

    if (!list) return;

    const playlistKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('jspl_'))
        .sort((a, b) => a.localeCompare(b, 'de'));

    const fragment = document.createDocumentFragment();

    playlistKeys.forEach(key => {
        const name = key.substring(5);
        let songs = [];

        try {
            const data = JSON.parse(localStorage.getItem(key) || '[]');

            // Unterstützt direkte und verschachtelte Songlisten
            if (Array.isArray(data)) {
                songs = data.flatMap(entry => {
                    if (Array.isArray(entry?.songs)) {
                        return entry.songs;
                    }
                    return [entry];
                });
            } else if (Array.isArray(data?.songs)) {
                songs = data.songs;
            }

        } catch (error) {
            console.error(`Playlist ${name} konnte nicht gelesen werden:`, error);
        }

        console.log(`Playlist "${name}":`, songs);

        const section = document.createElement('div');
        section.className = 'playlist-entry';

        const heading = document.createElement('h3');
        heading.textContent = `${name} (${songs.length})`;
        section.appendChild(heading);

        const ul = document.createElement('ul');
        const seen = new Set();

        songs.forEach(song => {
            const id = typeof song === 'string'
                ? song
                : song?.url;

            if (typeof id !== 'string' || !id.trim()) return;

            const normalized = id.trim().replace(/\.cho$/i, '');

            if (seen.has(normalized)) return;
            seen.add(normalized);

            const title = song?.titel || song?.title ||
                allSongs.find(s =>
                    s.filename.replace(/\.cho$/i, '') === normalized
                )?.title || normalized;

            ul.appendChild(makeSongItem(normalized, title));
        });

        if (ul.children.length > 0) {
            section.appendChild(ul);
        } else {
            const empty = document.createElement('p');
            empty.textContent = 'Keine Songs in dieser Playlist.';
            section.appendChild(empty);
        }

        fragment.appendChild(section);
    });

    list.replaceChildren(fragment);

    if (counter) {
        counter.textContent = `Deine Playlists - ${playlistKeys.length}`;
    }

    if (playlistKeys.length === 0) {
        list.textContent = 'Keine Playlists gefunden.';
    }
}


// ================= INITIALISIERUNG =================

function initializeSongLists() {
    list_song();
    list_favorites();
    list_playlist();
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializeSongLists,
        { once: true }
    );
} else {
    initializeSongLists();
}


// ================= STORAGE EVENTS =================

// Änderungen aus anderen Browser-Tabs erkennen.
window.addEventListener('storage', event => {
    if (event.key === 'fav') {
        list_favorites();
    }

    if (
        event.key === null ||
        event.key?.startsWith('jspl_')
    ) {
        list_playlist();
    }
});