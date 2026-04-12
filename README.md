# Melodiq

Melodiq is a simple web app where you can search for songs, explore different artists, and listen to short previews. It’s designed to be clean and easy to use, making it quick and enjoyable to browse music.

This project uses the iTunes Search API, which provides free access to music data like songs, artists, albums, and preview links.

### Features

- Search for songs, artists, or albums
- Listen to short music previews
- Like and save your favorite tracks
- Filter by genre and sort by name or duration

### Technologies

- HTML
- CSS
- JavaScript

### How to Run

- Download or clone the project
- Open `index.html` in your browser

### API 

- iTunes: `https://itunes.apple.com/search?term={search_query}&entity=song`

### Response Example

Only relevant fields are shown: 

```
{
  "trackName": "Kesariya",
  "artistName": "Arijit Singh",
  "primaryGenreName": "Bollywood",
  "trackTimeMillis": 268000,
  "artworkUrl100": "https://is1-ssl.mzstatic.com/image/.../100x100bb.jpg",
  "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/..."
}
```