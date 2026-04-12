const table = document.getElementById("songsBody")
const input = document.getElementById("searchInput")
const loader = document.getElementById("loader")
const genreBox = document.getElementById("genreBar")
const sortSelect = document.getElementById("sortSelect")

let allSongs = []
let likedSongs = []
let genre = "All"
let mode = "all"

async function loadSongs(text) {
  loader.classList.remove("hidden")
  table.innerHTML = ""

  const res = await fetch(`https://itunes.apple.com/search?term=${text}&entity=song&limit=20&country=IN`)
  allSongs = (await res.json()).results

  genre = "All"
  showGenres()
  showSongs()

  loader.classList.add("hidden")
}

function showGenres() {
  const list = mode === "liked"
    ? allSongs.filter(song => likedSongs.includes(song.trackId))
    : allSongs

  const count = {}
  list.forEach(song => {
    const g = song.primaryGenreName || "Other"
    count[g] = (count[g] || 0) + 1
  })

  const names = ["All", ...Object.keys(count)]

  genreBox.innerHTML = names.map(name =>
    `<button class="${name === genre ? "active" : ""}">${name}</button>`
  ).join("")

  genreBox.querySelectorAll("button").forEach((btn, ind) =>
    btn.addEventListener("click", () => {
      genre = names[ind]
      showSongs()
      showGenres()
    })
  )
}

function time(ms) {
  const t = Math.floor((ms || 0) / 1000)
  const m = Math.floor(t / 60)
  let s = t % 60
  if (s < 10) s = "0" + s
  return m + ":" + s
}

function img(url) {
  if (!url) return ""
  return url.replace("100x100", "700x700")
}

function liked(id) {
  return likedSongs.includes(id)
}

function showSongs() {
  let list = [...allSongs]

  if (mode === "liked") {
    list = list.filter(song => liked(song.trackId))
  }
  if (genre !== "All") {
    list = list.filter(song => song.primaryGenreName === genre)
  }

  if (sortSelect.value === "az") {
    list.sort((a, b) => a.trackName > b.trackName ? 1 : -1)
  } else if (sortSelect.value === "za") {
    list.sort((a, b) => a.trackName < b.trackName ? 1 : -1)
  } else if (sortSelect.value === "dur") {
    list.sort((a, b) => (b.trackTimeMillis || 0) - (a.trackTimeMillis || 0))
  }

  if (!list.length) {
    table.innerHTML = "<tr><td>No results</td></tr>"
    return
  }

  table.innerHTML = list.map((song, i) => {
    let likeIcon = "♡"
    if (liked(song.trackId)) likeIcon = "❤️"

    return `
      <tr>
        <td>${i + 1}</td>
        <td>
          <div class="song-info">
            <img src="${img(song.artworkUrl100)}">
            <div>
              <div class="title">${song.trackName || "No name"}</div>
              <div class="artist">${song.artistName || "Unknown"}</div>
            </div>
          </div>
        </td>
        <td><span class="genre-tag">${song.primaryGenreName || "-"}</span></td>
        <td>${time(song.trackTimeMillis)}</td>
        <td><audio controls src="${song.previewUrl}"></audio></td>
        <td><button class="like-btn">${likeIcon}</button></td>
      </tr>
    `
  }).join("")

  table.querySelectorAll(".like-btn").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      const id = list[i].trackId

      if (liked(id)) {
        likedSongs = likedSongs.filter(x => x !== id)
      } else {
        likedSongs.push(id)
      }

      document.getElementById("likedCount").innerText = likedSongs.length

      if (mode === "liked") showGenres()
      showSongs()
    })
  })

  const audios = table.querySelectorAll("audio")
  audios.forEach(curr => {
    curr.addEventListener("play", () => {
      audios.forEach(a => {
        if (a !== curr) a.pause()
      })
    })
  })
}

document.getElementById("allTab").addEventListener("click", () => {
  mode = "all"
  genre = "All"
  allTab.classList.add("active")
  likedTab.classList.remove("active")
  showGenres()
  showSongs()
})

document.getElementById("likedTab").addEventListener("click", () => {
  mode = "liked"
  genre = "All"
  likedTab.classList.add("active")
  allTab.classList.remove("active")
  showGenres()
  showSongs()
})

sortSelect.addEventListener("change", showSongs)

input.addEventListener("input", () => {
  const v = input.value.trim()
  if (v) {
    loadSongs(v)
  } else {
    loadSongs("top hits 2025")
  }
})

loadSongs("top hits 2025")