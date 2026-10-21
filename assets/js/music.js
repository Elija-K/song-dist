
"use strict";

// ==========================================
// YOUTUBE PLAYER
// ==========================================

let player = null;
let youtubeVideoId = null;
let youtubeApiReady = false;
let playerReady = false;
let loadedVideoId = null;

// YouTube API laden
window.onYouTubeIframeAPIReady = function () {
    youtubeApiReady = true;
    initYouTubePlayer();
};

function loadYouTubeAPI() {
    if (window.YT?.Player) {
        youtubeApiReady = true;
        initYouTubePlayer();
        return;
    }

    if (!document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
    )) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
    }
}

// YouTube-Link aus ChordPro auslesen
function loadYouTubeSong() {
    const metadata = originalSong?.metadata?.metadata || {};

    const yt_link = String(metadata.youtube || "")
        .trim()
        .replace(/^["']|["']$/g, "");

    youtubeVideoId = null;

    if (!yt_link) {
        updateSongButton(false);
        if (playerReady) player.stopVideo();
        return;
    }

    try {
        const url = new URL(yt_link);

        const allowedHosts = [
            "youtube.com",
            "www.youtube.com",
            "music.youtube.com",
            "youtu.be"
        ];

        if (!allowedHosts.includes(url.hostname)) {
            throw new Error("Unbekannte YouTube-Domain");
        }

        youtubeVideoId = url.hostname === "youtu.be"
            ? url.pathname.slice(1)
            : url.searchParams.get("v");

        if (!youtubeVideoId) {
            throw new Error("Keine Video-ID gefunden");
        }

        updateSongButton(true);
        initYouTubePlayer();

    } catch (error) {
        console.error("Ungültiger YouTube-Link:", error);
        updateSongButton(false);
    }
}

// Player erstellen oder Video wechseln
function initYouTubePlayer() {
    if (!youtubeApiReady || !youtubeVideoId) return;

    if (player) {
        if (playerReady && loadedVideoId !== youtubeVideoId) {
            player.cueVideoById(youtubeVideoId);
            loadedVideoId = youtubeVideoId;
        }
        return;
    }

    const container = document.getElementById("player");

    if (!container) {
        console.warn("YouTube Player: #player fehlt im HTML.");
        return;
    }

    player = new YT.Player("player", {
        width: 320,
        height: 180,
        videoId: youtubeVideoId,
        playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            playsinline: 1
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
        }
    });
}

// Player bereit
function onPlayerReady(event) {
    playerReady = true;

    console.log("YouTube Player bereit");

    if (youtubeVideoId) {
        event.target.cueVideoById(youtubeVideoId);
        loadedVideoId = youtubeVideoId;
    }
}

// Song abspielen / pausieren
function PlaySong() {
    if (!player || !playerReady || !youtubeVideoId) return;

    const state = player.getPlayerState();

    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

// Button aktualisieren
function updateSongButton(enabled) {
    const button = document.getElementById("play-song");
    if (!button) return;

    button.disabled = !enabled;
    button.classList.toggle("disabled", !enabled);

    if (!enabled) button.innerText = "Play Song";
}

// Player Status
function onPlayerStateChange(event) {
    const button = document.getElementById("play-song");
    if (!button) return;

    button.innerText =
        event.data === YT.PlayerState.PLAYING
            ? "Pause Song"
            : "Play Song";
}

// Fehlerbehandlung
function onPlayerError(event) {
    console.error("YouTube Player Fehler:", event.data);
    updateSongButton(false);
}


// ==========================================
// METRONOM
// ==========================================

let audioContext = null;
let metronomeTimer = null;
let metronomeRunning = false;

let metronomeBpm = 120;
let beatsPerBar = 4;
let beatUnit = 4;

let currentBeat = 0;
let nextBeatTime = 0;

// Metronom-Daten aus ChordPro laden
function loadMetronome() {
    stopMetronome();

    const metadata = originalSong?.metadata?.metadata || {};

    metronomeBpm = Number(metadata.tempo) || 120;

    const time = metadata.time || "4/4";
    const [beats, unit] = time.split("/").map(Number);

    beatsPerBar = beats > 0 ? beats : 4;
    beatUnit = unit > 0 ? unit : 4;

    console.log("Metronom geladen:", {
        bpm: metronomeBpm,
        time: time
    });

    // Optionale Anzeige
    const info = document.getElementById("metronome-info");

    if (info) {
        info.innerText = `${metronomeBpm} BPM | ${time}`;
    }
}

// Klickton erzeugen
function playMetronomeClick(time, accented) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
        accented ? 1200 : 800,
        time
    );

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.35, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);

    oscillator.start(time);
    oscillator.stop(time + 0.06);
}

// Schlag planen
function scheduleBeat() {
    const accented = currentBeat === 0;

    playMetronomeClick(nextBeatTime, accented);

    // BPM beziehen sich hier auf Viertelnoten
    const secondsPerBeat =
        (60 / metronomeBpm) * (4 / beatUnit);

    nextBeatTime += secondsPerBeat;

    currentBeat = (currentBeat + 1) % beatsPerBar;
}

// Präziser Audio-Scheduler
function metronomeScheduler() {
    if (!metronomeRunning || !audioContext) return;

    while (nextBeatTime < audioContext.currentTime + 0.1) {
        scheduleBeat();
    }
}

// Metronom starten
async function startMetronome() {
    if (metronomeRunning) return;

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        console.error("Web Audio API wird nicht unterstützt.");
        return;
    }

    const context = new AudioContextClass();
    audioContext = context;

    await context.resume();

    // Falls während resume() gestoppt wurde
    if (audioContext !== context) {
        await context.close();
        return;
    }

    metronomeRunning = true;
    currentBeat = 0;
    nextBeatTime = context.currentTime + 0.05;

    metronomeScheduler();

    metronomeTimer = setInterval(
        metronomeScheduler,
        25
    );

    const button = document.getElementById("play-metronom");

    if (button) {
        button.innerText = "Stop Metronom";
    }
}

// Metronom stoppen
function stopMetronome() {
    metronomeRunning = false;

    if (metronomeTimer !== null) {
        clearInterval(metronomeTimer);
        metronomeTimer = null;
    }

    if (audioContext) {
        const oldContext = audioContext;
        audioContext = null;

        oldContext.close().catch(console.error);
    }

    const button = document.getElementById("play-metronom");

    if (button) {
        button.innerText = "Play Metronom";
    }
}

// Metronom starten / stoppen
function toggleMetronome() {
    if (metronomeRunning) {
        stopMetronome();
    } else {
        startMetronome().catch(error => {
            console.error("Metronom-Fehler:", error);
            stopMetronome();
        });
    }
}


// ==========================================
// MUSIC INITIALIZATION
// ==========================================

// Aufrufen, nachdem originalSong geladen wurde
function loadMusic() {
    loadYouTubeSong();
    loadMetronome();
}

// Buttons verbinden
function initMusic() {
    const songButton = document.getElementById("play-song");
    const metronomeButton = document.getElementById("play-metronom");

    if (songButton) {
        songButton.addEventListener("click", PlaySong);
        updateSongButton(false);
    }

    if (metronomeButton) {
        metronomeButton.addEventListener(
            "click",
            toggleMetronome
        );
        metronomeButton.disabled = false;
        metronomeButton.classList.remove("disabled");
    }

    loadYouTubeAPI();
}

// DOM bereit
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMusic);
} else {
    initMusic();
}
