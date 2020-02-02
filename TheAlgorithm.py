from statistics import stdev

# mapping facial expressions to desired musical features

# defining mood-feature correlation strengths here

# ALL FEATURES - NOTE: ACCOUSTIC AND TEMPO AND MODE HAVE BEEN CURRENTLY REMOVED DUE TO THE LACK OF A DEVELOPED METRIC
features = ["Danceability", "Energy", "Valence"]

# HAPPY VALUES
HAPPY_ACOUSTIC = 0.5
HAPPY_DANCEABILITY = 0.7
HAPPY_ENERGY = 0.7
HAPPY_MODE = 1
HAPPY_TEMPO = 0.8
HAPPY_VALENCE = 0.8

# SAD VALUES
SAD_ACOUSTIC = 0.7
SAD_DANCEABILITY = 0.3
SAD_ENERGY = 0.3
SAD_MODE = 0
SAD_TEMPO = 0.5
SAD_VALENCE = 0.2

# ANGRY VALUES
ANGRY_ACOUSTIC = 0.5
ANGRY_DANCEABILITY = 0.5
ANGRY_ENERGY = 0.7
ANGRY_MODE = 1
ANGRY_TEMPO = 0.5
ANGRY_VALENCE = 0.35

# SAMPLE SONGS FOR TESTING

sample_songs = {"Hello - Adele": {"Acoustic":0.336, "Danceability":0.481, "Energy":0.451, "Mode":0, "Valence":0.289},
                "Ugly Lil Wayne song ew": {"Acoustic":0.0454, "Danceability":0.445, "Energy":0.985, "Mode":1, "Valence":0.832},
                "Bohemian Rhapsody - Queen": {"Acoustic":0.271, "Danceability":0.397, "Energy":0.386, "Mode":0, "Valence":0.21},
                "Burn - Hamilton": {"Acoustic": 0.752, "Danceability": 0.583, "Energy": 0.428, "Mode": 1, "Valence": 0.254},
                "UwU - Chevy": {"Acoustic": 0.985, "Danceability": 0.859, "Energy": 0.0434, "Mode": 1, "Valence": .177},
                "Dirty Deeds Done Dirt Cheap - AC/DC": {"Acoustic": 0.214, "Danceability": 0.668, "Energy": .906, "Mode": 0, "Valence": 0.507},
                "King Nothing - Metallica": {"Acoustic": 0.0000777, "Danceability": .528, "Energy": 0.909, "Mode":1, "Valence":0.349},
                "Enter Sandman - Metallica": {"Acoustic": 0.00206, "Danceability": 0.579, "Energy": 0.824, "Mode": 0, "Valence": 0.635},
                "Hypnotize - Biggie": {"Acoustic": 0.145, "Danceability": 0.901, "Energy": 0.697, "Mode":1, "Valence": 0.67},
                "High Hopes - P!ATD": {"Acoustic": 0.193, "Danceability": 0.579, "Energy": 0.904, "Mode":1, "Valence": 0.681},
                "Hey Look Ma I Made It - P!ATD": {"Acoustic":0.0137, "Danceability":0.577, "Energy":0.833, "Mode":1, "Valence":0.58},
                "Happy - Pharell Williams": {"Acoustic": 0.219, "Danceability": 0.647, "Energy":0.822, "Mode":0, "Valence":0.962},
                "Mr. Blue Sky - ELO": {"Acoustic":0.652, "Danceability":0.388, "Energy":0.338, "Mode":1, "Valence":0.477},
                "Deepthroat - Cum Cake": {"Acoustic":0.184, "Danceability":0.93, "Energy":0.65, "Mode":1, "Valence":0.403},
                "The Real Slim Shady - Eminem": {"Acoustic":0.0302, "Danceability":0.949, "Energy":0.661, "Mode":0, "Valence":0.76},
                "Rap God - Eminem": {"Acoustic": .397, "Danceability":0.708, "Energy":0.843, "Mode":1, "Valence":0.625},
                "Hot Shower - Chance": {"Acoustic": 0.00157, "Danceability": 0.899, "Energy":0.509, "Mode":1, "Valence":0.599},
                "Africa - Toto": {"Acoustic":0.257, "Danceability":0.671, "Energy":0.373, "Mode":1, "Valence":0.732},
                "September - Earth, Wind, Fire": {"Acoustic":0.165, "Danceability":0.694, "Energy":0.831, "Mode":1, "Valence":0.98},
                "Bring me to Life - Evanescence": {"Acoustic":0.00846, "Danceability":0.322, "Energy":0.947, "Mode":0, "Valence":0.269},
                "Stacy's Mom - Fountains of Wayne": {"Acoustic":0.0021, "Danceability":0.774, "Energy":0.75, "Mode":0, "Valence":0.925},
                "Welcome to the Black Parade - My Chemical Romance": {"Acoustic":0.000289, "Danceability":0.217, "Energy": 0.905, "Mode":1, "Valence":0.235},
                "Humble - Kendrick Lamar" : {"Acoustic":0.000282, "Danceability":0.908, "Energy": 0.621, "Mode": 0, "Valence":0.421},
                "Gucci Gang - Lil Pump": {"Acoustic":0.239, "Danceability": 0.936, "Energy":0.523, "Mode": 1, "Valence":0.699}
                }


