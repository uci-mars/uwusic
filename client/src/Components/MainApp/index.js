import React from 'react';
import * as faceapi from 'face-api.js';
// import CameraModule from "../CameraModule"
import "./index.scss";
import loading from "../../img/loading.svg";
import Iframe from 'react-iframe';

const MODEL_URL = '/models'

class MainApp extends React.Component{
    
    constructor(props){
        super(props);

        this.state = {
            status: "",
            facialData: null,
            playlistGenerated: false,
            playlistUrl: null,
            userMood: null
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
        const that = this;        

        fetch('/api/generate_playlist', {
            method: 'post',
            headers: new Headers({'content-type': 'application/json'}),
            body: JSON.stringify(this.state.facialData.expressions)
        }).then(function(response) {
            return response.json();
        }).then(function(jsonData) {
            console.log(jsonData);
            that.setState({status: "Hi, you seem to be feeling " + jsonData.userMetric + ". Here is a playlist we made to start your day!", playlistUrl: jsonData.playlistUrl, userMood: jsonData.userMetric, playlistGenerated: true});
        })
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
        let appModule;

        if (this.state.playlistGenerated) {
            appModule = 

            <div className={"result-container"}>
                <div id={"status-container"}>
                    <h2 style={{fontSize: "50px"}}>Hi, you seem to be feeling <span style={{textDecoration: "underline"}}>{this.state.userMood}</span>. Here is a playlist we made to start your day!</h2>
                    <a href={this.state.playlistUrl} id="generic-btn-premium" role="button" class="btn btn-green">
                        OPEN ON SPOTIFY APP
                    </a>
                </div>

                <div style={{marginLeft: "36px"}}>
                    <Iframe url={this.state.playlistUrl} width="400" height="480" ></Iframe>
                </div>
            </div>
            
            

          } else {
            appModule = 

                <div id={"app-container"} >
                    <div id={"status-container"}>
                    <h2 style={{fontSize: "50px"}}>{this.state.status}</h2>
                    <img src={loading}></img>
                </div>

                    <div id={"facial-detection-container"}>
                        <video  autoPlay={true} id="camera"></video>
                        <canvas id={"result"}></canvas>
                        <div id={"loader"}></div>
                    </div>
                </div>
          }

        return(
            <div class={"main-app"} id={this.state.userMood}>

                    {appModule}

            </div>
        );
    }
}

export default MainApp;