const table = document.getElementById("track-container")
const input = document.getElementById("search-input")
const sortSelect = document.getElementById("sort-select")
const genreBox = document.getElementById("genre-chips")
const audio = new Audio()
audio.volume = 0.8

let allSongs = []
let likedSongs = JSON.parse(localStorage.getItem("my_favs") || "[]")
let genre = "All"
let mode = "all"
let currentSongIndex = -1
let layout = "list"
let searchTimer = null

function time(s) {
  if (!s || isNaN(s)) return "0:00"
  let sec = Math.floor(s % 60)
  return Math.floor(s / 60) + ":" + (sec < 10 ? "0" : "") + sec
}

function img(url) {
  return url ? url.replace("100x100", "700x700") : ""
}

function liked(id) {
  return likedSongs.some(s => s.id === id)
}

function esc(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function heartIcon(isLiked) {
  return `<i class="${isLiked ? "fa-solid" : "fa-regular"} fa-heart"></i>`
}

async function loadSongs(text) {
  showLoading()
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(text)}&media=music&entity=song&limit=50&country=IN`
    const res = await fetch(url)
    const data = await res.json()

    allSongs = data.results
      .filter(song => song.wrapperType === "track" && song.kind === "song")
      .map((song) => ({
        id: song.trackId,
        name: song.trackName || "Unknown",
        artist: song.artistName || "Unknown Artist",
        album: song.collectionName || "",
        genre: song.primaryGenreName || "Other",
        duration: Math.round(song.trackTimeMillis / 1000),
        art: song.artworkUrl100 || "",
        artLarge: img(song.artworkUrl100),
        preview: song.previewUrl || "",
      }))
    
    genre = "All"
    updateStats()
    showGenres()
    showSongs()
  } catch {
    showError("Could not reach iTunes API. Check your connection.")
  }
}

function updateStats() {
  let n = allSongs.length
  document.getElementById("stat-loaded").textContent = n

  if (n === 0) {
    document.getElementById("stat-avg").textContent = "0:00"
    document.getElementById("stat-total").textContent = "0m"
    document.getElementById("stat-genres").textContent = "0"
    return
  }

  let totalSec = 0
  let genres = {}
  allSongs.forEach(s => {
    totalSec += s.duration
    genres[s.genre] = true
  })

  document.getElementById("stat-avg").textContent = time(Math.round(totalSec / n))
  document.getElementById("stat-total").textContent = Math.round(totalSec / 60) + "m"
  document.getElementById("stat-genres").textContent = Object.keys(genres).length
}

function showGenres() {
  let songs = mode === "liked" ? [...likedSongs] : [...allSongs]

  let counts = {}
  songs.forEach(s => counts[s.genre] = (counts[s.genre] || 0) + 1)

  let names = ["All", ...Object.keys(counts).sort((a, b) => counts[b] - counts[a])]

  genreBox.innerHTML = names.map(name => {
    let active = name === genre ? "active" : ""
    let count = name !== "All" ? ` <span style="opacity:.5;font-size:11px">${counts[name]}</span>` : ""
    return `<button class="chip ${active}" data-genre="${name}" onclick="setGenre(this.dataset.genre)">${name}${count}</button>`
  }).join("")
}

function setGenre(selectedGenre) {
  genre = selectedGenre
  showGenres()
  showSongs()
}

function showSongs() {
  let list = [...allSongs]

  if (mode === "liked") list = [...likedSongs]
  if (genre !== "All") list = list.filter(s => s.genre === genre)

  let q = input.value.trim().toLowerCase()
  if (q) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q)
    )
  }

  let sort = sortSelect.value
  list.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name)
    if (sort === "artist") return a.artist.localeCompare(b.artist)
    if (sort === "duration_asc") return a.duration - b.duration
    if (sort === "duration_desc") return b.duration - a.duration
    return 0
  })

  document.getElementById("section-title").textContent = mode === "liked" ? "Liked Songs" : "All Tracks"
  document.getElementById("section-count").textContent = list.length + " track" + (list.length !== 1 ? "s" : "")
  document.getElementById("fav-count").textContent = likedSongs.length

  if (layout === "grid") {
    renderGrid(list)
  } else {
    renderList(list)
  }
}

function renderList(tracks) {
  if (tracks.length === 0) { table.innerHTML = emptyHTML(); return }

  let rows = tracks.map((song, i) => {
    let playing = currentSongIndex === song.id
    let faved = liked(song.id)
    return `
      <tr class="track-row${playing ? " playing" : ""}" onclick="playTrack(${song.id})">
        <td class="track-num">${playing ? "▶" : i + 1}</td>
        <td>
          <div class="track-info-cell">
            <img class="track-art" src="${song.art}" alt="" loading="lazy" onerror="this.style.opacity=0"/>
            <div>
              <div class="track-name">${esc(song.name)}</div>
              <div class="track-artist">${esc(song.artist)}</div>
            </div>
          </div>
        </td>
        <td class="track-album">${esc(song.album)}</td>
        <td><span class="track-genre-badge">${esc(song.genre)}</span></td>
        <td>
          <button class="fav-btn${faved ? " faved" : ""}" onclick="toggleFav(event,${song.id})">
            ${heartIcon(faved)}
          </button>
        </td>
        <td class="track-duration">${time(song.duration)}</td>
      </tr>`
  }).join("")

  table.innerHTML = `
    <table class="track-table">
      <thead>
        <tr>
          <th style="width:36px">#</th>
          <th>Title</th>
          <th>Album</th>
          <th>Genre</th>
          <th></th>
          <th style="text-align:right">Time</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function renderGrid(tracks) {
  if (tracks.length === 0) { table.innerHTML = emptyHTML(); return }

  let cards = tracks.map(song => {
    let playing = currentSongIndex === song.id
    let faved = liked(song.id)
    let border = playing ? "#c8f73e" : "rgba(255,255,255,0.07)"
    let nameCol = playing ? "#c8f73e" : "#f0f0ee"
    return `
      <div onclick="playTrack(${song.id})" style="cursor:pointer;background:#111118;border-radius:12px;overflow:hidden;border:1px solid ${border};transition:border-color .15s;padding-bottom:12px;">
        <img src="${song.artLarge}" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#22222e" onerror="this.style.background='#22222e'" loading="lazy"/>
        <div style="padding:10px 12px 0;">
          <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${nameCol}">${esc(song.name)}</div>
          <div style="font-size:11px;color:#888890;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(song.artist)}</div>
        </div>
        <div style="padding:6px 12px 0;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:#555560">${time(song.duration)}</span>
          <button class="fav-btn${faved ? " faved" : ""}" onclick="toggleFav(event,${song.id})" style="padding:2px">${heartIcon(faved)}</button>
        </div>
      </div>`
  }).join("")

  table.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;">${cards}</div>`
}

function playTrack(id) {
  let song = allSongs.find(s => s.id === id) || likedSongs.find(s => s.id === id)
  if (!song) return
  currentSongIndex = id

  let art = document.getElementById("player-art")
  art.src = song.artLarge
  art.style.display = "block"

  document.getElementById("player-title").textContent = song.name
  document.getElementById("player-title").className = "player-title"
  document.getElementById("player-artist").textContent = song.artist
  document.getElementById("player-artist").style.display = "block"
  document.getElementById("time-total").textContent = time(song.duration)
  document.getElementById("time-cur").textContent = "0:00"
  document.getElementById("progress-fill").style.width = "0%"

  if (song.preview) {
    audio.src = song.preview
    audio.play().catch(() => {})
  }

  showSongs()
  showToast("Now playing: " + song.name)
}

function togglePlay() {
  if (currentSongIndex === -1) return
  if (audio.paused) {
    audio.play().catch(() => {})
  } else {
    audio.pause()
  }
}

function playNext() {
  if (allSongs.length === 0) return
  let i = allSongs.findIndex(s => s.id === currentSongIndex)
  playTrack(allSongs[(i + 1) % allSongs.length].id)
}

function playPrev() {
  if (allSongs.length === 0) return
  let i = allSongs.findIndex(s => s.id === currentSongIndex)
  playTrack(allSongs[(i - 1 + allSongs.length) % allSongs.length].id)
}

function seekTo(event) {
  if (!audio.duration || currentSongIndex === -1) return
  let song = allSongs.find(s => s.id === currentSongIndex) || likedSongs.find(s => s.id === currentSongIndex)
  if (!song) return
  let pct = event.offsetX / document.getElementById("progress-bar").offsetWidth
  audio.currentTime = Math.min(pct * song.duration, audio.duration)
}

function setVolume(volume) {
  audio.volume = volume / 100
}

function updatePlayIcon() {
  document.getElementById("play-icon").className = audio.paused ? "fa-solid fa-play" : "fa-solid fa-pause"
}

function updateProgress() {
  if (currentSongIndex === -1) return
  let song = allSongs.find(s => s.id === currentSongIndex) || likedSongs.find(s => s.id === currentSongIndex)
  if (!song) return
  let pct = song.duration ? (audio.currentTime / song.duration) * 100 : 0
  document.getElementById("progress-fill").style.width = pct + "%"
  document.getElementById("time-cur").textContent = time(audio.currentTime)
}

audio.addEventListener("play", updatePlayIcon)
audio.addEventListener("pause", updatePlayIcon)
audio.addEventListener("ended", playNext)
setInterval(updateProgress, 100)

function toggleFav(event, id) {
  event.stopPropagation()
  if (liked(id)) {
    likedSongs = likedSongs.filter(s => s.id !== id)
    showToast("Removed from liked songs")
  } else {
    likedSongs.push(allSongs.find(s => s.id === id))
    showToast("Added to liked songs ♥")
  }
  localStorage.setItem("my_favs", JSON.stringify(likedSongs))
  showGenres()
  showSongs()
}

function setView(selectedMode) {
  mode = selectedMode
  genre = "All"
  document.getElementById("nav-all").className = "nav-item" + (selectedMode === "all" ? " active" : "")
  document.getElementById("nav-fav").className = "nav-item" + (selectedMode === "liked" ? " active" : "")
  showGenres()
  showSongs()
}

function setLayout(selectedLayout) {
  layout = selectedLayout
  document.getElementById("view-grid-btn").className = "btn-icon" + (selectedLayout === "grid" ? " active" : "")
  document.getElementById("view-list-btn").className = "btn-icon" + (selectedLayout === "list" ? " active" : "")
  showSongs()
}

function quickSearch(searchText) {
  input.value = ""
  document.getElementById("section-title").textContent = `Loading "${searchText}"…`
  loadSongs(searchText)
}

input.addEventListener("input", function (event) {
  clearTimeout(searchTimer)
  let q = event.target.value.trim()

  if (q.length === 0) { showSongs(); return }
  if (q.length < 2) return

  searchTimer = setTimeout(() => {
    let found = allSongs.some(s =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.artist.toLowerCase().includes(q.toLowerCase())
    )
    if (found) {
      showSongs()
    } else {
      loadSongs(q)
    }
  }, 500)
})

function showLoading() {
  table.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <div style="color:#555560;font-size:14px">Fetching tracks…</div>
    </div>`
  genreBox.innerHTML = ""
  document.getElementById("section-title").textContent = "Loading…"
  document.getElementById("section-count").textContent = ""
}

function showError(message) {
  table.innerHTML = `
    <div class="empty-state">
      <div class="icon">⚠️</div>
      <h3>Oops!</h3>
      <p>${message}</p>
    </div>`
}

function emptyHTML() {
  if (mode === "liked") {
    return `
      <div class="empty-state">
        <div class="icon" style="font-size:4rem">𓆩♡𓆪</div>
        <h3>No liked songs yet</h3>
        <p>Like a track to save it here.</p>
      </div>`
  }
  return `
    <div class="empty-state">
      <div class="icon">🎵</div>
      <h3>No results found</h3>
      <p>Try a different search or genre.</p>
    </div>`
}

function showToast(message) {
  let toast = document.getElementById("toast")
  toast.textContent = message
  toast.classList.add("show")
  setTimeout(() => toast.classList.remove("show"), 2200)
}

loadSongs("top hits 2025")