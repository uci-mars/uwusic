import React from 'react';
import MainApp from './Components/MainApp'
import * as faceapi from 'face-api.js';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";



class App extends React.Component {

  render() {
    const App = () => (
      <div>
        <Switch>
          <Route exact path='/' component={MainApp}/>
        </Switch>
      </div>
    )
    return (
      <Switch>
        <App/>
      </Switch>
    );
  }
}

export default App;
