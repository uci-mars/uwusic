var express = require('express');
var router = express.Router();

var SpotifyWebApi = require('spotify-web-api-node');
scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'user-follow-read', 'playlist-modify-public', 'playlist-modify-private'];

var spotifyApi = new SpotifyWebApi({
  clientId: "527e8f09845b4969a15a9405ce026c69",
  clientSecret: "79a5a2cb300b416c87749a4db42d62c6",
  redirectUri: "http://localhost:3000/callback"
});

router.get('/', function (req, res) {
  res.render('index', {title: 'Express'});
});

router.get('/login', (req, res) => {
  var html = spotifyApi.createAuthorizeURL(scopes);
  console.log(html);
  res.redirect(html + "&show_dialog=true");
});

router.get('/callback', async (req, res) => {
  const {code} = req.query;
  console.log(code);
  try {
    var data = await spotifyApi.authorizationCodeGrant(code);
    const {access_token, refresh_token} = data.body;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    console.log("Access Token: " + access_token);
    console.log("Refresh Token: " + refresh_token);

    res.redirect('/generate_playlist'); // todo will change this
  } catch (err) {
    res.redirect('/#/error/invalid token');
  }
});

router.get('/generate_playlist', async (req, res) => {
  try {
    // STEP 1. Gather all top artists from the user.
    var topArtists = await spotifyApi.getMyTopArtists({"limit": 20, "time_range": "long_term"});
    // console.log(topArtists.body);

    // STEP 2. Gather all artists that the user is following.
    var followedArtists = await spotifyApi.getFollowedArtists({"limit": 20});
    // console.log(followedArtists.body);

    // STEP 3. Gather all the artist URIs (skip duplicates)
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

    // STEP 5. Obtain all the track audio features
    // console.log(tracks);
    var allAudioFeatures = [];
    start = 0;
    end = 20;
    while (end < tracks.length) {
      // (only gathering 20 songs at a time because of URI being too long)
      var tempAudioFeatures = await spotifyApi.getAudioFeaturesForTracks(tracks.slice(start, end));
      allAudioFeatures = allAudioFeatures.concat(tempAudioFeatures.body["audio_features"]);
      start = end + 1;
      end += 20;
    }
    // console.log(allAudioFeatures);

    // TODO STEP 6. Algorithm to Filter Songs


    // STEP 7. Generate Playlist
    var getCurrentUserData = await spotifyApi.getMe();
    var userID = getCurrentUserData.body["id"];

    var createPlaylist = await spotifyApi.createPlaylist(userID, "lol xd", {"description": "Temp Description"});
    var playlistID = createPlaylist.body["id"];
    // console.log(playlistID);

    // todo right now we're adding 30 songs, can be changed
    // console.log(fullTrackIds);
    var randomizedTracks = getRandomSubarray(fullTrackIds, 30);
    var addTracksToPlaylist = await spotifyApi.addTracksToPlaylist(playlistID,  randomizedTracks);

    res.status(200).send(trackNames);
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

module.exports = router;


