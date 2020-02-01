import React from 'react';
import './App.css';
import Landing from './Components/Landing'
import MainApp from './Components/MainApp'
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
          <Route exact path='/' component={Landing}/>
          <Route path='/launch' component={MainApp}/>
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
