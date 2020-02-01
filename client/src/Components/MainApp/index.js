import React from 'react';
import * as faceapi from 'face-api.js';
import Webcam from "react-webcam";
import CameraModule from "../CameraModule"

const MODEL_URL = '/models'


class MainApp extends React.Component{
    
    constructor(props){
        super(props);
    }

    async componentDidMount(){
        console.log(faceapi.nets);

        var video = document.getElementById("camera");
        var canvas = document.getElementById('result');

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
                return new Promise(resolve => video.onloadedmetadata = resolve);
            })
            .catch(e => console.log(e));
    }


    async onPlay() {
        console.log("Media streamed!")
        await faceapi.loadFaceDetectionModel(MODEL_URL);
        await faceapi.loadFaceExpressionModel(MODEL_URL);
        const input = document.getElementById('camera');
        const detection = await faceapi.detectSingleFace(input).withFaceExpressions();
        console.log(detection);

    }


    render(){
        return(
            <div>
            <h1>This is the app!</h1>

                <video onLoadedMetadata={this.onPlay} autoPlay={true} id="camera"></video>
                <canvas id={"result"}></canvas>

            </div>
        );
    }
}

export default MainApp;