def moods(happiness = 0, sadness = 0, anger = 0, neutral = 0, weather="none"):
        
        # place all moods in dictionary
        all_moods = {"Happiness": happiness, "Sadness": sadness, "Anger": anger}

        # filter for detected moods
        detected_moods = {}
        for mood, value in all_moods.items():
                if value > 0:
                        detected_moods.update({mood: value})

        # retrieve the feature correlations for each mood
        mood_features = {}
        for mood, value in detected_moods.items():
                mood_features.update({mood: mood_to_music_feature(mood)})

        normalized_moods = {}
        # normalize detected moods
        if neutral == 0:
                normalized_moods = normalize_moods(detected_moods)

        # populate new set of moods if neutral detected based on weather and incorporate with old moods
        elif neutral > 0:
                # include neutral for normalization
                detected_moods.update({"Neutral": neutral})
                normalized_moods = normalize_moods(detected_moods)
                # get the set of weather moods
                weather_moods = normalize_moods(weather_to_moods(weather))
                # weighted average of neutral and preexisting moods
                for mood, value in weather_moods.items():
                        # if weather introduces a mood not detected by face
                        if mood not in detected_moods:
                                normalized_moods.update({mood, value})
                        # otherwise update the normalized moods by weighing it 
                        elif mood in detected_moods:
                                normalized_moods[mood] = normalized_moods[mood] + normalized_moods["Neutral"]*weather_moods[mood]
                # eject neutral
                normalized_moods.pop("Neutral")
                # normalizing again after accounting for influence of neutral
                normalized_moods = normalize_moods(normalized_moods)

        # find weighted average of all features
        weighted_averages = {}
        for feature in features:
            count = 0
            feature_total= 0
            for mood, value in normalized_moods.items():
                    feature_total += value*mood_features[mood][feature]
            weighted_averages.update({feature: feature_total})

        return(min_distance(weighted_averages))
        
# translating weather to 3 moods
def weather_to_moods(weather):
        if weather == "clear sky":
                return {"Happiness": 1, "Sadness":0,"Anger":0}
        elif weather == "few clouds":
                return {"Happiness": 1, "Sadness":0.2,"Anger":0}
        elif weather == "scattered clouds":
                return {"Happiness": 1, "Sadness":0.4,"Anger":0}
        elif weather == "broken clouds":
                return {"Happiness": 1, "Sadness":0.8,"Anger":0}
        elif weather == "shower rain":
                return {"Happiness": 0.5, "Sadness":1,"Anger":0}
        elif weather == "rain":
                return {"Happiness": 0, "Sadness":1,"Anger":0}
        elif weather == "thunderstorm":
                return {"Happiness": 0, "Sadness":1,"Anger":0.5}
        elif weather == "snow":
                return {"Happiness": 1, "Sadness":0,"Anger":0}
        elif weather == "mist":
                return {"Happiness": 1, "Sadness":1,"Anger":0}
        else:
                return {"Happiness": 1, "Sadness":1,"Anger":1}
        

# assuming moods do not add up to 1
def normalize_moods(detected_moods):
     total = sum(detected_moods.values())
     normalized_moods = {}
     for mood, value in detected_moods.items():
                normalized_moods.update({mood: value/total})
     return normalized_moods

# map mood to numeric value per feature
def mood_to_music_feature(mood):
        if mood == "Happiness":
                return {"Acoustic": HAPPY_ACOUSTIC, "Danceability": HAPPY_DANCEABILITY, "Energy": HAPPY_ENERGY, "Mode": HAPPY_MODE, "Valence": HAPPY_VALENCE}
        elif mood == "Sadness":
                return {"Acoustic": SAD_ACOUSTIC, "Danceability": SAD_DANCEABILITY, "Energy": SAD_ENERGY, "Mode": SAD_MODE, "Valence": SAD_VALENCE}
        elif mood == "Anger":
                return {"Acoustic": ANGRY_ACOUSTIC, "Danceability": ANGRY_DANCEABILITY, "Energy": ANGRY_ENERGY, "Mode": ANGRY_MODE, "Valence": ANGRY_VALENCE}

# find distance of a desired song and an available song
def distance_between(desired, available):
        total_distance = 0
        for feature, value in desired.items():
                total_distance += (value - available[feature])**2
        return total_distance

# find available song with the min distance to a desired song
def min_distance(desired):
        song_distances = {}
        for song, values in sample_songs.items():
                song_distances.update({song:distance_between(desired, values)})
        max_distance = max(song_distances.values())
        final_song_distances = {}
        SD = stdev(song_distances.values())
        AVG = sum(song_distances.values())/len(song_distances.values())
        for song, dist in song_distances.items():
                if dist < AVG-0.5*SD:
                        final_song_distances.update({song: dist})
        #for k, v in song_distances.items():
        #        print(k, ":", v)
        return sorted(final_song_distances, key = lambda x: song_distances[x])
                
if __name__ == "__main__":
        
        # pure happiness
        print("TESTING PURE HAPPINESS:")
        print(moods(100, 0, 0))

        # pure sadness
        print("\nTESTING PURE SADNESS:")
        print(moods(0, 100, 0))

        # pure anger
        print("\nTESTING PURE ANGER:")
        print(moods(0, 0, 100))

        # mostly happy, a little sad and angry
        print("\nTESTING MOSTLY HAPPY:")
        print(moods(200, 50, 50))

        # mostly sad, a little happy and angry
        print("\nTESTING MOSTLY SAD:")
        print(moods(50, 200, 50))

        # mostly angry, a little sad and happy
        print("\nTESTING MOSTLY ANGRY:")
        print(moods(50, 50, 200))

        # even, no weather
        print("\nTESTING EVEN:")
        print(moods(100, 100, 100, 0.05, "none"))

        # with weather
        # moods(0.5, 0.25, 0.2, 0.05, "mist")
        # moods(0,0,0,0,"snow")

