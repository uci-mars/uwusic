var express = require('express');
var router = express.Router();
const path = require('path');
var algo = require('./algo.js');
var fetch = require('node-fetch');

const app = express();


app.use(express.static(path.join(__dirname, 'client', 'build')));

var SpotifyWebApi = require('spotify-web-api-node');
scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'user-follow-read', 'playlist-modify-public', 'playlist-modify-private'];

var spotifyApi = new SpotifyWebApi({
  clientId: "527e8f09845b4969a15a9405ce026c69",
  clientSecret: "79a5a2cb300b416c87749a4db42d62c6",
  redirectUri: "http://localhost:8081/api/callback"
});

var userID;
const baseLink = "https://open.spotify.com/embed/playlist/";
const defaultGenreSeeds = ["acoustic", "pop", "rock", "classical", "alternative"];

router.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

router.get('/login', (req, res) => {
  var html = spotifyApi.createAuthorizeURL(scopes);
  res.redirect(html + "&show_dialog=true");
});

router.get('/callback', async (req, res) => {
  const {code} = req.query;
  try {
    var data = await spotifyApi.authorizationCodeGrant(code);
    const {access_token, refresh_token} = data.body;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    var getCurrentUserData = await spotifyApi.getMe();
    userID = getCurrentUserData.body["id"];
    displatName = getCurrentUserData.body["display_name"];

    // console.log("Access Token: " + access_token);
    // console.log("Refresh Token: " + refresh_token);

    res.redirect('/launch');
  } catch (err) {
    res.redirect('/#/error/invalid token');
  }
});

router.post('/generate_playlist', async (req, res) => {
  try {
    fetch("https://api.openweathermap.org/data/2.5/weather?q=Irvine&APPID=0c65abcbf74e0d967f0d1bb61f37d707", {
      method: 'GET'
    }).then(response => response.json()).then(w => console.log(w.weather[0].main));
    console.log(req.body);
    var neutral = req.body["neutral"];
    var happy = req.body["happy"];
    var sad = req.body["sad"];
    var angry = req.body["angry"];
    var forecast = "clear sky";
    var expressions = {
      neutral: req.body["neutral"],
      happy: req.body["happy"],
      sad: req.body["sad"],
      angry: req.body["angry"],
      surprised: req.body["surprised"],
      disgusted: req.body["disgusted"],
      fearful: req.body["fearful"],
    };

    var mostDominantExpression = getMostDominantExpression(expressions);
    // if we are unable to find a dominant expression (just in case) or any of these other emotions pop up, return a neutral playlist
    if (mostDominantExpression === "" || (mostDominantExpression !== "happy" && mostDominantExpression !== "sad" && mostDominantExpression !== "angry")) {
      neutral = 1;
    } else {
      neutral = 0;
    }

    var playlistSizeGoal = 25;
    var playlistName = "Feeling " + mostDominantExpression;
    var playlistDescription = "This is a dynamically generated playlist by uwusic!";

    // STEP 1. Gather all top artists from the user.
    var topArtists = await spotifyApi.getMyTopArtists({limit: 20, time_range: "long_term"});

    // STEP 2. Gather all the artist URIs (skip duplicates)
    var artistIDs = getArtistIDs(topArtists);

    // STEP 3. Gather the top ten tracks from each of the gathered artists
    var trackURIs = [];
    var trackIDs = [];

    for (i = 0; i < artistIDs.length; i++) {
      var topTracks = await spotifyApi.getArtistTopTracks(artistIDs[i], "US"); // country 'US'
      for (var j = 0; j < topTracks.body["tracks"].length; j++) {
        trackURIs.push(topTracks.body["tracks"][j]["uri"]);
        trackIDs.push(topTracks.body["tracks"][j]["id"]);
      }
    }

    // STEP 4. Obtain all the track -> audio features and use algorithm to filter
    var tracksToFilter = {}; // object holding trackURI -> obj holding audio features
    start = 0;
    end = 30;
    while (end < trackIDs.length) {
      // (only gathering 30 songs at a time because of URI being too long)
      var tempAudioFeatures = await spotifyApi.getAudioFeaturesForTracks(trackIDs.slice(start, end));
      var audioFeatures = tempAudioFeatures.body["audio_features"];

      for (var af = 0; af < audioFeatures.length; af++) {
        tracksToFilter[audioFeatures[af]["uri"]] = {
          "danceability": audioFeatures[af]["danceability"],
          "energy": audioFeatures[af]["energy"],
          "valence": audioFeatures[af]["valence"],
          "mode": audioFeatures[af]["mode"],
          "acousticness": audioFeatures[af]["acousticness"]
        }
      }
      start = end + 1;
      end += 30;
    }

    var weightedAverages = algo["getWeightedAverages"](expressions["happy"], expressions["sad"], expressions["angry"], neutral, forecast);
    var filteredTracks = algo["getFilteredTracks"](weightedAverages, tracksToFilter);
    var finalTracks = new Set(filteredTracks); // set of final track URIs that will be added to the playlist

    // STEP 5. Use Recommendation Seed api call in case there's not enough songs or user has no data
    if (finalTracks.size < playlistSizeGoal) {
      // limit to playlistSizeGoal - finalTracks.size so that we don't pull too much
      var obj = {
        limit: playlistSizeGoal - finalTracks.size,
        target_danceability: weightedAverages["danceability"],
        target_energy: weightedAverages["energy"],
        target_valence: weightedAverages["valence"]
      };

      if (artistIDs.length === 0) {
        // In the case the user has 0 data, no top artists
        obj["seed_genres"] = defaultGenreSeeds
      } else {
        // Otherwise, use the data's top 5 favorite artists as seed
        obj["seed_artists"] = artistIDs.slice(0, 5);
      }
      var recommendations = await spotifyApi.getRecommendations(obj);

      // Adding recommendations
      for (var t = 0; t < recommendations.body["tracks"].length; t++) {
        finalTracks.add(recommendations.body["tracks"][t]["uri"]); // add track URI
      }
    }

    // STEP 6. Create Playlist and Add Songs
    var createPlaylist = await spotifyApi.createPlaylist(userID, playlistName, {"description": playlistDescription});
    var playlistID = createPlaylist.body["id"];

    // Randomize the order of the tracks and narrow down the size in case we have > playlistSizeGoal
    finalTracks = Array.from(finalTracks);
    var randomizedTracks = getRandomSubarray(finalTracks, playlistSizeGoal);

    await spotifyApi.addTracksToPlaylist(playlistID, randomizedTracks);

    // Send Playlist Link Result
    var link = baseLink + playlistID;
    res.status(200).send(link);
  } catch (err) {
    if (err.statusCode === 401) { // unauthorized so redirect to login
      res.redirect('/api/login');
    } else {
      res.status(400).send(err);
    }
  }
});

function getMostDominantExpression(expressions) {
  var mostDominant = "";
  var largestScore = 0;
  for (var e in expressions) {
    if (expressions.hasOwnProperty(e)) {
      if (expressions[e] >= largestScore) {
        mostDominant = e;
        largestScore = expressions[e];
      }
    }
  }
  return mostDominant;
}

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

function getArtistIDs(topArtists) {
  var artistIDs = new Set();
  var i;
  for (i = 0; i < topArtists.body["items"].length; i++) {
    artistIDs.add(topArtists.body["items"][i]["id"]);
  }
  return Array.from(artistIDs);
}

module.exports = router;


