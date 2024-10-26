let currentSong = new Audio();
let songs;
let currFolder;
let currentSongItem = null;  // To track the currently playing song item in the playlist

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li>
                            <div class="info">
                                <div class="songList-name"> ${decodeURI(song.slice(0, -4))}</div>
                            </div>
                            <div class="playnow">
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            const track = e.querySelector(".info").firstElementChild.innerHTML.trim() + ".mp3";
            if (currentSong.src.includes(track)) {
                // If clicked on the current playing song, toggle pause/play
                if (currentSong.paused) {
                    playMusic(track, false);  // Play the song if paused
                } else {
                    currentSong.pause();      // Pause if already playing
                    play.src = "img/play.svg"; // Update main play button to show play icon
                    e.querySelector(".playnow img").src = "img/play.svg"; // Update the clicked song's button to play icon
                }
            } else {
                // If a different song is clicked, start playing it
                playMusic(track);
            }
        });
    });

    return songs;
}

function resetAllPlayIcons() {
    Array.from(document.querySelectorAll(".songList li .playnow img")).forEach(img => {
        img.src = "img/play.svg";  // Set all icons to play icon
    });
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    resetAllPlayIcons();

    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg"; // Update main play button to pause

        // Update the corresponding song's play button to pause
        Array.from(document.querySelectorAll(".songList li")).forEach(e => {
            if (e.querySelector(".info").firstElementChild.innerHTML.trim() === decodeURI(track).slice(0, -4)) {
                e.querySelector(".playnow img").src = "img/pause.svg";  // Change to pause icon
                currentSongItem = e; // Set the current song item
            }
        });
    } else {
        currentSong.pause();
        play.src = "img/play.svg"; // Main button shows play

        // Update the corresponding song list button to show play
        if (currentSongItem) {
            currentSongItem.querySelector(".playnow img").src = "img/play.svg";
        }
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track).slice(0, -4);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    
    currentSong.onended = () => {
        let index = songs.indexOf(track);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);  // Play the next song
        } else {
            playMusic(songs[0]);  // Loop back to the first song when the playlist ends
        }
    };
}

async function displayAlbums() {
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);
    let folder;
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
            folder = e.href.split("/").slice(-1)[0];
            let a = await fetch(`/songs/${folder}/info.json`);
            let response = await a.json();
            cardContainer.innerHTML = cardContainer.innerHTML + ` <div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                            stroke-linejoin="round" />
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpg" alt="">
                <h2>${response.title}</h2>
                <p>${response.description}</p>
            </div>`;
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            document.getElementsByClassName("hamburger")[0].click();
        });
    });
}

async function main() {
    await displayAlbums();

    play.addEventListener("click", () => {
        if (currentSong.paused && !currentSong.src) {
            // No song is loaded, play the first song in the playlist
            playMusic(songs[0]);
        } else if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";

            // Update the side button to pause for the current song
            if (currentSongItem) {
                currentSongItem.querySelector(".playnow img").src = "img/pause.svg";
            }
        } else {
            currentSong.pause();
            play.src = "img/play.svg";

            // Update the side button to play for the current song
            if (currentSongItem) {
                currentSongItem.querySelector(".playnow img").src = "img/play.svg";
            }
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        } else {
            playMusic(songs[songs.length - 1]);  // Loop back to the last song
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    });

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });
}

main();
