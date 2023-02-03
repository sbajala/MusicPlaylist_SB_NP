'use strict';

//Global variables
const portNumber = 8000;
const express = require('express');
const app = express();
const cors = require('cors');
const query = require('./queries');


//Middleware
//URL-encoded bodies will be parsed
app.use(express.urlencoded({extended: true}));
//JSON bodies will be parsed
app.use(express.json());
app.use(cors());

// Get all playlists
app.get('/playlists', query.getPlaylists);

// Get releases (albums or songs) by playlist ID
app.get('/playlists/:id', query.getReleases);

//Saving playlist in DB
app.post('/playlists/save', query.savePlaylist);

//Saving releases (albums or songs) in DB
app.post('/playlists', query.saveRelease);

//Deleting release (albums or songs) in DB
app.delete('/playlists/:playlist/:album', query.removeAlbum);

//Deleting playlist in DB
app.delete('/playlists/:playlist', query.removePlaylist);

app.listen(portNumber, function() {
    console.log('Server listening to port', portNumber);
})