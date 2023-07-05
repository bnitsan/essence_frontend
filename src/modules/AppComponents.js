/*global chrome*/
import React, { Component, useState, useEffect, useRef} from 'react';
import logo from './logonew.png';
import './App.css';
import { config } from './config';
import { createPopper } from '@popperjs/core';
import logosvg from './logo.svg';
import { MyCheckbox, ButtonWithPopper } from './Components';

const API_URL = config.API_URL;
const MAX_TITLE_LENGTH = config.MAX_TITLE_LENGTH;


export function SettingsAppPage(props) {
  return (
    <div className="SettingsAppPage"><br /><div style={{textAlign: 'left', textIndent: '10px'}}>
      <MyCheckbox text={"Auto-open on current domain (" + props.domain.toString() + ')'} value={props.auto_open_current_website} setValue={props.toggle_auto_open_website} /><br />
    </div></div>
  );
}

export function QuestionHeader(props) {
  return (
    <div style={{display: 'flex', justifyContent: 'space-between'}}>
      <span className='QuestionStyle'><strong>{props.q}</strong></span>
      <div style={{ display: 'flex', position: 'relative' }}>
        <div style={{ display: 'flex', position: 'absolute', right: 0, padding: '6px' }}>
          <ButtonWithPopper disabledFlag={false} onClick={() => props.askAsChat(props.id)} className={'PaletteButton'} buttonText={""} iconName={"ChatBubble"} iconClass={"PaletteIconButtonSpec"} popperText={"Re-ask the question, regardless of the document. Note, it's always possible to ask such questions by starting the question with \"/chat\"."} showPopper={props.showPopper}/>
          <ButtonWithPopper disabledFlag={false} onClick={() => props.toggleText(props.id)} className={'PaletteButton'} buttonText={""} iconName={"InfoSource"} iconClass={"PaletteIconButtonSpec"} popperText={"See the source text that may have led to this answer."} showPopper={props.showPopper}/>
          <ButtonWithPopper disabledFlag={false} onClick={() => props.handleDeleteQAList(props.id)} className={'PaletteButton'} buttonText={""} iconName={"TrashPalette"} iconClass={"PaletteIconButtonSpec"} popperText={"Delete this question and answer query."} showPopper={props.showPopper}/>
        </div>
      </div>
    </div>
  )
}

export function ParseButton({handleClick, showPopper, process_disabled, file_url}) {
  return (
      <ButtonWithPopper disabledFlag={file_url} onClick={event => handleClick(event)} className={"MainButton"} buttonText={""} iconName={"ComputerProcessIcon"} iconClass={"MainIconButtonSpec"} popperText={"This button processes the entire page in the specified style. If it fails, it sometimes means that website blocks our server. In that case, try to highlight some or all the text and use the Brush button."} showPopper={showPopper}/>
  );
}

export function NotionExportButton(props) {
  return (
    <ButtonWithPopper onClick={(e) => {props.exportToNotion()}} className={"MainButton"} buttonText={""} iconName={"NotionLogo"} iconClass={"MainIconButtonSpec"} popperText={"Export all current output to Notion."} showPopper={props.showPopper}/>
  )
}

export function LongLoadingMsg(props) {
  return (
    <div>
        {props.showLoadingMessage && 
        <div className='PaletteContainer'>
          <div className="LongLoadingMsgStyle">
            <strong>Loading is taking a while. To speed it up, try to highlight some or all (Ctrl+A in Windows/Cmd+A in Mac) the text and use the Brush button. Also note that process is limited in text length, to the leading 2000 to 9000 words, approximately.</strong>
          </div>
        </div>}
    </div>
  );
}