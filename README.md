
# Music Playlist
Application that allows uses to create new playlists and add/remove songs from their playlists.

## Programming language and technologies used
- JavaScript
- ReactJS
- NodeJS
- [Discogs API](https://www.discogs.com/developers)
- PostgreSQL

## Description
Users are able to create a new playlist in which they can add or remove songs from them. Songs are retrieved from the [Discogs API](https://www.discogs.com/developers). When a user adds a song to their playlist, the song's information (release id, title, artist, genre, year, tracklist, uri, and album image cover) are stored in a database for data persistence.
In summary, users are able to do the following:
- Create a new playlist
- Delete a playlist
- Add a song to a playlist
- Remove a song from a playlist
- Search for a song or artist with the help of the search bar <br/>
For this project, I worked on the [server](https://github.com/sbajala/MusicPlaylist_SB_NP/tree/main/MusicPlaylist_SB_NP/server) and on the [Album component](https://github.com/sbajala/MusicPlaylist_SB_NP/blob/main/MusicPlaylist_SB_NP/client/w13-client/src/components/Albums.js).

## Credits 
Created by Sharmaine Bajala and [@Nicolas Perdomo](https://github.com/nicolasperdomol).
