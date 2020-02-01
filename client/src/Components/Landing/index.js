import React from 'react';
import MainApp from '../MainApp';

import {
    BrowserRouter as Router,
    Route,

    Link
  } from "react-router-dom";

class Landing extends React.Component{

    render(){
        return(
            <div>
            <Link to={'./launch'}>Start Application</Link>
            </div>



        );
    }
}

export default Landing;