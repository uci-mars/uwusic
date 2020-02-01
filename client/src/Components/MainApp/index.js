import React from 'react';
import * as faceapi from 'face-api.js';
import Webcam from "react-webcam";
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

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
                return new Promise(resolve => video.onloadedmetadata = resolve);
            }).then(this.onPlay)
            .catch(e => console.log(e));
    }


    async onPlay() {
        console.log("Media streamed!")
        await faceapi.loadFaceDetectionModel(MODEL_URL);
        await faceapi.loadFaceExpressionModel(MODEL_URL);
        const input = document.getElementById('camera');

        const displaySize = { width: 640, height: 480 };
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
        // const resizedResults = faceapi.resizeResults(detection, displaySize)
        // const minProbability = 0.05
        // faceapi.draw.drawFaceExpressions(canvas, resizedResults, minProbability)


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