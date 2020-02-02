import React from 'react';
import * as faceapi from 'face-api.js';
import CameraModule from "../CameraModule"
import "./index.scss";
import loading from "../../img/loading.svg"

const MODEL_URL = '/models'

class MainApp extends React.Component{
    
    constructor(props){
        super(props);

        this.state = {
            status: "",
            facialData: null,
            // playlistGenerated: null,
        }
    }

    async componentDidMount(){
        var video = document.getElementById("camera");
        this.setState({status: "Starting up your camera..."})
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
                return new Promise(resolve => video.onloadedmetadata = resolve);
            }).then(() => {
                this.setState({status: "Detecting your facial expression... "});
                this.detectFacialExpression().then(face => 
                    {this.setState({status: "Generating playlist based on your emotion...", facialData: face}); this.generatePlaylist();})
                
            })
            .catch(e => this.setState({status: "Please enable webcam access on this application."}));
    }

    generatePlaylist() {
        console.log("send request");
        fetch('/api/generate_playlist', {
            method: 'post',
            headers: new Headers({'content-type': 'application/json'}),
            body: JSON.stringify(this.state.facialData.expressions)
        }).then((res) => console.log(res));
    }

    async detectFacialExpression() {
        await faceapi.loadFaceDetectionModel(MODEL_URL);
        await faceapi.loadFaceExpressionModel(MODEL_URL);
        const input = document.getElementById('camera');

        const displaySize = { width: 400, height: 400 };
        const canvas = document.getElementById('result');
        faceapi.matchDimensions(canvas, displaySize);

        const detection = await faceapi.detectSingleFace(input).withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(detection, displaySize);

        faceapi.draw.drawDetections(canvas, resizedDetections);

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
                    <div id={"status-container"}>
                    <h2 style={{fontSize: "50px"}}>{this.state.status}</h2>
                    {/* <img src={loading}></img> */}
                    </div>

                    <div id={"facial-detection-container"}>
                        <video  autoPlay={true} id="camera"></video>
                        <canvas id={"result"}></canvas>
                        <div id={"loader"}></div>
                    </div>
{/* 
                    <div>
                    <iframe src={playlistGenerated} width="400" height="480" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
                    </div> */}
                </div>

            </div>
        );
    }
}

export default MainApp;