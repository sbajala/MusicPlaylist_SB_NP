/* eslint-disable jsx-a11y/role-has-required-aria-props */
import React from "react";
import styles from "./css/DiscorgsContent.module.css";
import jazzBandIMG from "../imgs/jazzBand.svg";

import { DiscorgsContentModes as modes } from "./componentEnums";
class DiscorgsContent extends React.Component {
  /**
   * @param {*} props Properties of React component
   * @property {string} inputText Text typed by the user in the search bar client application.
   * @property {boolean} isLoaded Indicates if the app did received all the data from a previous fetch or not.
   * @property {array} data Holds the information retrieved from a fetch request as JSON.
   * @property {array} savedPlaylists saved playlists passed as a property from parent class App, contains info about our own API
   * @property {JSX} savedPlaylistsJSX to display the information stored in savedPlaylists as JSX.
   * @property {JSX} albumsJSX Main source of what we will display to the user, depends on [data] and [mode].
   * @property {enum} mode Affects albumsJSX in the way we will display the information [MultipleAlbums: in a grid with 4 columns / SingleAlbum: col-12 full width of the page]
   * @property {string} filter filter passed to fetch https://api.discorgs...
   * @property {string} additionalMedia Images and other relevant data that are not found in the new data.
   * @property {object} statusMessage Used to display useful information to the user.
   * @property {object} message Alert message for the user, object{ok: (boolean) Success state or not, message:(string) data}
   * @property {object} dicorgsRateLimitUsed Stores counters of requests made to disocgs API; use endpoints of the same API as field names.
   */
  constructor(props) {
    super(props);
    this.state = {
      inputText: "",
      isLoaded: true,
      data: [],
      savedPlaylists: [],
      savedPlaylistsJSX: <div></div>,
      albumsJSX: (
        <div className="col" id={styles.listenTo}>
          <h1 className="text-center">What do you want to listen to?</h1>
          <img src={jazzBandIMG} alt="jazz band" />
        </div>
      ),
      mode: modes.MultipleAlbums,
      filter: "artist",
      additionalMedia: [],
      statusMessage: {},
      messageJSX: <div></div>,
      dicorgsRateLimitUsed: {
        search: 0,
        masters: 0,
      },
    };
  }

  resetAPIRequests = async (fieldName, requestLimit) => {
    if (this.state.dicorgsRateLimitUsed[fieldName] >= requestLimit) {
      this.setState({
        statusMessage: {
          ok: false,
          message: "Too many requests, please wait 60 seconds",
        },
      });
      const refreshTime = 60000;
      await this.timeOutPromise(refreshTime);
      this.setState({
        statusMessage: {
          ok: true,
          message: "Thanks for waiting!",
        },
      });
    }
  };

