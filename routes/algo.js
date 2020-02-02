var knn = require('./KNNModel.js');

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
function getWeightedAverages(happy, sad, angry, neutral, weather) {
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
  for (m in allMoods) {
    if (allMoods.hasOwnProperty(m)) {
      moodFeatures[m] = moodToMusicFeature(m);
    }
  }

  // normalize detected moods
  var normalizedMoods = {};

  if (neutral === 0) {
    normalizedMoods = normalizeMoods(detectedMoods);
  } else {
    // include neutral for normalization
    detectedMoods["neutral"] = neutral;
    normalizedMoods = normalizeMoods(detectedMoods);

    // get the set of the weather moods
    var weatherMoods = normalizeMoods(weatherToMoods(weather));

    // weighted average of neutral and preexisting moods
    for (m in weatherMoods) {
      // if weather introduces a mood not detected by face
      if (weatherMoods.hasOwnProperty(m)){
        if (!detectedMoods.hasOwnProperty(m)) {
          normalizedMoods[m] = weatherMoods[m];
        } // otherwise update the normalized moods by weighing it
        else {
          normalizedMoods[m] = normalizedMoods[m] + normalizedMoods["neutral"]*weatherMoods[m];
        }
      }
    }
    // eject neutral
    delete normalizedMoods["neutral"];
    // normalizing again after accounting for influence of neutral
    normalizedMoods = normalizeMoods(normalizedMoods);
  }

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
      }
    }
    weightedAverages[feature] = parseFloat(featureTotal);
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
  // todo future add more moods
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

  var KNeighborsClassifier = function(nNeighbors, nClasses, power, X, y) {
    console.log(power);

    this.nNeighbors = nNeighbors;
    this.nTemplates = y.length;
    this.nClasses = nClasses;
    this.power = power;
    this.X = X;
    this.y = y;

    var Neighbor = function(clazz, dist) {
        this.clazz = clazz;
        this.dist = dist;
    };

    var compute = function(temp, cand, q) {
        var dist = 0.,
            diff;
        for (var i = 0, l = temp.length; i < l; i++) {
          diff = Math.abs(temp[i] - cand[i]);
          if (q==1) {
              dist += diff;
          } else if (q==2) {
              dist += diff*diff;
          } else if (q==Number.POSITIVE_INFINITY) {
              if (diff > dist) {
                  dist = diff;
              }
          } else {
              dist += Math.pow(diff, q);
        }
        }
        if (q==1 || q==Number.POSITIVE_INFINITY) {
            return dist;
        } else if (q==2) {
            return Math.sqrt(dist);
        } else {
            return Math.pow(dist, 1. / q);
        }
    };
    
    this.predict = function(features) {
        var classIdx = 0, i;
        if (this.nNeighbors == 1) {
            var minDist = Number.POSITIVE_INFINITY,
                curDist;
            for (i = 0; i < this.nTemplates; i++) {
                curDist = compute(this.X[i], features, this.power);
                if (curDist <= minDist) {
                    minDist = curDist;
                    classIdx = this.y[i];
                }
            }
        } else {
            var classes = new Array(this.nClasses).fill(0);
            var dists = [];
            for (i = 0; i < this.nTemplates; i++) {
                dists.push(new Neighbor(this.y[i], compute(this.X[i], features, this.power)));
            }
            dists.sort(function compare(n1, n2) {
                return (n1.dist < n2.dist) ? -1 : 1;
            });
            for (i = 0; i < this.nNeighbors; i++) {
                classes[dists[i].clazz]++;
            }
            for (i = 0; i < this.nClasses; i++) {
                classIdx = classes[i] > classes[classIdx] ? i : classIdx;
            }
        }
        return classIdx;
    };

};

  // Parameters:
  var X = [[0.56, 0.674, 0.421], [0.662, 0.614, 0.616], [0.526, 0.637, 0.765], [0.642, 0.523, 0.394], [0.644, 0.939, 0.861], [0.674, 0.61, 0.795], [0.908, 0.621, 0.421], [0.539, 0.884, 0.752], [0.465, 0.896, 0.569], [0.762, 0.7, 0.608], [0.647, 0.822, 0.962], [0.546, 0.651, 0.646], [0.774, 0.281, 0.341], [0.528, 0.909, 0.349], [0.525, 0.904, 0.803], [0.553, 0.93, 0.895], [0.516, 0.358, 0.397], [0.346, 305.0, 0.352], [0.557, 0.54, 0.394], [0.859, 0.0434, 0.177], [0.479, 0.545, 0.244], [0.631, 0.793, 0.648], [0.731, 0.902, 0.947], [0.592, 0.767, 0.328], [0.628, 0.698, 0.732], [0.577, 0.833, 0.58], [0.728, 0.974, 0.965], [0.525, 0.216, 0.328], [0.481, 0.451, 0.289], [0.479, 0.784, 0.692], [0.734, 0.222, 0.62], [0.52, 0.538, 0.177], [0.694, 0.311, 0.616], [0.621, 0.672, 0.228], [0.772, 0.744, 0.86], [0.764, 0.326, 0.237], [0.521, 0.155, 0.16], [0.697, 0.813, 0.85], [0.936, 0.523, 0.699], [0.55, 0.625, 0.215], [0.773, 0.387, 0.308], [0.214, 0.949, 0.199], [0.735, 0.389, 0.729], [0.339, 0.143, 0.0948], [0.768, 0.517, 0.418], [0.395, 0.193, 0.206], [0.853, 0.351, 0.282], [0.583, 0.47, 0.688], [0.581, 0.28, 0.813], [0.51, 0.313, 0.243], [0.7, 0.742, 0.197], [0.613, 0.873, 0.392], [0.701, 0.861, 0.778], [0.356, 0.924, 0.232], [0.927, 0.965, 0.965], [0.646, 0.0828, 0.293], [0.784, 0.231, 0.534], [0.836, 0.67, 0.556], [0.464, 0.368, 0.111], [0.744, 0.598, 0.699], [0.709, 0.699, 0.592], [0.545, 0.467, 0.444], [0.668, 0.906, 0.507], [0.457, 0.573, 0.0922], [0.583, 0.428, 0.254], [0.663, 0.694, 0.524], [0.535, 0.65, 0.61], [0.463, 0.857, 0.856], [0.849, 0.53, 0.706], [0.38, 0.988, 0.769], [0.462, 0.538, 0.405], [0.47, 0.474, 0.241], [0.579, 0.824, 0.635], [0.603, 0.374, 0.242], [0.621, 0.814, 0.304], [0.795, 0.597, 0.849], [0.407, 0.147, 0.0765], [0.548, 0.532, 0.405], [0.771, 0.607, 0.79], [0.689, 0.739, 0.578], [0.501, 0.899, 0.732], [0.471, 0.924, 0.725], [0.901, 0.697, 0.67], [0.486, 0.739, 0.274], [0.345, 0.0581, 0.304], [0.93, 0.65, 0.403], [0.669, 0.52, 0.634], [0.545, 0.169, 0.482], [0.671, 0.373, 0.732], [0.659, 0.949, 0.512], [0.608, 0.845, 0.518], [0.569, 0.108, 0.181], [0.386, 0.607, 0.532], [0.818, 0.705, 0.772], [0.546, 0.221, 0.593], [0.653, 0.73, 0.894], [0.559, 0.345, 0.458], [0.608, 0.955, 0.879], [0.712, 0.967, 0.895], [0.674, 0.894, 0.68], [0.671, 0.711, 0.466], [0.878, 0.619, 0.639], [0.000289, 0.905, 0.235], [0.469, 0.84, 0.573], [0.818, 0.728, 0.975], [0.427, 0.9, 0.599], [0.34, 0.144, 0.147], [0.646, 0.833, 0.278], [0.445, 0.985, 0.832], [0.564, 0.932, 0.619], [0.776, 0.78, 0.666], [0.468, 0.35, 0.124], [0.742, 0.833, 0.816], [0.559, 0.972, 0.919], [0.596, 0.869, 0.944], [0.209, 0.418, 0.123], [0.4, 0.253, 0.135], [0.566, 0.876, 0.375], [0.706, 0.559, 0.227], [0.766, 0.121, 0.47], [0.774, 0.75, 0.925], [0.84, 0.56, 0.775], [0.632, 0.582, 0.578], [0.949, 0.661, 0.76], [0.646, 0.813, 0.821], [0.673, 0.902, 0.538]];
  var y = [3, 5, 6, 2, 5, 5, 5, 7, 6, 4, 8, 6, 2, 0, 5, 0, 3, 3, 7, 4, 3, 4, 7, 3, 6, 7, 7, 2, 0, 5, 3, 1, 3, 2, 6, 1, 1, 8, 5, 1, 3, 0, 1, 2, 4, 0, 3, 6, 3, 0, 3, 2, 7, 7, 8, 1, 2, 6, 2, 7, 4, 2, 4, 2, 0, 3, 5, 4, 5, 5, 1, 2, 0, 5, 5, 7, 0, 0, 6, 5, 6, 7, 6, 5, 1, 2, 2, 2, 5, 5, 5, 2, 4, 4, 5, 7, 4, 6, 8, 6, 5, 6, 1, 5, 8, 4, 0, 3, 5, 5, 4, 3, 5, 8, 8, 2, 2, 6, 3, 4, 7, 5, 6, 6, 6, 7];

  // Estimator:
  var clf = new KNeighborsClassifier(10, 9, 2, X, y);

  // Prediction:
  console.log(desired);
  var desired_prediction = clf.predict([desired["danceability"], desired["energy"], desired["valence"]]);
  console.log(desired_prediction);
  

  var trackDistances = {};
  var track;
  for (track in trackList) {
    if (trackList.hasOwnProperty(track)) {
      console.log(trackList[track]["danceability"]);
      var track_prediction = clf.predict([trackList[track]["danceability"], trackList[track]["energy"], trackList[track]["valence"]]);
      console.log(track_prediction);
      console.log(Math.abs(desired_prediction-track_prediction));
      console.log("d");
      trackDistances[track] = Math.abs(desired_prediction-track_prediction);
      console.log("huh");
    }
  }

  console.log("made it here");

  var distancesArray = Object.values(trackDistances);
  var SD = standardDeviation(distancesArray);
  var AVG = average(distancesArray);

  var finalTracks = [];
  for (track in trackDistances) {
    if (trackDistances.hasOwnProperty(track) && trackDistances[track] < AVG-0.5*SD) {
      finalTracks.push(track); // only push tracks that have a distance that met the cutoff
    }
  }
  return finalTracks;
}

function weatherToMoods(weather) {
  if (weather === "clear sky") {
    return {"happy": 1};

  } else if (weather === "few clouds") {
    return {"happy": 1, "sad": 0.2};

  } else if (weather === "scattered clouds") {
    return {"happy": 1, "sad": 0.4};

  } else if (weather === "broken clouds") {
    return {"happy": 1, "sad": 0.8};

  } else if (weather === "shower rain") {
    return {"happy": 0.5, "sad": 1};

  } else if (weather === "rain") {
    return {"sad": 1};

  } else if (weather === "thunderstorm") {
    return {"sad": 1};

  } else if (weather === "snow") {
    return {"happy": 1, "sad": 0.2};

  } else if (weather === "mist") {
    return {"happy": 1, "sad": 1};

  } else {
    return {"happy": 1, "sad": 1, "angry": 1};
  }
}

function standardDeviation(values){
  var avg = average(values);

  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });

  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}


module.exports.getFilteredTracks = getFilteredTracks;
module.exports.getWeightedAverages = getWeightedAverages;