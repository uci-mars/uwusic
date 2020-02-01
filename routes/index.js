var express = require('express');
var router = express.Router();
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'client', 'build')));

var SpotifyWebApi = require('spotify-web-api-node');
scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'user-follow-read', 'playlist-modify-public', 'playlist-modify-private'];

/* GET home page. */
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
  console.log(html);
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
    var playlistSizeGoal = 30;
    var playlistName = "temp title";
    var playlistDescription = "temp description";

    // STEP 1. Gather all top artists from the user.
    var topArtists = await spotifyApi.getMyTopArtists({"limit": 20, "time_range": "long_term"});

    // STEP 2. Gather all artists that the user is following.
    var followedArtists = await spotifyApi.getFollowedArtists({"limit": 20});

    // STEP 3. Gather all the artist URIs (skip duplicates)
    var artistURIs = getArtistURIs(topArtists, followedArtists);

    // STEP 4. Gather the top ten tracks from each of the gathered artists
    var tracks = [];
    var fullTrackIds = [];
    var trackNames = []; // for the sake of debugging to view track names
    // console.log(artistURIs);

    // go through all the artists and get their top 10 tracks
    for (i = 0; i < artistURIs.length; i++) {
      a = artistURIs[i].split(":")[2];
      var topTracks = await spotifyApi.getArtistTopTracks(a, "US");
      // console.log(topTracks.body["tracks"]);
      for (var j = 0; j < topTracks.body["tracks"].length; j++) {
        var trackID = topTracks.body["tracks"][j]["id"];
        tracks.push(trackID);
        fullTrackIds.push("spotify:track:" + trackID);
        trackNames.push(topTracks.body["tracks"][j]["name"]);
      }
    }

    // STEP 5. Obtain all the track audio features and TODO add algorithm to filter
    var validTracks = [];
    var allAudioFeatures = [];
    start = 0;
    end = 20;
    while (end < tracks.length) {
      // (only gathering 20 songs at a time because of URI being too long)
      var tempAudioFeatures = await spotifyApi.getAudioFeaturesForTracks(tracks.slice(start, end));
      // TODO instead of concat-ing all the audio features, will be filtering here
      // and will be adding the valid track IDs to validTracks
      allAudioFeatures = allAudioFeatures.concat(tempAudioFeatures.body["audio_features"]);
      start = end + 1;
      end += 20;
    }

    // TODO STEP 6. Use Recommendation Seed api call in case there's not enough songs
    // using Mayank's target values for the different audio features to search for songs
    if (validTracks.length < playlistSizeGoal) {

    }

    // STEP 7. Generate Playlist
    var getCurrentUserData = await spotifyApi.getMe();
    var userID = getCurrentUserData.body["id"];

    var createPlaylist = await spotifyApi.createPlaylist(userID, playlistName, {"description": playlistDescription});
    var playlistID = createPlaylist.body["id"];
    // console.log(playlistID);

    // console.log(fullTrackIds);
    // TODO change this from using fullTrackIds to only using the filtered in trackIds from the algorithm and recommendations
    // for now just using fullTrackIds for testing playlist creation
    var randomizedTracks = getRandomSubarray(fullTrackIds, playlistSizeGoal);
    await spotifyApi.addTracksToPlaylist(playlistID, randomizedTracks);

    res.status(200).send(randomizedTracks); // right now, just the randomized tracks but will be tracks from algorithm in future
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

function getArtistURIs(topArtists, followedArtists) {
  // var artistNames = []; // for the sake of viewing artist names w debugging
  var artistURIs = [];
  var a;
  var i;
  for (i = 0; i < topArtists.body["items"].length; i++) {
    a = topArtists.body["items"][i];
    if (!artistURIs.includes(a["uri"])) {
      // artistNames.push(a["name"]);
      artistURIs.push(a["uri"]);
    }
  }

  for (i = 0; i < followedArtists.body["artists"]["items"].length; i++) {
    a = followedArtists.body["artists"]["items"][i];
    if (!artistURIs.includes(a["uri"])) {
      // artistNames.push(a["name"]);
      artistURIs.push(a["uri"]);
    }
  }
  return artistURIs;
}

module.exports = router;


