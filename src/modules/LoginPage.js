/*global chrome*/

import React, { Component } from 'react';
import './App.css';
import { Disclaimer, HeaderCustom, MyCheckbox, ButtonWithPopper, AlertBoard } from "./Components";
import { config } from './config';

const API_URL = config.API_URL;

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.toggle = props.handleToggle;

    this.handleLogin = props.handleLogin;
    
    this.state = {
      username: props.loggedInUser,
      password: '',
      loggedIn: props.loggedInFlag,
      login_jwt: props.login_jwt,
    }
  }
 
  changeLoggedIn = (newLoggedIn) => {
    this.setState({loggedIn: newLoggedIn});
  }

  login = () => {
    var base_url = API_URL + "/login"
    
    fetch(base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password,
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.logged_in) {
          this.handleLogin(true, this.state.username, data.jwt_token, data.remaining_queries, data.remaining_questions);
          this.setState({loggedIn: true});
          this.toggle(0);
        }
        else {
          console.log('login failed');
          this.props.alert_handle_new('Login failed. Recheck credentials and make sure you have signed up.');
        }
        this.setState({login_jwt: data.jwt_token});
      })
      .catch(error => {
        console.log('Error in login: ', error);
      });  
  }

  signup = () => {
    var base_url = API_URL + "/signup"
    
    fetch(base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password,
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.Error) {
          this.props.alert_handle_new(data.Error);
        } else {
          this.props.alert_handle_new(data.Success + '. Please log-in.');
        }
      })
      .catch(error => {
        this.props.alert_handle_new('Error occured. Please try again.');
      });
  }
 
  handleLogout = () => {
    var base_url = API_URL + "/logout"
    
    fetch(base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.state.login_jwt,
      },
      body: JSON.stringify({
        username: this.state.username,
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log('logout response', data);
        console.log('Logout.');
        this.handleLogin(false, '', '');
        this.setState({loggedIn: false});
        this.setState({username: ''});
        this.setState({password: ''});    
      })
      .catch(error => {
        console.log('Error in logout: ', error);
      });
  }

  forgotpw = () => {
    console.log('Forget password.');
    if (this.state.username === '') {
      this.props.alert_handle_new('Please enter your username (e-mail) first.');
      return;
    }
    var base_url = API_URL + "/forgotpassword"
    fetch(base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: this.state.username,
      })
    })
      .then(response => response.json())
      .then(data => {
        this.props.alert_handle_new('A password reset link was send to the username e-mail address, if it exists.');
      })
      .catch(error => {
        this.props.alert_handle_new('Error in forgot-password: ', error);
      });
  }

  launch_notion_int = () => {
    let req_id = '';

    var base_url = API_URL + "/generatenotiontoken"
    fetch(base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.state.login_jwt,
      },
      body: JSON.stringify({
        placeholder: '',
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          req_id = data.notion_id;
        }
        var notion_url = 'https://api.notion.com/v1/oauth/authorize?client_id=42bdce9f-2685-4e6d-b3f2-b08d2eef8231&response_type=code&state=' + req_id + '&owner=user&redirect_uri=https%3A%2F%2Fessence.fyi%2Fnotionvalidate';
        window.open(notion_url, '_blank');
      })
      .catch(error => {
        // Handle the error
        this.props.alert_handle_new('Error in setup: ', error.toString());
      });
    if (req_id !== '') {
      var notion_url = 'https://api.notion.com/v1/oauth/authorize?client_id=42bdce9f-2685-4e6d-b3f2-b08d2eef8231&response_type=code&state=' + req_id + '&owner=user&redirect_uri=https%3A%2F%2Fessence.fyi%2Fnotionvalidate';
      window.open(notion_url, '_blank');
    }
  }

  handleGoogleLoginSuccess = (response) => {
    console.log('success google', response);
  }
  
  handleGoogleLoginFailure = (error) => {
    console.log('failure google', error);
  }
  
  render() {
    return (
      <div className="App-BG">
        <div className="App">
          <HeaderCustom className="App-header" tagline="Log-in & Settings." isExt={this.props.isExt} toggle_page={this.toggle} loggedIn={this.props.loggedInFlag} />
          <AlertBoard alert_message={this.props.alert_message} alert_handle_close={this.props.alert_handle_close} />
          <div className="App-BG">
            <ButtonWithPopper disabledFlag={false} onClick={() => this.toggle(0)} className={"MainButton"} buttonText={""} iconName={"ComputerProcessIcon"} iconClass={"MainIconButtonSpec"} popperText={"Back to the main page."} showPopper={this.props.showPopper}/>
            <ButtonWithPopper disabledFlag={false} onClick={() => this.toggle(1)} className={"MainButton"} buttonText={""} iconName={"BooksIcon"} iconClass={"MainIconButtonSpec"} popperText={"Go to your saved collection page."} showPopper={this.props.showPopper}/>
              <div className="PaletteContainer">
              {this.props.loggedInFlag ? 
              <div className="LoginPageText">Logged-in as {this.state.username} <br></br>
              <div style={{marginTop: '5px'}}>
                <button className="ButtonGeneric-style" onClick={() => this.handleLogout()}>Log-out</button>
              </div>
              </div>
              : 
              <div className="LoginPageText">
                <input type="text" placeholder="Username (e-mail)" value={this.state.username} onChange={(e) => this.setState({username: e.target.value})} style={{width: '40%', height: '100%', border: 'none', fontSize: '16px', padding: 7, margin: 2, borderRadius: 5}}/><br></br>
                <input type="password" placeholder="Password" value={this.state.password} onChange={(e) => this.setState({password: e.target.value})} style={{width: '40%', height: '100%', border: 'none', fontSize: '16px', padding: 7, margin: 2, borderRadius: 5}}/><br></br>
                <button className="ButtonGeneric-style" onClick={() => this.signup()} style={{width: '40%'}}>Sign-up</button><br />
                <button className="ButtonGeneric-style" onClick={() => this.login()} style={{width: '40%'}}>Log-in</button>
                <br />
                <button className="link-button-light" onClick={() => this.forgotpw()}>Forgot Password</button>
              </div>
              }
            </div>
            {this.props.loggedInFlag ? 
            <div>
              {/* Settings */}
              <div className="PaletteContainer">
                <div className="LoginPageText">
                  <div style={{marginBottom: "5px"}}><b>Settings</b></div>
                  <div style={{textAlign: 'left', textIndent: '50px'}}>
                    <MyCheckbox text={"Show tips for buttons"} value={this.props.showPopper} setValue={this.props.toggleShowPopper} /><br />
                  </div>
                  <div style={{textAlign: 'left', textIndent: '50px'}}>
                    <MyCheckbox text={"Reset output on every new page"} value={this.props.resetOnNewPage} setValue={this.props.toggleResetOnNewPage} /><br />
                  </div>
                  <div style={{textAlign: 'left', textIndent: '50px'}}>
                    <MyCheckbox text={"Notion integration"} value={this.props.notionIntegration} setValue={this.props.toggleNotionIntegration} /> <a href="https://www.youtube.com/watch?v=EGK6ic3eovg&t=53s" target="_blank">Video Tutorial</a>
                    {this.props.notionIntegration ? 
                    <div>
                      <div style={{textAlign: 'left', paddingLeft: '60px', textIndent: '0px'}}>
                        <ul>
                          <li>Authorize and Duplicate database: <button className="ButtonGeneric-style" onClick={() => this.launch_notion_int()}>Setup</button></li>
                          <li>Click on 3-dots on top right, "Add Connections", "Essence".</li>
                          <li>Paste a link to the Duplicated database:</li>
                          <input className="NotionInput" style={{background: 'transparent'}} type="text" placeholder="Notion database ID/Link to database" value={this.props.notionDBid} onChange={(e) => this.props.setNotionDatabaseID(e.target.value)} style={{width: '70%', height: '100%', border: 'none', fontSize: '16px', padding: 7, margin: 2, borderRadius: 5}}/>
                        </ul>
                      </div>
                    </div>
                    :
                    <></>
                    }
                  </div>
                </div>
                <br />
              </div>
              {/* Usage */}
              <div className="PaletteContainer">
                <div className="LoginPageText">
                  <div style={{marginBottom: "5px"}}><b>Monthly Usage</b></div>
                  <div style={{textAlign: 'left', paddingLeft: '60px', textIndent: '0px'}}>
                    <ul>
                      <li>Remaining queries&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{this.props.remaining_queries}</strong></li>
                      <li>Remaining questions&nbsp; <strong>{this.props.remaining_questions}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            :  
            <></>}
            <Disclaimer />
          </div>
        </div>
      </div>
    );
  }
}

export default LoginPage;
