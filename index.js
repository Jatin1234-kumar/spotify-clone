// Start of JavaScript
let currentSong = new Audio();
let songs = [];
let isPlaying = false;
let songIndex = 0;

// Elements from the DOM
const masterPlay = document.getElementById('masterPlay');
const previous = document.getElementById('previous');
const next = document.getElementById('next');
const seekBar = document.getElementById('seek-bar');
const songListUl = document.querySelector('.songlist ul');
const songInfoDiv = document.querySelector('.playbar .song-info');
const currentTimeSpan = document.getElementById('currentTime');
const totalTimeSpan = document.getElementById('totalTime');
const volumeBar = document.getElementById('volume-bar');

/**
 * Fetches song file names from the server.
 * This is an asynchronous function to handle fetching data.
 * @returns {Promise<string[]>} A promise that resolves to an array of song filenames.
 */
async function getSongs() {
    try {
        let response = await fetch("http://127.0.0.1:5500/songs/");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let htmlText = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(htmlText, 'text/html');
        
        let songLinks = Array.from(doc.getElementsByTagName("a"))
                            .filter(a => a.href.endsWith(".mp3"))
                            .map(a => a.href.split("/songs/")[1]);
        
        return songLinks;
    } catch (error) {
        console.error("Failed to fetch songs:", error);
        return [];
    }
}

/**
 * Renders the song list in the library section.
 */
const renderSongList = () => {
    songListUl.innerHTML = "";
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.setAttribute('data-song-index', index);
        const songName = song.replaceAll("%20", " ");
        li.innerHTML = `
            <div class="info">
                <h3>${songName}</h3>
                <p>Jatin</p>
            </div>
            <button class="play-btn" data-song-index="${index}"><i class="fa-solid fa-play"></i></button>
        `;
        songListUl.appendChild(li);
    });
};

/**
 * Plays a song and updates the UI.
 * @param {number} index The index of the song to play from the `songs` array.
 */
const playSong = (index) => {
    // If the song is already playing and is the same song, do nothing.
    if (isPlaying && index === songIndex) {
        return;
    }
    
    currentSong.src = `songs/${songs[index]}`;
    currentSong.play();
    isPlaying = true;
    songIndex = index;
    updateUI();
};

/**
 * Pauses the current song and updates the UI.
 */
const pauseSong = () => {
    currentSong.pause();
    isPlaying = false;
    updateUI();
};

/**
 * Updates the playbar and song list UI to reflect the current song's state.
 */
const updateUI = () => {
    const currentSongName = songs[songIndex] ? songs[songIndex].replaceAll("%20", " ") : "Select a song";
    const currentArtist = "Jatin"; // Assuming artist name for now
    songInfoDiv.innerHTML = `<h4>${currentSongName}</h4><p>${currentArtist}</p>`;

    // Update main play/pause button
    masterPlay.querySelector('i').className = isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";

    // Update active state in song list
    document.querySelectorAll('.songlist ul li').forEach(li => {
        li.classList.remove('playing');
    });

    const activeLi = document.querySelector(`.songlist ul li[data-song-index="${songIndex}"]`);
    if (activeLi) {
        activeLi.classList.add('playing');
    }
};


// Event listener for the master play/pause button
masterPlay.addEventListener('click', () => {
    if (!currentSong.src) {
        // Play the first song if nothing is loaded
        playSong(0);
    } else if (isPlaying) {
        pauseSong();
    } else {
        // Resume the song
        currentSong.play();
        isPlaying = true;
        updateUI();
    }
});

// Event listener for the next song button
next.addEventListener('click', () => {
    if (songs.length > 0) {
        let nextIndex = (songIndex + 1) % songs.length;
        playSong(nextIndex);
    }
});

// Event listener for the previous song button
previous.addEventListener('click', () => {
    if (songs.length > 0) {
        let prevIndex = (songIndex - 1 + songs.length) % songs.length;
        playSong(prevIndex);
    }
});

// Event listener for clicks on the song list items
songListUl.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.play-btn');
    const li = e.target.closest('li');

    if (playBtn) {
        const newIndex = parseInt(playBtn.getAttribute('data-song-index'));
        if (newIndex === songIndex && isPlaying) {
            pauseSong();
        } else {
            playSong(newIndex);
        }
    } else if (li) {
        const newIndex = parseInt(li.getAttribute('data-song-index'));
        playSong(newIndex);
    }
});

// Update seek bar and current time as song plays
currentSong.addEventListener("timeupdate", () => {
    if (!isNaN(currentSong.duration)) {
        let progress = (currentSong.currentTime / currentSong.duration) * 100;
        seekBar.value = progress;

        const currentMinutes = Math.floor(currentSong.currentTime / 60);
        const currentSeconds = Math.floor(currentSong.currentTime % 60).toString().padStart(2, '0');
        currentTimeSpan.innerText = `${currentMinutes}:${currentSeconds}`;
    }
});

// Handle seeking by user input on the seek bar
seekBar.addEventListener("input", () => {
    if (!isNaN(currentSong.duration)) {
        currentSong.currentTime = (seekBar.value * currentSong.duration) / 100;
    }
});

// Update total time when the song metadata is loaded
currentSong.addEventListener("loadedmetadata", () => {
    if (!isNaN(currentSong.duration)) {
        const totalMinutes = Math.floor(currentSong.duration / 60);
        const totalSeconds = Math.floor(currentSong.duration % 60).toString().padStart(2, '0');
        totalTimeSpan.innerText = `${totalMinutes}:${totalSeconds}`;
    }
});

// Play the next song automatically when the current one ends
currentSong.addEventListener("ended", () => {
    if (songs.length > 0) {
        let nextIndex = (songIndex + 1) % songs.length;
        playSong(nextIndex);
    }
});

// Volume control
volumeBar.addEventListener("input", (e) => {
    currentSong.volume = e.target.value / 100;
});

/**
 * Main function to initialize the application.
 */
async function main() {
    songs = await getSongs();
    if (songs.length > 0) {
        renderSongList();
        updateUI();
    } else {
        console.log("No songs found or failed to fetch.");
    }
}

main();
