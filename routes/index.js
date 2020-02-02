var express = require('express');
var router = express.Router();
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'client', 'build')));

var SpotifyWebApi = require('spotify-web-api-node');
scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'user-follow-read', 'playlist-modify-public', 'playlist-modify-private'];

router.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

var spotifyApi = new SpotifyWebApi({
  clientId: "527e8f09845b4969a15a9405ce026c69",
  clientSecret: "79a5a2cb300b416c87749a4db42d62c6",
  redirectUri: "http://localhost:8081/api/callback"
});

router.get('/login', (req, res) => {
  var html = spotifyApi.createAuthorizeURL(scopes);
  // console.log(html);
  res.redirect(html + "&show_dialog=true");
});

router.get('/callback', async (req, res) => {
  const {code} = req.query;
  try {
    var data = await spotifyApi.authorizationCodeGrant(code);
    const {access_token, refresh_token} = data.body;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    // console.log("Access Token: " + access_token);
    // console.log("Refresh Token: " + refresh_token);

    res.redirect('/api/generate_playlist'); // todo will change this
  } catch (err) {
    res.redirect('/#/error/invalid token');
  }
});

router.get('/generate_playlist', async (req, res) => {
  try {
    // todo take input from req body for use in algorithm
    var playlistSizeGoal = 30;
    var playlistName = "temp title"; // todo figure out playlist naming convention
    var playlistDescription = "temp description";

    // STEP 1. Gather all top artists from the user.
    var topArtists = await spotifyApi.getMyTopArtists({limit: 20, time_range: "long_term"});

    // STEP 2. Gather all artists that the user is following.
    var followedArtists = await spotifyApi.getFollowedArtists({limit: 20});

    // STEP 3. Gather all the artist URIs (skip duplicates)
    var artistIDs = getArtistIDs(topArtists, followedArtists);

    // STEP 4. Gather the top ten tracks from each of the gathered artists
    var trackURIs = [];

    for (i = 0; i < artistIDs.length; i++) {
      a = artistIDs[i];
      var topTracks = await spotifyApi.getArtistTopTracks(a, "US");
      for (var j = 0; j < topTracks.body["tracks"].length; j++) {
        trackURIs.push(topTracks.body["tracks"][j]["uri"]);
      }
    }

    // STEP 5. Obtain all the track audio features and TODO add algorithm to filter
    var finalTracks = []; // list of final track URIs that will be added to the playlist
    // var allAudioFeatures = [];
    // start = 0;
    // end = 20;
    // while (end < tracks.length) {
    //   // (only gathering 20 songs at a time because of URI being too long)
    //   var tempAudioFeatures = await spotifyApi.getAudioFeaturesForTracks(tracks.slice(start, end));
    //   // TODO instead of concat-ing all the audio features, will be filtering here
    //   // and will be adding the valid track IDs to validTracks
    //   allAudioFeatures = allAudioFeatures.concat(tempAudioFeatures.body["audio_features"]);
    //   start = end + 1;
    //   end += 20;
    // }

    // STEP 6. Use Recommendation Seed api call in case there's not enough songs or user has no data
    if (finalTracks.length < playlistSizeGoal) {
      // todo the actual target values will be from algorithm, currently giving sad songs
      var obj = {
        limit: playlistSizeGoal - finalTracks.length,
        target_danceability: 0.4,
        target_energy: 0.4,
        target_valence: 0
      };

      if (artistIDs.length === 0) {
        // In the case the user has 0 data, no top artists
        obj["seed_genres"] = ["acoustic", "pop", "rock", "classical", "alternative"]
      } else {
        // Otherwise, use the data's top 5 favorite artists as seed
        obj["seed_artists"] =  artistIDs.splice(0, 5);
      }
      var recommendations = await spotifyApi.getRecommendations(obj);

      // Adding recommendations
      for (var t = 0; t < recommendations.body["tracks"].length; t++) {
        var trackURI = recommendations.body["tracks"][t]["uri"];
        if (!finalTracks.includes(trackURI)) { // to ensure no duplicate tracks
          finalTracks.push(trackURI);
        }
      }
    }

    // STEP 7. Create Playlist and Add Songs
    var getCurrentUserData = await spotifyApi.getMe();
    var userID = getCurrentUserData.body["id"];

    var createPlaylist = await spotifyApi.createPlaylist(userID, playlistName, {"description": playlistDescription});
    var playlistID = createPlaylist.body["id"];

    // Randomize the order of the tracks and narrow down the size in case we have > playlistSizeGoal
    var randomizedTracks = getRandomSubarray(finalTracks, playlistSizeGoal);

    await spotifyApi.addTracksToPlaylist(playlistID, randomizedTracks);

    // Send Playlist Link Result
    var link = "https://open.spotify.com/embed/playlist/" + playlistID;
    res.status(200).send(link);
  } catch (err) {
    res.status(400).send(err);
  }
});

function getRandomSubarray(arr, size) {
  var shuffled = arr.slice(0), i = arr.length, temp, index;
  while (i--) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(0, size);
}

function getArtistIDs(topArtists, followedArtists) {
  var artistIDs = [];
  var a;
  var i;
  for (i = 0; i < topArtists.body["items"].length; i++) {
    a = topArtists.body["items"][i];
    if (!artistIDs.includes(a["id"])) {
      artistIDs.push(a["id"]);
    }
  }

  for (i = 0; i < followedArtists.body["artists"]["items"].length; i++) {
    a = followedArtists.body["artists"]["items"][i];
    if (!artistIDs.includes(a["id"])) {
      artistIDs.push(a["id"]);
    }
  }
  return artistIDs;
}

module.exports = router;


