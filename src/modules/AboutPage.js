/*global chrome*/

import React, { Component, useState, useEffect } from 'react';
import './App.css';
import { Disclaimer, HeaderCustom, ButtonWithPopper } from "./Components";
import { config } from './config';

const API_URL = config.API_URL;

function FeedbackForm() {
  const [contactInfo, setContactInfo] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    // Send a POST request to the server with the contact info and feedback
    var base_url = API_URL + "/feedback"

    fetch(base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contactInfo, feedback })
    }).catch((error) => {
      console.log('Error in sending feedback: ', error);
    });
    setContactInfo('');
    setFeedback('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        <input
          style={{width: '85%', height: '100%', border: 'none', fontSize: '16px', padding: 5, margin: 0, borderRadius: 5}}
          type="text"
          placeholder='Please enter your contact information here'
          value={contactInfo}
          onChange={(event) => setContactInfo(event.target.value)}
        />
      </label>
      <br />
      <label>
        <br></br>
        <textarea
          className="TextArea-style"
          placeholder='Please enter your feedback here'
          rows="7" 
          cols="45"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
        />
      </label>
      <br />
      <button type="submit" className="ButtonGeneric-style">Send Feedback</button>
    </form>
  );
}


class AboutPage extends Component {
  constructor(props) {
    super(props);
    this.toggle = props.handleToggle;
  }

  render() {
    return (
      <div className="App-BG">
        <div className="App">
          <HeaderCustom className="App-header" tagline="About." isExt={this.props.isExt} toggle_page={this.toggle} loggedIn={this.props.loggedIn} />
          <div className='App-BG'>
            <ButtonWithPopper disabledFlag={false} onClick={() => this.toggle(0)} className={"MainButton"} buttonText={""} iconName={"ComputerProcessIcon"} iconClass={"MainIconButtonSpec"} popperText={"Back to the main page."} showPopper={this.props.showPopper}/>
            <ButtonWithPopper disabledFlag={false} onClick={() => this.toggle(1)} className={"MainButton"} buttonText={""} iconName={"BooksIcon"} iconClass={"MainIconButtonSpec"} popperText={"Go to your saved collection page."} showPopper={this.props.showPopper}/>
            <div className="PaletteContainer">
              <div className="AboutPageText">
                This is a Chrome extension that allows you to summarize and organize web pages and PDFs.<br></br><br></br>
                Currently supported text styles: travel, business analytics, academic papers, a generic summary, a bullet-list summary and explain-function.<br></br><br></br>
                We're in beta. If you cannot sign-up, request access in the <a className="App-general-left-whitish-nomargin" href="https://essence.fyi">main webpage</a>.<br></br><br></br>
                <b>Privacy statement:</b> Your password is not stored. We only inspect non-private queries which have been flagged as good or bad. Only pages requested for Processing are sent to the server. The app does not access any information beyond the current page. We re-use cached queries only with public pages with no personal information, i.e. ones which were accessed directly by the server, not from the user-side.<br></br><br></br>
                <b>Common troubleshooting:</b> (i) some websites block the .csv download - try downloading while on a different website. (ii) On long texts it may take the server a while to answer. (iii) Unhappy with the processing quality? Downvote it and try again. <br></br><br></br>
                Please send us feedback to report bugs or suggest improvements!<br></br><br></br>
              </div>
              <FeedbackForm />
            </div>
            <Disclaimer />
          </div>
        </div>
      </div>
    );
  }
}

export default AboutPage;
