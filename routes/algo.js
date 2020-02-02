// ALGORITHM CONSTANTS
var features = ["danceability", "energy", "valence"];

// HAPPY VALUES
var HAPPY_ACOUSTIC = 0.5;
var HAPPY_DANCEABILITY = 0.7;
var HAPPY_ENERGY = 0.7;
var HAPPY_MODE = 1;
var HAPPY_TEMPO = 0.8;
var HAPPY_VALENCE = 0.8;

// SAD VALUES
var SAD_ACOUSTIC = 0.7;
var SAD_DANCEABILITY = 0.3;
var SAD_ENERGY = 0.3;
var SAD_MODE = 0;
var SAD_TEMPO = 0.5;
var SAD_VALENCE = 0.2;

//  ANGRY VALUES
var ANGRY_ACOUSTIC = 0.5;
var ANGRY_DANCEABILITY = 0.5;
var ANGRY_ENERGY = 0.7;
var ANGRY_MODE = 1;
var ANGRY_TEMPO = 0.5;
var ANGRY_VALENCE = 0.35;

// ALGORITHM CODE
function getWeightedAverages(happy, sad, angry) {
  // place all moods in dictionary
  var allMoods = {"happy": happy, "sad": sad, "angry": angry};
  // filter for detected moods
  var detectedMoods = {};
  var m;
  for (m in allMoods) {
    if (allMoods[m] > 0) {
      detectedMoods[m] = allMoods[m];
    }
  }

  // retrieve the feature correlations for each mood
  var moodFeatures = {};
  for (m in detectedMoods) {
    if (detectedMoods.hasOwnProperty(m)) {
      moodFeatures[m] = moodToMusicFeature(m);
    }
  }

  // normalize detected moods
  var normalizedMoods = normalizeMoods(detectedMoods);

  // find weighted average of all features
  var weightedAverages = {}; // this is the goal amount of each feature
  for (var i = 0; i < features.length; i++) {
    var feature = features[i];
    var count = 0;
    featureTotal = 0;
    for (m in normalizedMoods) {
      if (normalizedMoods.hasOwnProperty(m)) {
        featureTotal += normalizedMoods[m] * moodFeatures[m][feature];
        count += 1;
        weightedAverages[feature] = parseFloat(featureTotal);
      }
    }
  }

  return weightedAverages;
}


function getFilteredTracks(weightedAverages, trackList) {
  // place all moods in dictionary
  return minDistance(weightedAverages, trackList);
}

function normalizeMoods(detectedMoods) {
  var total = Object.values(detectedMoods).reduce((a, b) => a + b, 0);
  var normalizedMoods = {};
  for (var m in detectedMoods) {
    if (detectedMoods.hasOwnProperty(m)) {
      normalizedMoods[m] = detectedMoods[m] / total;
    }
  }
  return normalizedMoods;
}

function moodToMusicFeature(mood) {
  if (mood === "happy") {
    return {
      "acousticness": HAPPY_ACOUSTIC,
      "danceability": HAPPY_DANCEABILITY,
      "energy": HAPPY_ENERGY,
      "mode": HAPPY_MODE,
      "valence": HAPPY_VALENCE
    };
  } else if (mood === "sad") {
    return {
      "acousticness": SAD_ACOUSTIC,
      "danceability": SAD_DANCEABILITY,
      "energy": SAD_ENERGY,
      "mode": SAD_MODE,
      "valence": SAD_VALENCE
    };
  } else if (mood === "angry") {
    return {
      "acousticness": ANGRY_ACOUSTIC,
      "danceability": ANGRY_DANCEABILITY,
      "energy": ANGRY_ENERGY,
      "mode": ANGRY_MODE,
      "valence": ANGRY_VALENCE
    };
  }
  // todo add more moods
}

// find distance of a desired song and an available song
function distanceBetween(desired, available) {
  var totalDistance = 0;
  for (var feature in desired) {
    if (desired.hasOwnProperty(feature)) {
      totalDistance += (desired[feature] - available[feature]) ** 2;
    }
  }
  return totalDistance;
}


function minDistance(desired, trackList) {
  var trackDistances = {};
  var track;
  for (track in trackList) {
    if (trackList.hasOwnProperty(track)) {
      trackDistances[track] = distanceBetween(desired, trackList[track]);
    }
  }
  var distancesArray = Object.values(trackDistances);
  var maxDistance = getMax(distancesArray);

  var finalTracks = [];
  for (track in trackDistances) {
    if (trackDistances.hasOwnProperty(track) && trackDistances[track] < 0.4 * maxDistance) {
      finalTracks.push(track); // only push tracks that have a distance that met the cutoff
    }
  }
  return finalTracks;
}

function getMax(arr) {
  var maxn = 0;
  for(var i = 0; i < arr.length; i++) {
    if (arr[i] > maxn) {
      maxn = arr[i];
    }
  }
  return maxn;
}

module.exports.getFilteredTracks = getFilteredTracks;
module.exports.getWeightedAverages = getWeightedAverages;