  timeOutPromise = (msTime) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve, msTime);
    });
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.savedPlaylists !== prevState.savedPlaylists) {
      return { savedPlaylists: nextProps.savedPlaylists };
    }
    return null;
  }

  updateSavedPlaylistsJSX = () => {
    let playlistJSX = [];
    this.state.savedPlaylists.map((tracklist) => {
      let row = (
        <div className="row tracklistElement" key={tracklist.name}>
          <div className="col">
            <span>{tracklist.name}</span>
          </div>
          <div className="col-2">
            <button
              onClick={(event) => {
                this.handleOnClickAddInPlaylist(event);
              }}
              style={{
                margin: "0.5% 0 0.5% 0",
                background: "none",
                color: "white",
                border: "none",
              }}
            >
              <input type="hidden" className="releaseId" name="releaseId" />
              <input
                type="hidden"
                className="playlistId"
                name="playlistId"
                value={tracklist.id}
              />
              <b>+</b>
            </button>
          </div>
        </div>
      );
      playlistJSX.push(row);
      return true;
    });
    if (playlistJSX.length !== 0) {
      this.setState({
        savedPlaylistsJSX: playlistJSX,
        albumsJSX: (
          <div className="col" id={styles.listenTo}>
            <h1 className="text-center">What do you want to listen to?</h1>
            <img src={jazzBandIMG} alt="jazz band" />
          </div>
        ),
      });
    }
  };

  componentDidMount() {
    if (this.props.playlistId === 0) {
      this.updateSavedPlaylistsJSX();
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    //TODO: Modify API access, get token and info without sending the key in the URL.
    let url =
      "https://api.discogs.com/database/search?artist='" +
      this.state.inputText +
      "'&key=VUOrRLOIOnctmQdwiGKg&secret=YscHuQtQIOwyYKJapjStsQOKtQIfGNvF";
    if (this.state.filter === "album") {
      url =
        "https://api.discogs.com/database/search?q='" +
        this.state.inputText +
        "'&format='album'&key=VUOrRLOIOnctmQdwiGKg&secret=YscHuQtQIOwyYKJapjStsQOKtQIfGNvF";
    }
    try {
      if (
        prevProps.savedPlaylists.length !== this.props.savedPlaylists.length ||
        this.props.savedPlaylists.length === 0
      ) {
        this.updateSavedPlaylistsJSX();
      }

      if (prevState.statusMessage !== this.state.statusMessage) {
        this.setState({ messageJSX: this.getMessageJSX() });
      }

      let isDataStateEmpty = this.state.data.length === 0;
      let hasInputTextChanged = prevState.inputText !== this.state.inputText;
      let isEmptyInputText = this.state.inputText.length !== 0;
      //Runs the first time asign JSON to data.
      if (isDataStateEmpty && isEmptyInputText) {
        this.resetAPIRequests("search", 55);
        const response = await fetch(url);
        const json = await response.json();
        this.setState(
          {
            data: json,
            isLoaded: true,
          },
          () => {
            //TODO: Count the amount of request to the API that we do to dont surpass the limit of requests.

            //Runs only AFTER this.setState has finished, similar to await this.setState
            this.setState({ albumsJSX: this.updateAlbumsJSX() });
            this.addOneInDicorgsRateLimit("search");
          }
        );
      } else if (hasInputTextChanged) {
        if (this.state.mode !== modes.MultipleAlbums) {
          //If the user type something different in the search bar, set mode to multiple albums
          this.setState({ mode: modes.MultipleAlbums });
        }
        this.setState({ isLoaded: false });
        this.resetAPIRequests("search", 55);
        const response = await fetch(url);
        const json = await response.json();
        this.setState(
          {
            data: json,
            isLoaded: true,
          },
          () => {
            this.setState({ albumsJSX: this.updateAlbumsJSX() });
            this.addOneInDicorgsRateLimit("search");
          }
        );
      } else if (prevState.mode !== this.state.mode) {
        this.setState({ albumsJSX: this.updateAlbumsJSX() });
      }
    } catch (e) {
      console.error(e);
    }
  }

  addOneInDicorgsRateLimit = (fieldName) => {
    let newdicorgsRateLimitUsed = {};

    for (const val in this.state.dicorgsRateLimitUsed) {
      if (val === fieldName) {
        newdicorgsRateLimitUsed[val] = this.state.dicorgsRateLimitUsed[val] + 1;
      } else {
        newdicorgsRateLimitUsed[val] = this.state.dicorgsRateLimitUsed[val];
      }
    }

    this.setState({
      dicorgsRateLimitUsed: newdicorgsRateLimitUsed,
    });
  };

  /**
   *
   * @param {object} event
   */
  handleSearch = (event) => {
    this.setState({ inputText: event.target.value });
  };

  handleOnMouseOverAlbum = (event) => {
    event.currentTarget.style = "background-color:#2b2b2b; margin:5% 0 5% 0";
  };

  handleOnMouseOutAlbum = (event) => {
    event.currentTarget.style = "background-color:#1c1c1c; margin:5% 0 5% 0";
  };

  handleOnClickAlbum = async (event) => {
    let masterId = event.currentTarget.children.item(0).children.item(0).value; // Button >> Div >> Input.value
    let thumbSource = event.currentTarget.children
      .item(0)
      .children.item(1)
      .children.item(0).src; //Button >> Div >> Div >> Image >> Src

    let url = "https://api.discogs.com/masters/" + masterId;
    try {
      this.resetAPIRequests("masters", 22);
      const response = await fetch(url);
      const json = await response.json();
      this.setState(
        {
          data: json,
          mode: modes.SingleAlbum,
          additionalMedia: { image: thumbSource },
        },
        this.addOneInDicorgsRateLimit("masters")
      );
    } catch (e) {
      console.error(e);
    }
  };

  handleOnChangeFilter = (event) => {
    this.setState({ filter: event.target.value });
  };

  handleOnClickAddAlbum = async (event) => {
    document.getElementById("playlistForm").classList.remove(styles.invisible);
    document.getElementById("playlistForm").classList.add(styles.visible);

    let children = event.currentTarget.children;
    let releaseId = parseInt(children.item(0).value);
    for (let elem of document.getElementsByClassName("releaseId")) {
      elem.value = releaseId;
    }
  };

  handleOnClickNewPlaylist = async (event) => {
    try {
      let playlistName = document.getElementById("playlistName").value.trim();
      if (playlistName.length > 0) {
        let url = "http://localhost:8000/playlists/save";
        let bodyJSON = JSON.stringify([{ id: 0, name: playlistName }]);
        let response = await fetch(url, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-type": "application/json",
          },
          body: bodyJSON,
        });
        let json = await response.json();
        this.setState({
          statusMessage: {
            ok: response.status === 200,
            ...json,
          },
        });
        //Update savedPlaylists
        this.props.setSavedPlaylists([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  handleOnClickAddInPlaylist = async (event) => {
    let album = {};
    album["playlist_id"] = parseInt(event.currentTarget.children.item(1).value);
    let releaseId = parseInt(event.currentTarget.children.item(0).value);
    album["id"] = releaseId;
    let selectedAlbum = undefined;
    this.state.data.results.map((result) => {
      if (result.master_id === releaseId) {
        selectedAlbum = result;
      }
      return true;
    });

    //imageUrl
    if (selectedAlbum !== undefined) {
      album["title"] = selectedAlbum.title;
      album["genres"] = [selectedAlbum.genre[0]];
      album["year"] = selectedAlbum.year;
      album["uri"] = selectedAlbum.uri;
      album["thumb"] = selectedAlbum.thumb;

      //Fetch for more information [artists, tracklist]
      let url = "https://api.discogs.com/masters/" + releaseId;
      this.resetAPIRequests("masters", 22);
      let response = await fetch(url);
      let json = await response.json();
      album["artists"] = json.artists;
      album["tracklist"] = json.tracklist;

      //Fetch post new album
      url = "http://localhost:8000/playlists";
      response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify([album]),
      });
      json = await response.json();
      this.setState(
        {
          statusMessage: {
            ok: response.status === 200,
            ...json,
          },
        }
        //this.addOneInDicorgsRateLimit("masters")
      );
    }
  };

  multipleAlbumsJSX = () => {
    if (this.state.data.results !== undefined) {
      this.setState({ albumsJSX: [] });
      let albumJSXArray = [];
      const uniqueMaster = {};

      //I. Check if data.results is empty:
      if (this.state.data.results.length === 0) {
        return (
          <div className="col" id={styles.listenTo}>
            <h1 className="text-center">What do you want to listen to?</h1>
            <img src={jazzBandIMG} alt="jazz band" />
          </div>
        );
      }

      albumJSXArray.push(
        <div
          className={" container " + styles.invisible}
          key="playlistForm"
          id="playlistForm"
        >
          <div className={"row "}>
            <div className={"col-4 offset-4 " + styles.playlistForm}>
              <div className="container">
                <div className="row" style={{ margin: "2% 0 2% 0" }}>
                  <div className="col">
                    <b
                      style={{
                        textDecoration: "underline",
                        margin: "2% 0 1% 0",
                      }}
                    >
                      Save to...
                    </b>
                  </div>
                  <div className="col-2">
                    <button
                      onClick={() => {
                        document
                          .getElementById("playlistForm")
                          .classList.remove(styles.visible);
                        document
                          .getElementById("playlistForm")
                          .classList.add(styles.invisible);
                      }}
                      style={{
                        backgroundColor: "white",
                        color: "black",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                      }}
                    >
                      <b>x</b>
                    </button>
                  </div>
                </div>
              </div>
              {this.state.savedPlaylistsJSX}
              <div className="row" id="savedPlaylist"></div>
              <div style={{ margin: 0 }} className="row">
                <input
                  type="text"
                  name="playlistName"
                  id="playlistName"
                  style={{ marginTop: "10%" }}
                />
                <button
                  onClick={(event) => {
                    this.handleOnClickNewPlaylist(event);
                  }}
                >
                  Create new playlist
                </button>
              </div>
            </div>
          </div>
        </div>
      );
      albumJSXArray.push(
        <b key="Bold Exploring">
          <h3 key="Exploring" id={styles.exploring}>
            Exploring {this.state.inputText}
          </h3>
        </b>
      );

      for (let i = 0; i < this.state.data.results.length; i++) {
        const result = this.state.data.results[i];
        if (uniqueMaster[result.master_id] === undefined) {
          //{Unique master : Has been display(false)}
          uniqueMaster[result.master_id] = false;
        }

        //Filtered by UNIQUE MASTER_ID
        if (uniqueMaster[result.master_id] === false) {
          albumJSXArray.push(
            <div
              key={result.id}
              className={"col-3 " + styles.albumCard}
              onMouseOver={(event) => {
                this.handleOnMouseOverAlbum(event);
              }}
              onMouseOut={(event) => {
                this.handleOnMouseOutAlbum(event);
              }}
            >
              <div
                role={"button"}
                key={"albumsContainer"}
                onClick={(event) => {
                  this.handleOnClickAlbum(event);
                }}
              >
                <div className="container">
                  <input id="masterId" type="hidden" value={result.master_id} />
                  <div className="row">
                    <img
                      className={styles.albumCardImage}
                      src={result.thumb}
                      alt={result.title}
                      onError={(event) => {
                        event.target.src =
                          "https://user-images.githubusercontent.com/101482/29592647-40da86ca-875a-11e7-8bc3-941700b0a323.png";
                      }}
                    />
                    <button
                      className={"btn btn-success " + styles.addAlbumButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        this.handleOnClickAddAlbum(event);
                      }}
                    >
                      +
                      <input
                        type="hidden"
                        name="master_id"
                        value={result.master_id}
                      />
                    </button>
                  </div>
                  <div className={"row text-justify " + styles.resultTitle}>
                    <b>{result.title}</b>
                  </div>
                </div>
              </div>
            </div>
          );

          //Unique master was display
          uniqueMaster[result.master_id] = true;
        }
      }
      return albumJSXArray;
    } else {
      return <p>Loading . . .</p>;
    }
  };

  singleAlbumJSX = () => {
    let tracklist = [];
    let index = 1;
    if (this.state.data.message !== undefined) {
      return <h3>{this.state.data.message}</h3>;
    }

    this.state.data.tracklist.forEach((track) => {
      tracklist.push(
        <div
          className="container"
          id={styles.singleAlbumContainer}
          key={track.title + index}
        >
          <div className="row">
            <div className="col-1">{index}</div>
            <div className="col">
              <b>{track.title}</b>
            </div>
            <div className="col-1 align-self-end">{track.duration}</div>
          </div>
        </div>
      );
      index++;
    });

    let artistName = "";
    if (
      this.state.data.artists !== undefined &&
      this.state.data.artists[0] !== undefined &&
      this.state.data.artists[0].name !== undefined
    ) {
      artistName = this.state.data.artists[0].name;
    }

    return (
      <>
        <div className="col-3">
          <img src={this.state.additionalMedia.image} alt="Album cover" />
        </div>
        <div className={"col-9 " + styles.singleAlbumParentContainer}>
          <div className="container">
            <div className="row">album</div>
            <div className="row">
              <b className={styles.singleAlbumTitle}>
                <h1>{this.state.data.title}</h1>
              </b>
              <div className={styles.singleAlbumTitle}>{artistName}</div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="container">
              <div className="row">{tracklist}</div>
            </div>
          </div>
        </div>
      </>
    );
  };

  updateAlbumsJSX = () => {
    switch (this.state.mode) {
      case modes.MultipleAlbums:
        return this.multipleAlbumsJSX();

      case modes.SingleAlbum:
        this.setState({ albumsJSX: [] });
        return this.singleAlbumJSX();

      default:
        return <div></div>;
    }
  };

  getMessageJSX = () => {
    let row = <div></div>;
    if (this.state.statusMessage.ok !== undefined) {
      //Error message
      row = (
        <div className={"alert alert-danger " + styles.message} role="alert">
          {this.state.statusMessage.message}
        </div>
      );
      if (this.state.statusMessage.ok) {
        //Success message
        row = (
          <div className={"alert alert-success " + styles.message} role="alert">
            {this.state.statusMessage.message}
          </div>
        );
      }
    }
    return row;
  };

  render() {
    return (
      <div className={styles.DiscorgsContent}>
        <div className="container">
          <div className="row">
            <div className="col-10 offset-1">
              <div className="container">
                {this.state.messageJSX}
                <div className={"row "} id={styles.searchBar}>
                  <input
                    value={this.state.inputText}
                    className="form-control"
                    type="text"
                    placeholder="Search..."
                    onChange={this.handleSearch}
                  />
                </div>
                <div className={"row"} id={styles.filtersRow}>
                  <div className="col-1">Filters: </div>
                  <div className="col form-check form-switch">
                    <div className="container">
                      <div className="row">
                        <label id="artistLabel" className="col-2">
                          By artist
                          <input
                            name="filter"
                            className="form-check-input"
                            type="radio"
                            role="switch"
                            id="artist"
                            value={"artist"}
                            onChange={(event) => {
                              this.handleOnChangeFilter(event);
                            }}
                            checked={this.state.filter === "artist"}
                          />
                        </label>
                        <label id="albumLabel" className="col-2">
                          By album
                          <input
                            name="filter"
                            className="form-check-input"
                            type="radio"
                            role="switch"
                            id="album"
                            value={"album"}
                            onChange={(event) => {
                              this.handleOnChangeFilter(event);
                            }}
                            checked={this.state.filter === "album"}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                id="album-container"
                className={
                  "container " + this.state.isLoaded
                    ? " opacity-100"
                    : "opacity-50"
                }
              >
                <div id="album-row" className="row">
                  {this.state.albumsJSX}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DiscorgsContent;
