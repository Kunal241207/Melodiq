const table = document.getElementById("songsBody");
const input = document.getElementById("searchInput");
const load = document.getElementById("loader");

async function getSongs(text) {
  load.classList.remove("hidden");
  table.innerHTML = "";

  try {
    let res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(text)}&media=music&entity=song&limit=20&country=IN`
    );

    let data = await res.json();
    showSongs(data.results);

  } catch {
    table.innerHTML = "<tr><td>Error loading</td></tr>";
  }

  load.classList.add("hidden");
}

function showSongs(arr) {
  if (!arr || arr.length === 0) {
    table.innerHTML = "<tr><td>No results</td></tr>";
    return;
  }

  for (let i = 0; i < arr.length; i++) {
    let s = arr[i];

    let img = s.artworkUrl100;
    if (img) {
      img = img.split("100x100").join("700x700");
    }

    let time = "0:00";
    if (s.trackTimeMillis) {
      let total = Math.floor(s.trackTimeMillis / 1000);
      let min = Math.floor(total / 60);
      let sec = total % 60;
      if (sec < 10) sec = "0" + sec;
      time = min + ":" + sec;
    }

    let row = document.createElement("tr");

    row.innerHTML = `
      <td>${i+1}</td>

      <td>
        <div class="song-info">
          <img src="${img}">
          <div>
            <div class="title">${s.trackName || "No name"}</div>
            <div class="artist">${s.artistName || "Unknown"}</div>
          </div>
        </div>
      </td>

      <td>${time}</td>

      <td>
        <audio controls src="${s.previewUrl}"></audio>
      </td>
    `;

    table.appendChild(row);
  }
}

input.addEventListener("input", function () {
  let val = input.value;

  while (val[0] === " ") {
    val = val.slice(1);
  }

  while (val[val.length - 1] === " ") {
    val = val.slice(0, val.length - 1);
  }

  if (val.length > 0) {
    getSongs(val);
  } else {
    table.innerHTML = "";
  }
});

getSongs("top hits 2025");