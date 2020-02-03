# uwusic
music for uwu - HackUCI 2020

## What it does
Securely log into your own Spotify account and get a picture of your face. Not sure how you're feeling? We'll tell you! 

Our face detection will decipher on your current expression and auto generate a dynamic Spotify playlist for you based on your mood! This playlist is conveniently created directly into your Spotify account. :)

## How we built it
We used React.js and a face detection api called face-api.js on the front-end to detect the user’s facial expressions. The face-api.js allowed us to get different emotional attributes from a photo (happy, sad, angry, etc.) on a scale of 0-1. On the backend, we used Express.js for routing and the Spotify-Web-Api-Node to get information on a user's Spotify account (playlist write/read access, top artists of a user, top tracks of an artist, etc.). 

The Spotify Api allowed us to get track audio features (attributes like a track's valence, energy, danceability, etc.) that we used to train a supervised machine learning algorithm to relate audio features and emotional attributes. This gives us vital information to filter through tracks until we arrive at a nice set of songs that are tailored to both an individual’s preference and their current mood.

If a user didn't have any past Spotify data, we get recommendations from Spotify itself in a range of genres and also compared those tracks to the emotion attributes. After collecting the appropriate tracks, we created a playlist that is ready to go on your own Spotify account once you're done using the application!

## What's next for uwusic
Our face detection allows us to detect some expressions that you would not normally associate to music like surprised, disgusted, and fearful. At this time, we wrote it so that these expressions will still create you a nice Spotify playlist with a neutral expression. We can also analyze other attributes of the user through facial recognition that could relate to different music preference, such as age, gender, and more. It would be interesting to produce an algorithm to account for these emotions in the future! We could also add a feature that prefers new tracks so that you can choose to discover new music that adds to your mood.

Furthermore, since the algorithm uses a KNN model, expanding and fine tuning our training dataset would allow for more accurate judgements, which is especially important given how diverse music is and how difficult it can be to quantify attributes. We had initially compared the performance of the KNN model against an SVM model too, but the KNN performed better at the current amount of data. As a dataset increases, this performance may change and other model types may perform even better.
