const table = document.getElementById("songsBody")
const input = document.getElementById("searchInput")
const load = document.getElementById("loader")
const genreBar = document.getElementById("genreBar")
const sort = document.getElementById("sortSelect")

let songs = []
let liked = []
let genre = "All"
let mode = "all"

async function getSongs(q) {
  load.classList.remove("hidden")
  table.innerHTML = ""

  let res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=20&country=IN`)
  songs = (await res.json()).results
  genre = "All"
  showGenres()
  showSongs()

  load.classList.add("hidden")
}

function showGenres() {
  let d = mode === "liked" ? songs.filter(s => liked.indexOf(s.trackId) !== -1) : songs

  let obj = {}
  d.forEach(s => {
    let g = s.primaryGenreName || "Other"
    obj[g] = (obj[g] || 0) + 1
  })

  let arr = ["All"]
  Object.keys(obj).forEach(g => arr.push(g))

  genreBar.innerHTML = arr.map(g =>
    `<button class="${g === genre ? "active" : ""}">${g}</button>`
  ).join("")

  genreBar.querySelectorAll("button").forEach((b, i) => {
    b.addEventListener("click", function () {
      genre = arr[i]
      showGenres()
      showSongs()
    })
  })
}

function showSongs() {
  let d = songs

  if (mode === "liked") d = d.filter(s => liked.indexOf(s.trackId) !== -1)
  if (genre !== "All") d = d.filter(s => s.primaryGenreName === genre)

  if (sort.value === "az") d.sort((a, b) => (a.trackName > b.trackName ? 1 : -1))
  if (sort.value === "za") d.sort((a, b) => (a.trackName < b.trackName ? 1 : -1))
  if (sort.value === "dur") d.sort((a, b) => (b.trackTimeMillis || 0) - (a.trackTimeMillis || 0))

  if (!d.length) {
    table.innerHTML = "<tr><td>No results</td></tr>"
    return
  }

  table.innerHTML = d.map((s, i) => {
    let img = s.artworkUrl100
    if (img) {
      let p = img.indexOf("100x100")
      if (p !== -1) img = img.slice(0, p) + "700x700" + img.slice(p + 7)
    }

    let t = Math.floor((s.trackTimeMillis || 0) / 1000)
    let m = Math.floor(t / 60)
    let sec = t % 60
    if (sec < 10) sec = "0" + sec

    let like = liked.indexOf(s.trackId) !== -1 ? "❤️" : "♡"

    return `
      <tr>
      <td>${i + 1}</td>
      <td>
      <div class="song-info">
      <img src="${img}">
      <div>
      <div class="title">${s.trackName || "No name"}</div>
      <div class="artist">${s.artistName || "Unknown"}</div>
      </div>
      </div>
      </td>
      <td><span class="genre-tag">${s.primaryGenreName || "-"}</span></td>
      <td>${m}:${sec}</td>
      <td><audio controls src="${s.previewUrl}"></audio></td>
      <td><button class="like-btn">${like}</button></td>
      </tr>`
        }).join("")

  table.querySelectorAll(".like-btn").forEach((b, i) => {
    b.addEventListener("click", function () {
      let id = d[i].trackId

      if (liked.indexOf(id) !== -1) {
        liked = liked.filter(x => x !== id)
      } else {
        liked.push(id)
      }

      document.getElementById("likedCount").innerText = liked.length
      if (mode === "liked") showGenres()
      showSongs()
    })
  })
}

document.getElementById("allTab").addEventListener("click", function () {
  mode = "all"
  genre = "All"
  showGenres()
  showSongs()
})

document.getElementById("likedTab").addEventListener("click", function () {
  mode = "liked"
  genre = "All"
  showGenres()
  showSongs()
})

sort.addEventListener("change", showSongs)

input.addEventListener("input", function () {
  let val = input.value

  while (val[0] === " ") val = val.slice(1)
  while (val[val.length - 1] === " ") val = val.slice(0, val.length - 1)

  if (val.length > 0) getSongs(val)
  else table.innerHTML = ""
})

getSongs("top hits 2025")