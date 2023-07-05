/*global chrome*/

import React, { Component, useState, useEffect } from 'react';
import './App.css';
import { Disclaimer, HeaderCustom, new_divider_request_and_save, save_session, setLocalData, getLocalData, QAListMember, ParseButton, GoodOneButton, BadOneButton } from "./Components";
import Popup from 'reactjs-popup';
import { config } from './config';
import { AppWikiHover } from './WikiHover';


class FloaterApp extends Component {
  constructor(props) {
    super(props);
    this.toggle = props.handleToggle;
    console.log('App constructor');

    this.textOutput = props.textOutput;
    this.titleOutput = props.titleOutput;

    this.lastQueryID = props.lastQueryID;

    this.handleTextOutputChange = props.handleTextOutputChange;

    this.url = window.location.href;
    
    this.handleAddQAList = props.handleAddQAfield;
    this.handleDeleteQAList = props.handleDeleteQAfield;
    
    this.login_jwt = props.login_jwt;

    this.interval = setInterval(() => {
      if (window.location.href !== this.url) {
        this.url = window.location.href;
      }
    }, 100);

  }

  render() {
    return (
      <div className="FloaterApp">
        This floater is supposed to be a popup that appears on the side of the screen. Was not able to get it to work.
      </div>
    );
  }

}

export default FloaterApp;
