import React from 'react';
import * as faceapi from 'face-api.js';
import CameraModule from "../CameraModule"
import "./index.scss";

const MODEL_URL = '/models'


class MainApp extends React.Component{
    
    constructor(props){
        super(props);

        this.state = {
            facialExpressionDetected: false,
        }
    }

    async componentDidMount(){
        var video = document.getElementById("camera");
        this.fetchWeatherData();

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
                return new Promise(resolve => video.onloadedmetadata = resolve);
            }).then(this.onPlay)
            .catch(e => console.log(e));
    }

    fetchWeatherData() {
        fetch("api.openweathermap.org/data/2.5/weather?q=Irvine&APPID=0c65abcbf74e0d967f0d1bb61f37d707").then(res => console.log(res));
    }


    async onPlay() {
        console.log("Media streamed!")
        await faceapi.loadFaceDetectionModel(MODEL_URL);
        await faceapi.loadFaceExpressionModel(MODEL_URL);
        const input = document.getElementById('camera');

        const displaySize = { width: 400, height: 400 };
        const canvas = document.getElementById('result');
        faceapi.matchDimensions(canvas, displaySize);

        const detection = await faceapi.detectSingleFace(input).withFaceExpressions();
        console.log(detection);

        const resizedDetections = faceapi.resizeResults(detection, displaySize);

        faceapi.draw.drawDetections(canvas, resizedDetections);

        // draw a textbox displaying the face expressions with minimum probability into the canvas
        const minProbability = 0.05
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections, minProbability);
        document.getElementById("camera").pause();
        document.getElementById("camera").srcObject.getTracks().forEach(function(track) {
            track.stop();
          });
    }


    render(){
        return(
            <div>
            <h1>This is the app!</h1>
                <div id={"facial-detection-container"}>
                    <video  autoPlay={true} id="camera"></video>
                    <canvas id={"result"}></canvas>
                </div>
            </div>
        );
    }
}

export default MainApp;