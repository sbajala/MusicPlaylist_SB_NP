const db = require("./db");

/** Retrieves all playlists */
const getPlaylists = (request, response) => {
  //Connecting to DB
  db.connect();

  db.query("SELECT * FROM public.playlists", (result) => {
    let JSONObject = result.rows;
    let JSONObjectString = JSON.stringify(JSONObject, null, 4);
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSONObjectString);

    //Disconnecting from DB
    db.disconnect();
  });
};

/** Retrieves all releases (albums or songs) in playlist */
const getReleases = (request, response) => {
  //Connecting to DB
  db.connect();

  //Retrieving parameters
  let params = [request.params.id];
  db.queryParams(
    "SELECT * FROM public.albums WHERE playlist_id = $1",
    params,
    (result) => {
      //If exists, retrieves all releases in playlist
      if (result.rowCount >= 1) {
        let JSONObject = result.rows;
        let JSONObjectString = JSON.stringify(JSONObject, null, 4);

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSONObjectString);
      } else {
        response.writeHead(200, { "Content-Type": "application/json" });
        let message = JSON.stringify({ message: "Playlist is empty." });
        response.end(message);
      }
      //Disconnecting from DB
      db.disconnect();
    }
  );
};

/** Adds playlist in DB */
const savePlaylist = (request, response) => {
  //Connecting to DB
  db.connect();

  //Retrieving data
  let data = request.body;
  let id = 0;

  if (data[0].id !== undefined) {
    id = data[0].id;
  }

  //Validating whether playlist exists in DB
  db.queryParams(
    "SELECT * FROM public.playlists WHERE id = $1",
    [id],
    (result) => {
      if (result.rowCount == 1) {
        response.writeHead(404, { "Content-Type": "application/json" });
        let message = JSON.stringify({ message: "Playlist already exists." });
        response.end(message);
      } else {
        let playlist_name = data[0].name;
        db.queryParams(
          "INSERT INTO public.playlists(name) VALUES ($1) " + "RETURNING *",
          [playlist_name],
          (result) => {
            response.writeHead(200, { "Content-Type": "application/json" });
            json = JSON.stringify({
              message: "Playlist " + data[0].name + " was created!",
            });
            response.end(message);
          }
        );
      }
      //Disconnecting from DB
      db.disconnect();

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          ok: true,
          message: "Playlist " + data[0].name + " was created!",
        })
      );
    }
  );
};

/** Adds album in DB */
const saveRelease = (request, response) => {
  //Connecting to DB
  db.connect();

  //Retrieving data
  let data = request.body;
  let id = 0;

  if (data[0].id !== undefined) {
    id = data[0].id;
  }
  let playlist_id = data[0].playlist_id;

  if (data[0].playlist_id !== undefined) {
    playlist_id = data[0].playlist_id;
  }

  //Validating whether release exists in playlist
  db.queryParams(
    "SELECT * FROM public.albums WHERE playlist_id = $1 AND release_id = $2",
    [playlist_id, id],
    (result) => {
      if (result.rowCount == 1) {
        response.writeHead(404, { "Content-Type": "application/json" });
        let message = JSON.stringify({
          message: "Release is already in playlist.",
        });
        response.end(message);
      } else {
        //Always retrieving one object (album or song) at a time
        let JSONObject = data[0];

        //Retrieving tracklist titles only
        let tracklist_data = data[0].tracklist;
        let tracklist = [];
        if (tracklist_data !== undefined && tracklist_data !== undefined) {
          for (let i = 0; i < tracklist_data.length; i++) {
            tracklist.push(tracklist_data[i].title);
          }
        }

        let artist = [];
        if (JSONObject.artists !== undefined) {
          artist = JSONObject.artists[0].name;
        }
        //Storing only the first values if category is an array (Ex. artists);
        let params = [
          JSONObject.playlist_id,
          JSONObject.id,
          JSONObject.title,
          artist,
          JSONObject.genres[0],
          JSONObject.year,
          tracklist,
          JSONObject.uri,
          JSONObject.thumb,
        ];

        db.queryParams(
          "INSERT INTO public.albums(playlist_id, release_id, title, artists, genres, year, tracklist, uri, image_url)" +
            " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)" +
            "RETURNING *",
          params,
          (result) => {
            response.writeHead(200, { "Content-Type": "application/json" });
            let message = JSON.stringify({
              message: JSONObject.title + " was added in playlist!",
            });
            response.end(message);
          }
        );
      }
    }
  );
};

/** Removes album from DB */
const removeAlbum = (request, response) => {
  //Connecting to DB
  db.connect();

  //Validating whether release exists in DB
  db.queryParams(
    "SELECT * FROM public.albums WHERE release_id = $1",
    [request.params.album],
    (result) => {
      if (result.rowCount >= 1) {
        let params = [request.params.playlist, request.params.album];
        db.queryParams(
          "DELETE FROM public.albums WHERE playlist_id = $1 AND release_id = $2",
          params,
          (result) => {

            //Disconnecting from DB
            db.disconnect();
            
            if (result.rowCount == 1) {
              response.writeHead(200, { "Content-Type": "application/json" });
              let message = JSON.stringify({ message: "Release was deleted." });
              response.end(message);
            } else {
              response.writeHead(500, { "Content-Type": "application/json" });
              let message = JSON.stringify({ message: "An error occured. Release was not deleted." })
              response.end(message);
            }
          }
        );
      } else {
        response.writeHead(404, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            message: "Release ID #" + request.params.id + "does not exist.",
          })
        );
      }
    }
  );
};

/** Removes playlist from DB */
const removePlaylist = (request, response) => {
  //Connecting to DB
  db.connect();
  //Retrieving parameters
  let params = [request.params.playlist];

  db.queryParams(
    "SELECT * FROM public.albums WHERE playlist_id = $1",
    params,
    (result) => {
      if (result.rowCount > 0) {
        //Deleting content of playlist
        db.queryParams(
          "DELETE FROM public.albums WHERE playlist_id = $1",
          params,
          (result) => {
            if (result.rowCount >= 1) {
              db.queryParams(
                "DELETE FROM public.playlists WHERE id = $1",
                params,
                (result) => {
                  //Disconnecting from DB
                  db.disconnect();

                  if (result.rowCount == 1) {
                    response.writeHead(200, {
                      "Content-Type": "application/json",
                    });
                    let message = JSON.stringify({
                      message: "Playlist was deleted.",
                    });
                    response.end(message);
                  } else {
                    response.writeHead(404, {
                      "Content-Type": "application/json",
                    });
                    let message = JSON.stringify({
                      message:
                        "An error occured. The playlist was not deleted.",
                    });
                    response.end(message);
                  }
                }
              );
            }
          }
        );
      } else {
        db.queryParams(
          "DELETE FROM public.playlists WHERE id = $1",
          params,
          (result) => {
            //Disconnecting from DB
            db.disconnect();

            if (result.rowCount == 1) {
              response.writeHead(200, { "Content-Type": "application/json" });
              let message = JSON.stringify({
                message: "Playlist was deleted.",
              });
              response.end(message);
            } else {
              response.writeHead(404, { "Content-Type": "application/json" });
              let message = JSON.stringify({
                message: "An error occured. The playlist was not deleted.",
              });
              response.end(message);
            }
          }
        );
      }
    }
  );
};

//Making functions public
module.exports = {
  getPlaylists,
  getReleases,
  savePlaylist,
  saveRelease,
  removeAlbum,
  removePlaylist,
};
