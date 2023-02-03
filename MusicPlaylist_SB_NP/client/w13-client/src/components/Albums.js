import React from "react";
import addMusicImage from "../imgs/addMusic.svg";
import style from "./css/AlbumsContent.module.css";

class Albums extends React.Component {
  constructor(props) {
    super(props);

    //Setting initial state
    this.state = {
      playlist_data: [],
      isLoading: true,
      dataJSX: [],
      message: "",
      playlistId: this.props.playlistId
    };
  }

  componentDidMount() {
    this.getData();
  }

  //If playlist length have changed, the state is updated
  componentDidUpdate(prevProps, prevState) {
    if (prevState.playlist_data.length !== this.state.playlist_data.length) {
      this.getData();
    }
  }

  getData = async () => {
    let playlistId = this.state.playlistId;
    let url = "http://localhost:8000/playlists/" + playlistId;
    let response = await fetch(url, {
      method: "GET",
      mode: "cors",
    });
    if (response.status === 200) {
      let data = await response.json();
      this.setState({
        playlist_data: data,
        isLoading: false,
        dataJSX: this.setDataJSX(),
        message: "",
      });
    } else {
      this.setState({ dataJSX: this.setDataJSX() });
    }
  };

  //Returning to search page
  handleOnImageClick = async () => {
      this.props.setPlaylistId(0)
  };

  //Deleting album from playlist
  handleOnDeleteAlbum = async (event) => {
    console.log("In delete method");
    let albumId = event.target.value;
    let playlistId = this.state.playlistId;
    let url = "http://localhost:8000/playlists/" + playlistId + "/" + albumId;
    let response = await fetch(url, {
      method: "DELETE",
      mode: "cors",
    });
    let data = await response.json();
    console.log("Data from deleted method", data);
    if (response.status === 200) {
      this.setState({ message: "Album removed!", data: this.getData()});
    } else {
      let status_message = response.statusText;
      this.setState({ message: status_message, data: this.getData()});
    }
  };

  setDataJSX = () => {
    //Setting data
    const data = this.state.playlist_data;
    let content = [];
    if (data.length === 0 || data === []) {
      content = (
        <tbody>
          <tr>
            <td>
              <img
                src={addMusicImage}
                alt="add music"
                title="Add music"
                className={style.img}
                onClick={() => this.handleOnImageClick()}
              />
            </td>
          </tr>
        </tbody>
      );
      this.setState({
        message: "Playlist is empty. Look for some music to add!",
        dataJSX: content,
      });
    } else {
      content = data.map((item) => {
        return (
          <tbody key={item.release_id}>
            <tr key={item.release_id}>
              <td>
                <img src={item.image_url} alt={item.artists} />
                <div>
                  <b>
                    {item.title} - {item.artists}
                  </b>
                </div>
                <div>
                  <b>ID #</b>
                  {item.release_id}
                </div>
                <div>
                  <b>Genre: </b>
                  {item.genres}
                </div>
                <div>
                  <b>Year: </b>
                  {item.year}
                </div>
                <div>
                  <b>Tracklist</b>
                </div>
                <ol>
                  <div>
                    {item.tracklist.map((item, index) => {
                      return <li key={index}>{item}</li>;
                    })}
                  </div>
                </ol>
                <div>
                  <b>URI:</b> {item.uri}
                </div>
                <br/>
                <div>
                  <button className={style.button}
                    value={item.release_id}
                    onClick={(event) => {
                      this.handleOnDeleteAlbum(event);
                    }}
                  >
                    Remove
                  </button>
                </div>
                <hr className="rounded"/>
              </td>
            </tr>
          </tbody>
        );
      });
    }

    return content;
  };

  render() {
    //Setting message if still loading
    if (this.state.isLoaded) {
      return <div>Loading...</div>;
    }

    //Setting message if data is yet to be retrieved
    if (!this.state.playlist_data) {
      return <div>Waiting for data...</div>;
    }

    return (
      <div style={{ color: "white" }}>
        <button className={style.button}
          onClick={() => {
            this.props.setPlaylistId(0);
          }}
        >
          return
        </button>
        <div className={style.outerDiv}> 
          <div><h1>My Playlist</h1></div>
          <br/>
          <div><p >{this.state.message}</p></div>
          <table>{this.state.dataJSX}</table>
        </div>
      </div>
    );
  }
}

export default Albums;
