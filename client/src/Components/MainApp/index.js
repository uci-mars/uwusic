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
            webcamStatus: false,
            status: "Detecting your facial expression...",
            facialData: {}
        }
    }

    async componentDidMount(){
        var video = document.getElementById("camera");

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
                return new Promise(resolve => video.onloadedmetadata = resolve);
            }).then(() => {
                this.onPlay().then(face => this.setState({facialData: face}))
                
            })
            .catch(e => this.setState({status: "Please enable webcam access on this application."}));
    }


    async onPlay() {
        await faceapi.loadFaceDetectionModel(MODEL_URL);
        await faceapi.loadFaceExpressionModel(MODEL_URL);
        const input = document.getElementById('camera');
        console.log("ping");
        const displaySize = { width: 400, height: 400 };
        const canvas = document.getElementById('result');
        faceapi.matchDimensions(canvas, displaySize);
        console.log(canvas);
        console.log(input);
        const detection = await faceapi.detectSingleFace(input).withFaceExpressions();
        console.log("ping");
        const resizedDetections = faceapi.resizeResults(detection, displaySize);

        faceapi.draw.drawDetections(canvas, resizedDetections);
        console.log("ping");
        // draw a textbox displaying the face expressions with minimum probability into the canvas
        const minProbability = 0.05
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections, minProbability);
        document.getElementById("camera").pause();
        document.getElementById("camera").srcObject.getTracks().forEach(function(track) {
            track.stop();
          });
        document.getElementById("loader").style.display = "none";
        
        return detection;
    }


    render(){


        return(
            <div id={"main-app"}>
                <div id={"app-container"}>
                    {this.state.status}


                    <div id={"facial-detection-container"}>
                        <video  autoPlay={true} id="camera"></video>
                        <canvas id={"result"}></canvas>
                        <div id={"loader"}></div>
                    </div>
                </div>

            </div>
        );
    }
}

export default MainApp;