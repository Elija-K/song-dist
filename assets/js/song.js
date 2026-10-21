
"use strict";

// Global variables
let originalSong = null;
let transposeSteps = 0;
let chordsHidden = false;
const MIN_TRANSPOSE_STEPS = -11;
const MAX_TRANSPOSE_STEPS = 11;

// Load the ChordPro Asset
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

// Load the Playlist Asset
function loadPlaylistAsset() {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/assets/js/playlist.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load the Song in the HTML
async function loadSong() {
    const songElement = document.getElementById("song");

    try {
        await loadChordPro();

        const params = new URLSearchParams(window.location.search);
        const lied = params.get("lied");

        if (!lied) {
            songElement.innerText = "Kein Lied angegeben.";
            return;
        }

        const response = await fetch(
            `/songs/${encodeURIComponent(lied)}.cho`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const chordPro = await response.text();
        const parser = new ChordSheetJS.ChordProParser();

        originalSong = parser.parse(chordPro);
        transposeSteps = 0;

        renderSong();
        setShortlinks();
        loadMusic();

        const title = songElement.querySelector(".title");
        if (title) {
            document.title = title.innerText;
        }

    } catch (error) {
        console.error(error);
        songElement.innerText = "Lied konnte nicht geladen werden.";
    }
}

// Render the Song
function renderSong() {
    if (!originalSong) return;

    const formatter = new ChordSheetJS.HtmlTableFormatter();

    // Always transpose from the original song
    const song = originalSong.transpose(transposeSteps);

    document.getElementById("song").innerHTML =
        formatter.format(song);

    // Restore chord visibility
    if (chordsHidden) {
        const chords = document.getElementsByClassName("chord");

        for (const chord of chords) {
            chord.style.display = "none";
        }
    }

    // Update transpose counter (optional)
    const counter = document.getElementById("transpose-steps");

    if (counter) {
        counter.innerText =
            transposeSteps > 0
                ? `+${transposeSteps}`
                : transposeSteps;
    }
}

// Transpose the Song
function transpose(type) {
    if (!originalSong) return;

    if (type === "l") {
        // Lower by one semitone
        transposeSteps = Math.max(MIN_TRANSPOSE_STEPS, transposeSteps - 1);
    } else if (type === "h") {
        // Higher by one semitone
        transposeSteps = Math.min(MAX_TRANSPOSE_STEPS, transposeSteps + 1);
    } else {
        return;
    }
    const transposeNum = document.getElementById("transpose-num");

    if (transposeNum) {
        transposeNum.innerText = transposeSteps;
    }
    renderSong();
}

// Reset Transposition
function resetTranspose() {
    if (!originalSong) return;

    transposeSteps = 0;

    const transposeNum = document.getElementById("transpose-num");

    if (transposeNum) {
        transposeNum.innerText = transposeSteps;
    }

    renderSong();
}

// Hide and Show Chords
function switchChords() {
    chordsHidden = !chordsHidden;
    renderSong();
}

// Set Links for YT/Spotify

function setShortlinks() {
    const metadata = originalSong?.metadata?.metadata || {};

    const yt_link = (metadata.youtube || "").replace(/^"|"$/g, "");
    const spotify_link = (metadata.spotify || "").replace(/^"|"$/g, "");

    checkShortlinks(yt_link, spotify_link);
}

// Hide Shortlinks when not existing
function checkShortlinks(youtube, spotify) {
    const youtubeButton = document.getElementById("youtube");
    const spotifyButton = document.getElementById("spotify");

    if (youtubeButton) {
        if (youtube === "") {
            youtubeButton.disabled = true;
            youtubeButton.classList.add("disabled");
            youtubeButton.removeAttribute("href");
            youtubeButton.onclick = null;
        } else {
            if (youtubeButton.tagName.toLowerCase() === "a") {
                youtubeButton.href = youtube;
            } else {
                youtubeButton.onclick = () => window.open(youtube, "_blank", "noopener,noreferrer");
            }
            youtubeButton.disabled = false;
            youtubeButton.classList.remove("disabled");
        }
    }

    if (spotifyButton) {
        if (spotify === "") {
            spotifyButton.disabled = true;
            spotifyButton.classList.add("disabled");
            spotifyButton.removeAttribute("href");
            spotifyButton.onclick = null;
        } else {
            if (spotifyButton.tagName.toLowerCase() === "a") {
                spotifyButton.href = spotify;
            } else {
                spotifyButton.onclick = () => window.open(spotify, "_blank", "noopener,noreferrer");
            }
            spotifyButton.disabled = false;
            spotifyButton.classList.remove("disabled");
        }
    }
}

// Play Song (needs YouTube)
function playSong() {
    alert("Noch nicht implementiert");
}

// PDF Export
async function PDFexport() {
    const song = document.getElementById("song");

    if (!song) {
        alert("Song nicht gefunden.");
        return;
    }

    if (!window.html2canvas || !window.jspdf) {
        alert("PDF-Bibliotheken sind nicht geladen.");
        return;
    }

    let wrapper = null;

    try {
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true
        });

        // PDF layout
        const margin = 15;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const contentWidth = pageWidth - 2 * margin;
        const contentTop = 27;
        const contentBottom = pageHeight - 26;
        const contentHeight = contentBottom - contentTop;

        // Create an invisible copy
        wrapper = document.createElement("div");

        wrapper.style.cssText = `
            position: fixed;
            left: -10000px;
            top: 0;
            width: 750px;
            padding: 0;
            margin: 0;
            background: white;
            color: black;
            box-sizing: border-box;
        `;

        const clone = song.cloneNode(true);

        clone.style.cssText += `
            display: block;
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
            text-align: left;
        `;

        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        await document.fonts.ready;

        const cloneRect = clone.getBoundingClientRect();

        // Render current song appearance
        const canvas = await html2canvas(clone, {
            scale: 2,
            backgroundColor: "#ffffff",
            useCORS: true,
            logging: false
        });

        const pixelsPerMM = canvas.width / contentWidth;
        const pageHeightPx = Math.floor(
            contentHeight * pixelsPerMM
        );

        const canvasScale = canvas.width / cloneRect.width;

        function getY(element, bottom = false) {
            const rect = element.getBoundingClientRect();

            return Math.max(0, Math.min(
                canvas.height,
                Math.round(
                    (
                        (bottom ? rect.bottom : rect.top) -
                        cloneRect.top
                    ) * canvasScale
                )
            ));
        }

        // Find the smallest paragraph elements
        const paragraphs = [
            ...clone.querySelectorAll(".paragraph")
        ].filter(element =>
            !element.querySelector(".paragraph")
        );

        if (!paragraphs.length) {
            throw new Error(
                "Keine ChordPro-Paragraphen gefunden."
            );
        }

        // Find section heading rows
        const headingRows = [
            ...clone.querySelectorAll("tr")
        ].filter(row =>
            row.querySelector("td.comment")
        );

        // Get the visual start of a paragraph including its heading
        function getBlockStart(paragraph) {
            const paragraphTop = getY(paragraph);

            const previousHeadings = headingRows
                .filter(row =>
                    getY(row, true) <= paragraphTop + 2
                )
                .sort((a, b) => getY(a) - getY(b));

            if (!previousHeadings.length) {
                return paragraphTop;
            }

            const heading = previousHeadings.at(-1);
            const headingBottom = getY(heading, true);

            // Only attach the heading if no other paragraph
            // lies between it and this paragraph
            const paragraphBetween = paragraphs.some(p =>
                p !== paragraph &&
                getY(p) >= headingBottom &&
                getY(p) < paragraphTop
            );

            return paragraphBetween
                ? paragraphTop
                : getY(heading);
        }

        // Section starts are the preferred page breaks
        const sectionStarts = paragraphs
            .map(getBlockStart)
            .sort((a, b) => a - b);

        // Include start and end of the song
        const primaryBreaks = [
            0,
            ...sectionStarts.filter(y => y > 0),
            canvas.height
        ].filter((v, i, arr) =>
            i === 0 || v !== arr[i - 1]
        );

        // Fallback page breaks between complete rows
        // (never between chords and their lyrics)
        const rowBreaks = [];

        const rows = [
            ...clone.querySelectorAll("tr")
        ].filter(row =>
            !row.querySelector("tr")
        );

        for (const row of rows) {
            const top = getY(row);

            if (top > 0 && top < canvas.height) {
                rowBreaks.push(top);
            }
        }

        // If a row contains only chords, keep it together
        // with the next lyrics row.
        const forbiddenBreaks = [];

        for (let i = 0; i < rows.length - 1; i++) {
            const current = rows[i];
            const next = rows[i + 1];

            const hasChords = !!current.querySelector(".chord");
            const hasLyrics = !!current.querySelector(".lyrics");
            const nextHasLyrics = !!next.querySelector(".lyrics");

            const heading = !!current.querySelector("td.comment");

            if (heading || (hasChords && !hasLyrics && nextHasLyrics)) {
                forbiddenBreaks.push(getY(next));
            }
        }

        // Prefer complete paragraphs, fall back to rows
        // only for sections that cannot fit on one page.
        const allowedBreaks = [...new Set([
            ...primaryBreaks,
            ...rowBreaks
        ])].sort((a, b) => a - b)
          .filter(y =>
              y === 0 ||
              y === canvas.height ||
              !forbiddenBreaks.includes(y)
          );

        function isInsideParagraph(y) {
            return paragraphs.some(p =>
                y > getY(p) &&
                y < getY(p, true)
            );
        }

        // A page boundary is preferred when outside
        // all complete paragraphs.
        function findPageBreak(start, maximumEnd) {
            if (maximumEnd >= canvas.height) {
                return canvas.height;
            }

            // 1. Prefer a complete section boundary
            const preferred = primaryBreaks
                .filter(y =>
                    y > start &&
                    y <= maximumEnd &&
                    !forbiddenBreaks.includes(y)
                )
                .at(-1);

            if (preferred !== undefined) {
                return preferred;
            }

            // 2. Fall back to complete row boundaries
            const fallback = allowedBreaks
                .filter(y =>
                    y > start &&
                    y <= maximumEnd
                )
                .at(-1);

            if (fallback !== undefined) {
                return fallback;
            }

            throw new Error(
                "Eine einzelne Akkord-/Textzeile ist zu gross " +
                "für die PDF-Seite."
            );
        }

        // Draw header and footer
        function addHeaderFooter(pageNumber) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(45, 55, 72);

            pdf.text(
                "JustSongs - songbuch.justsomeone.ch",
                margin,
                15
            );

            pdf.setDrawColor(210, 215, 220);
            pdf.setLineWidth(0.3);

            pdf.line(
                margin, 19,
                pageWidth - margin, 19
            );

            pdf.line(
                margin, pageHeight - 20,
                pageWidth - margin, pageHeight - 20
            );

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(105, 115, 125);

            pdf.text(
                "Ein Songbuch von Elija Käser - songbuch.justsomeone.ch",
                margin,
                pageHeight - 13
            );

            pdf.text(
                String(pageNumber),
                pageWidth - margin,
                pageHeight - 13,
                { align: "right" }
            );
        }

        // Generate PDF pages
        let startY = 0;
        let pageNumber = 0;

        while (startY < canvas.height) {
            const maximumEnd = Math.min(
                startY + pageHeightPx,
                canvas.height
            );

            const endY = findPageBreak(
                startY,
                maximumEnd
            );

            if (endY <= startY) {
                throw new Error("Ungültiger Seitenumbruch.");
            }

            const sliceHeight = endY - startY;

            const pageCanvas = document.createElement("canvas");
            pageCanvas.width = canvas.width;
            pageCanvas.height = sliceHeight;

            const context = pageCanvas.getContext("2d");

            if (!context) {
                throw new Error("Canvas konnte nicht erstellt werden.");
            }

            context.fillStyle = "#ffffff";
            context.fillRect(
                0, 0,
                canvas.width,
                sliceHeight
            );

            context.drawImage(
                canvas,
                0,
                startY,
                canvas.width,
                sliceHeight,
                0,
                0,
                canvas.width,
                sliceHeight
            );

            if (pageNumber > 0) {
                pdf.addPage();
            }

            pageNumber++;

            addHeaderFooter(pageNumber);

            pdf.addImage(
                pageCanvas.toDataURL("image/png"),
                "PNG",
                margin,
                contentTop,
                contentWidth,
                sliceHeight / pixelsPerMM
            );

            startY = endY;
        }

        // Download PDF
        const filename = (document.title || "Song")
            .replace(/[\\/:*?"<>|]/g, "_") + ".pdf";

        pdf.save(filename);

    } catch (error) {
        console.error("PDF export failed:", error);
        alert(
            "PDF konnte nicht erstellt werden: " +
            error.message
        );

    } finally {
        wrapper?.remove();
    }
}

// Get all Playlist in the select Tag
function putinPlaylist() {
    const playlistData = listPlaylist();
    const playlists = Array.isArray(playlistData)
        ? playlistData
        : playlistData && typeof playlistData === "object"
            ? Object.values(playlistData)
            : [];

    const select_playlist = document.getElementById("select-playlist");

    if (!select_playlist || playlists.length === 0) {
        return;
    }

    select_playlist.innerHTML = "";

    playlists.forEach(playlist => {
        const option = document.createElement("option");
        option.value = playlist;
        option.textContent = playlist;
        select_playlist.appendChild(option);
    });
}

// Add to Playlist
function addPlaylist() {
    const playlist_name = document.getElementById("select-playlist").value;
    const params = new URLSearchParams(window.location.search);
    const song_url = params.get("lied");
    const song_titel = document.getElementsByClassName("title")[0].innerText
    const song_artist = "Not Implemented"
    addtoPlaylist(song_url, song_titel, song_artist, playlist_name)
}

// Remove from Playlist
function removePlaylist() {
    const playlist_name = document.getElementById("select-playlist").value;
    const params = new URLSearchParams(window.location.search);
    const song_url = params.get("lied");

    removefromPlaylist(song_url, playlist_name);
}

// Initialize
function init() {
    setShortlinks();
    putinPlaylist();
    checkShortlinks("", "");
    loadSong();
    document.getElementById("play-metronom")
        .addEventListener("click", toggleMetronome);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}