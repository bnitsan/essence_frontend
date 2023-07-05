/*global chrome*/
/* 
We build the app using yarn build. yarn does not build unless using the command (running macOS 13.0.1):
export NODE_OPTIONS=--openssl-legacy-provider

rest: 
yarn install
yarn build
yarn watch

*/

import React, { Component, useState, useEffect, useContext } from 'react';
import './App.css';
import { Disclaimer, HeaderCustom, SinglePaletteOutput, SwalAlert, AddNoteButton, new_divider_request_and_save, save_session, ButtonWithPopper, MyCheckbox, FileDisclaimer, trim_title, AlertBoard } from "./Components";
import { QuestionHeader, ParseButton, NotionExportButton, LongLoadingMsg } from "./AppComponents";
import { config } from './config';
import YoutubeEmbed from './YoutubeComp';

const API_URL = config.API_URL;
const NEW_DIVIDER_KEYWORD = config.NEW_DIVIDER_KEYWORD;
const DEFAULT_TITLE_OUTPUT = config.DEFAULT_TITLE_OUTPUT;
const RANDOM_TIPS = config.RANDOM_TIPS;
const YOUTUBE_ID = config.YOUTUBE_ID;

function getPdfSelectedText() {
  // this function is supposed to get the selected text from the embedded pdf plugin
  // in some cases, e.g. sci-hub, it fails. Then, we fallback on a timer implemented with race & timeout
  return Promise.race([
    new Promise(resolve => {
      if (document.querySelector('embed') !== null && !window.location.href.startsWith('file://')) {
        window.addEventListener('message', function onMessage(e) {
          if (e.origin === 'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai' &&
              e.data && e.data.type === 'getSelectedTextReply') {
            window.removeEventListener('message', onMessage);
            resolve(e.data.selectedText);
          }
        });
        // runs code in page context to access postMessage of the embedded plugin
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('app/query-pdf.js'); // Manifest V3
        document.documentElement.appendChild(script);
        script.remove();
      } else {
        resolve("");
      }
    }),
    new Promise(resolve => setTimeout(() => resolve(""), 2000))
  ])
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === 'getPdfSelectionApp' || msg.message === 'getPdfSelectionApp') {
    getPdfSelectedText().then(sendResponse);
    return true;
  }
});

function StyleListFromJSON(props) {
  return (
    <span > <select className='StyleList-style' name="category" onChange={event => props.handleStyleChange(event)} value={props.current_style}>
        {props.stylelist.map(list => (
          <option key={list.id} value={list.val} disabled={list.disabled}>
            {list.name}
          </option>
        ))}
      </select>
    </span>
  );
}

function DividerListFromJSON({divider_list, last_divider, handleDividerChange}) {

  return (
    <span className="App-general"><select className='AreaGeneric-style' name="category" onChange={event => handleDividerChange(event)} value={last_divider}>
        {divider_list.map(list => (
          <option key={list.id} value={list.val}>
            {list.val}
          </option>
        ))}
      </select>
    </span>
  );
}

function OutputTitle(props) {
  return (
    ((props.title === undefined || props.title === null || props.title === '') ?
    (<div className="OutputTitleContainer" contentEditable onBlur={(event) => props.updateTextTitleOutputUserEdit(-1, event.target.innerText, null, null)} >
      <span className="OutputTitle" ><em ><strong>New session...</strong></em></span>
    </div>)
    :
    (<div className="OutputTitleContainer" contentEditable onBlur={(event) => props.updateTextTitleOutputUserEdit(-1, event.target.innerText, null, null)} >
      <span className="OutputTitle" ><em ><strong>{trim_title(props.title)}</strong></em></span>
    </div>))
  );
}

function CopyToClipboardButton(props) {
  // This used to be an actual Copy To Clipboard. Since, it's changed to export to CSV. Actual CSV is generated by the backend.
  // This mechanism does not work on every website. Some block it.

  // Not used at the moment
  const copyToClipboard = () => {
      navigator.clipboard.writeText(JSON.stringify({'title': props.titleOutput, 'url': props.urlOutput, 'content': props.textOutput, 'qa_list': props.qa_list}));
  }

  const handleExportSession = async () => {
    fetch(API_URL + '/exportsession', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Access-Control-Allow-Origin": "*",
        "Authorization": "Bearer " + props.login_jwt,
      },
      body: JSON.stringify({
        url: props.url,
        title: props.titleOutput,
        output: props.paletteOutput,
        qa_list: props.qa_list,
      }),
    })
    .then((response) => {
      if (!response.ok) {
        console.log('response: ', response);
        if (response.msg != undefined && response.msg.startsWith('Bad Auth')) {
          throw new Error("Unauthorized");
        }
        throw new Error("Error");
      }
      return response.blob();
    })
    .then(blob => {
      // chatgpt magic :-)
      console.log(blob);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'session.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.log('Error in exporting session: ', error);
      if (error.message === "Unauthorized") {
        alert('Please login to export your session.');
      } else {
        alert('Error in exporting session.');
      }
    });
  }

  return (
    <ButtonWithPopper onClick={handleExportSession} className={"MainButton"} buttonText={""} iconName={"PrinterBlackIcon"} iconClass={"MainIconButtonSpec"} popperText={"Export all current output to a CSV file."} showPopper={props.showPopper}/>
  );
}

function ToSavedPage({toggle_func, showPopper}) {
  return (
    <ButtonWithPopper onClick={() => toggle_func(1)} className={"MainButton"} buttonText={""} iconName={"BooksIcon"} iconClass={"MainIconButtonSpec"} popperText={"Go to your saved collection page."} showPopper={showPopper}/>
  );
}

function ResetOutput(props) {
  return (
    <ButtonWithPopper onClick={() => props.resetOutput()} className={"MainButton"} buttonText={""} iconName={"ResetIcon"} iconClass={"MainIconButtonSpec"} popperText={"Reset all the current output, starting a clean slate."} showPopper={props.showPopper}/>
  );
}

function SaveToMyCollection (props) {
  const [openState, setOpen] = useState(false);
  const [lastDividerState, setLastDivider] = useState(props.divider_list[0].val);
  const [newDividerName, setNewDividerName] = useState('');
  
  const handleInputChange = (e) => {
    setNewDividerName(e.target.value);
    const lenInput = e.target.value.length;
    if (lenInput > 0) {
      setLastDivider(NEW_DIVIDER_KEYWORD);
    }
    else {
      setLastDivider(props.divider_list[0].val);
    }
  }
  
  const handleDividerChange = (e) => {
    setLastDivider(e.target.value);
    if (e.target.value != NEW_DIVIDER_KEYWORD) {
      setNewDividerName('');
    }
  };

  const handleCheckboxClick = async () => {
    if (props.loggedIn !== true) {
      SwalAlert('Error', 'Please login to save your collection.');
      return;
    }
    if (lastDividerState == NEW_DIVIDER_KEYWORD && newDividerName.length == 0) {
      // User switched to 'New divider...' without entering a name
      return
    }
    if (newDividerName == NEW_DIVIDER_KEYWORD) {
      // user used the forbidden keyword
      return
    }

    const all_data = {'title': props.titleOutput, 'url': props.url, 'long_summary': props.paletteOutput, 'qa_list': props.qa_list};
    const newLastDivider = (newDividerName.length > 0 ? newDividerName : lastDividerState);
    if (newDividerName.length > 0) {
      new_divider_request_and_save(props.login_jwt, newLastDivider, setLastDivider, setNewDividerName, all_data, props.updateSavedQueries);
    } else {
      setLastDivider(newLastDivider);
      save_session(props.login_jwt, all_data, newLastDivider, props.updateSavedQueries);  
    }
    setOpen(false);
  };

  return (
    <div className='Save-container'>
      <NotionExportButton exportToNotion={props.exportToNotion}/>
      <CopyToClipboardButton titleOutput={props.titleOutput} url={props.url} paletteOutput={props.paletteOutput} qa_list={props.qa_list} login_jwt={props.login_jwt} showPopper={props.showPopper} />
      <ButtonWithPopper disabledFlag={false} role='button' onClick={(e) => setOpen(!openState)} className={"MainButton"} buttonText={""} iconName={"SaveIcon"} iconClass={"MainIconButtonSpec"} popperText={"Save session."} showPopper={props.showPopper}/>

      {openState && (
        <>
        <DividerListFromJSON divider_list={props.divider_list} last_divider={lastDividerState} handleDividerChange={handleDividerChange} />&nbsp;
        <input
        type="text"
        placeholder={NEW_DIVIDER_KEYWORD}
        value={newDividerName}
        style={{width: '20%', height: '100%', border: 'none', fontSize: '16px', padding: 7, margin: 0, borderRadius: 5}}
        onChange={(e) => handleInputChange(e)}
        />&nbsp;
        <ButtonWithPopper disabledFlag={false} role="button" onClick={handleCheckboxClick} className={"QASearchButton"} buttonText={""} iconName={"CheckIcon"} iconClass={"QASearchSpec"} popperText={"Confirm save."} showPopper={props.showPopper}/>
        {/*<button class="ButtonGeneric-style" role="button" onClick={handleCheckboxClick}>&#10004;</button>*/}
        </>
      )}
    </div>
  );
}

function ParseMarkedText({handleClickMarked, window, showPopper, process_disabled}) {
  return (
    <ButtonWithPopper disabledFlag={process_disabled} onClick={() => handleClickMarked()} className={"MainButton"} buttonText={""} iconName={"BrushIcon"} iconClass={"MainIconButtonSpec"} popperText={"Process only highlighted text in the chosen style. Should be used when processing the entire page fails or when interested in focusing on a subset of the text."} showPopper={showPopper} />
  );
}

function PaletteOutput(props) {
  return (
    props.paletteOutput.length > 0 ? (
      <div>
        {props.paletteOutput.map((output, index) => {
          return (
            <SinglePaletteOutput
              output={output}
              id={index}
              handleGoodBadClick={props.handleGoodBadClick}
              showPopper={props.showPopper}
              process_disabled={props.process_disabled}
              updateTextTitleOutputUserEdit={props.updateTextTitleOutputUserEdit}
              deletePalette={props.deletePalette}
              contentEditable={true}
              alert_handle_new={props.alert_handle_new}
              />
          );
        })}
      </div>
    ) : (
      <div>
        <SinglePaletteOutput
          output={{'title': DEFAULT_TITLE_OUTPUT, 'text': props.DEFAULT_TEXT_OUTPUT}}
          id={-1}
          handleGoodBadClick={props.handleGoodBadClick}
          showPopper={props.showPopper}
          process_disabled={props.process_disabled}
          updateTextTitleOutputUserEdit={props.updateTextTitleOutputUserEdit}
          contentEditable={false}
          alert_handle_new={props.alert_handle_new}
        />
      </div>
    )
  );
}

function ParsingModule(props) {
  const [lastQueryID, setLastQueryID] = useState(''); // (props.lastQuery);

  useEffect(() => {
    if (props.context_menu_flag !== '' || props.context_menu_selection !== '') {
      if (props.context_menu_flag !== '' && props.context_menu_selection === '') {
        handleClick();
      } else if (props.context_menu_flag !== '' && props.context_menu_selection !== '' && !props.file_url) {
        handleClickMarked(props.context_menu_selection);
      } else if (props.context_menu_flag === '' && props.context_menu_selection !== '' && !props.file_url) {
        props.addNote(props.context_menu_selection);
      }
    }
    if (!props.file_url) {
      props.reset_context_menu();
    }
  }, [props.context_menu_flag, props.context_menu_selection]);

  const handleClick = () => {

    if (props.file_url) {
      handleClickMarked(props.context_menu_selection);
      return;
    }

    props.setLoadingFlag(true);
    var base_url = API_URL + "/process"
  
    fetch(base_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //"Access-Control-Allow-Origin": "*",
        "Authorization": "Bearer " + props.login_jwt,
      },
      body: JSON.stringify({
        url: window.location.href, //props.url,
        style: props.default_style,
      }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Unauthorized");
      }
      return response.json();
    }).then((data) => {
          if (data.error == 'True') {
            // If server reports an error, we try to send the HTML and run the request again. This is a workaround for some websites that block the server or require login.
            fetch(base_url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                //"Access-Control-Allow-Origin": "*",
                "Authorization": "Bearer " + props.login_jwt,
              },
              body: JSON.stringify({
                url: window.location.href, //props.url,
                style: props.default_style,
                web_html: props.window.document.documentElement.outerHTML,
              }),
            }).then((response_force) => {
              if (!response_force.ok) {
                throw new Error("Unauthorized");
              }
              return response_force.json();
            }).then((data_force) => {
              props.handleTextOutputChange(data_force.output, data_force.title, data_force.query_id, props.default_style, '', props.url);
              setLastQueryID(data_force.query_id);
              props.setLoadingFlag(false);
            })
          }
          else {
            props.handleTextOutputChange(data.output, data.title, data.query_id, props.default_style, '', props.url);
            setLastQueryID(data.query_id);
            props.setLoadingFlag(false);
          }
        })
    .catch((error) => {
      console.log('Process error: ', error);
      if (error.message == 'Unauthorized') {
        alert('Please log in to use this feature.');
      }
      props.setLoadingFlag(false);
      return;
    });
    props.reset_context_menu();
  };

  const handleClickMarked = async (selection = '') => {
    if (props.context_menu_selection !== '' && props.file_url) {
      selection = props.context_menu_selection;
    } else {
      if (selection === '') {
        let selectedTextResult;
        selectedTextResult = await getPdfSelectedText();
        if (selectedTextResult === undefined || selectedTextResult === '') {
          selectedTextResult = props.window.getSelection().toString();
        }
        selection = selectedTextResult;
      }
    }

    props.setLoadingFlag(true);

    var base_url = API_URL + "/processmarked";
    fetch(base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + props.login_jwt,
      },
      body: JSON.stringify({
        url: props.url,
        text: selection,
        style: props.default_style
      })
    })
    .then((response) =>
    response.json().then((data) => {
      // if data.output is undefined, then there was an error
      if (data.output === undefined) {
        console.log('Error in marked processing: ', data);
        if (data.msg.startsWith('Bad Auth')) {
          alert('Please log in to use this feature.');
        }
        props.setLoadingFlag(false);
        return;
      }
      
      props.handleTextOutputChange(data.output, data.title, data.query_id, props.default_style, selection, props.url);
              
      setLastQueryID(data.query_id);
      props.setLoadingFlag(false);

    })).catch(error => {
        // Handle the error
        console.log('Error in marked processing: ', error);
      });
    if (!props.file_url) {
      props.reset_context_menu();
    }
  };
  
  const handleStyleChange = (event) => {
    props.setDefaultStyle(event.target.value);
  };
  
  // legacy code. HandleGoodBad is not handled differently.
  const handleGoodBadClick = (msg, queryid) => {
    if (queryid != '') {
      var base_url = API_URL + "/reportquality"
      fetch(base_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + props.login_jwt,
        },
        body: JSON.stringify({
          query_id: queryid,
          flag: msg
        })
      })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => {
          // Handle the error
          console.log('Error in quality flag report: ', error);
        }
      );
    }
    else {
      console.log("Query ID non-existent.");
    }
  };

  return (
      <div>
        <div className="MainButton-container">
          <StyleListFromJSON stylelist={props.style_list} current_style={props.default_style} handleStyleChange={handleStyleChange} />
          <ParseButton handleClick={handleClick} showPopper={props.showPopper} file_url={props.file_url} process_disabled={props.process_disabled}/>
          <ParseMarkedText handleClickMarked={handleClickMarked} cur_window={props.window} showPopper={props.showPopper} process_disabled={props.process_disabled}/>
          <AddNoteButton addNote={props.addNote} showPopper={props.showPopper} process_disabled={props.process_disabled} />
          <ResetOutput resetOutput={props.resetOutput} showPopper={props.showPopper}/>
          <ToSavedPage toggle_func={props.toggle_func} showPopper={props.showPopper} />
          {/*<ShepTour />*/}
        </div>
        {/*<OutputTableJSONfunc lists={props.textOutput} updateTextTitleOutputUserEdit={props.updateTextTitleOutputUserEdit}/>*/}
        {/*<GoodOneButton handleGoodBadClick={handleGoodBadClick} showPopper={props.showPopper} />
        <BadOneButton handleGoodBadClick={handleGoodBadClick} showPopper={props.showPopper} />*/}
      </div>
  );
}

function ProcessOutput(props) {

  const handleGoodBadClick = (msg, queryid) => {
    // check if lastQueryID is not ''
    if (queryid != '') {
      // make a post request to the server to update the database
      var base_url = API_URL + "/reportquality"
      fetch(base_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + props.login_jwt,
        },
        body: JSON.stringify({
          query_id: queryid,
          flag: msg
        })
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          props.alert_handle_new('Thanks for the feedback!');
        })
        .catch(error => {
          // Handle the error
          console.log('Error in quality flag report: ', error);
        }
      );
    }
    else {
      console.log("Query ID non-existent.");
    }
  };

  return (
    <div>
      <OutputTitle title={props.titleOutput} paletteOutput={props.paletteOutput} updateTextTitleOutputUserEdit={props.updateTextTitleOutputUserEdit}/>
      <PaletteOutput paletteOutput={props.paletteOutput} updateTextTitleOutputUserEdit={props.updateTextTitleOutputUserEdit} deletePalette={props.deletePalette} handleGoodBadClick={handleGoodBadClick} DEFAULT_TEXT_OUTPUT={props.DEFAULT_TEXT_OUTPUT} alert_handle_new={props.alert_handle_new} />
    </div>
  );
}


class DynamicQAList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showText: {}
    };
  }

  toggleText = id => {
    this.setState(prevState => ({
      showText: {
        ...prevState.showText,
        [id]: !prevState.showText[id]
      }
    }));
  };

  render() {
    const list = this.props.list;
    return (
      <div >
        {list.map(([q, a, id, text]) => (
          <div className='PaletteContainer' key={id}>
            <QuestionHeader q={q} a={a} id={id} text={text} showText={this.state.showText} toggleText={this.toggleText} handleDeleteQAList={this.props.handleDeleteQAList} askAsChat={this.props.askAsChat} showPopper={this.props.showPopper} />
            <div className='AnswerStyle'>
              {a}
            </div>
            {this.state.showText[id] ? (
              <div className='QAQuote'>{text}</div>
            ) : (
              <span></span>
            )}
          </div>
        ))}
      </div>
    );
  }
}

function AskQuestion(props) {
  const [question, setQuestion] = useState('');
  const [loadingText, setLoadingText] = useState('');

  function handleChange(event) {
    setQuestion(event.target.value);
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      // Handle sending the question here
      handleClick();
    }
  }
    
  async function handleClick(input_question='') {
    if (props.loggedIn !== true) {
      alert('Please login to ask a question about the document.');
      return;
    }
    // Handle sending the question here
    //console.log(question);
    props.setLoadingFlag(true);
    console.log('Entering question with context_menu_selection: ', props.context_menu_selection);
    console.log('Entering question with window.getSelection(): ', props.window.getSelection().toString());
    let selectedTextResult;
    if (props.context_menu_selection !== undefined && props.context_menu_selection !== '') {
      selectedTextResult = props.context_menu_selection;
    } else {
      selectedTextResult = await getPdfSelectedText();
      if (selectedTextResult === undefined || selectedTextResult === '') {
        selectedTextResult = props.window.getSelection().toString();
      }
    }
    
    var marked_text = selectedTextResult; 

    if (marked_text === '') {
      setLoadingText('Loading...');
    } else {
      if (marked_text.length > 40) {
        setLoadingText('Loading... with marked text: ' + marked_text.substring(0, 40) + '...');
      } else {
        setLoadingText('Loading... with marked text: ' + marked_text);
      }
    }
    
    var base_url = API_URL + "/question";
    const final_question = input_question.length > 0 ? input_question : question;
    console.log('first fetch, marked text: ', marked_text);
    fetch(base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + props.login_jwt,
      },
      body: JSON.stringify({
        url: props.url,
        question: final_question,
        marked_text: marked_text,
        qa_list: props.qa_list,
        web_html: '',
      })
    })
      .then(response => response.json())
      .then(data => {
        if (!data.error) {
          props.handleAddQAList(final_question, data.answer, data.supporting_quote);

          props.setLoadingFlag(false);
          setLoadingText('');
        } else {
          // error occured -- try to send the HTML and run the request again.
          fetch(base_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + props.login_jwt,
            },
            body: JSON.stringify({
              url: props.url,
              question: final_question,
              qa_list: props.qa_list,
              web_html: props.window.document.documentElement.outerHTML,
            })
          })
            .then(response => response.json())
            .then(data => {
              props.handleAddQAList(final_question, data.answer, data.supporting_quote);
              props.setLoadingFlag(false);
              setLoadingText('');    
            })
            .catch(error => {
              console.log('Error getting answer to question: ', error);
              props.setLoadingFlag(false);
              setLoadingText('Encountered error. Please try again. Perhaps the server is having trouble downloading the document. Try marking some or all of the text (Ctrl+A/Cmd+A on Windows/Mac).');
            });
        }
      })
      .catch(error => {
        console.log('Error getting answer to question: ', error);
        props.setLoadingFlag(false);
        setLoadingText('Encountered error. Please try again. Perhaps the server is having trouble downloading the document. Try marking some or all of the text (Ctrl+A/Cmd+A on Windows/Mac).');
      });  
  }
  
  function askAsChat(question_id) {
    console.log('askAsChat: ', question_id);
    // find element in qa_list with question_id
    let question = '';
    let answer = '';
    for (var i = 0; i < props.qa_list.length; i++) {
      if (props.qa_list[i][2] === question_id) {
        question = props.qa_list[i][0];
        answer = props.qa_list[i][1];
        break;
      }
    }
    if (i === props.qa_list.length) {
      console.log('Error: could not find question_id in qa_list');
      return;
    }
    handleClick('/chat ' + question);
  }

  return (
    <div >
      <div className='QA-container'>
        <input
          className='AskQuestionInput'
          type="text"
          placeholder='Ask a question about the text...'
          value={question}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          autoFocus
        />
        <ButtonWithPopper disabledFlag={props.process_disabled} onClick={handleClick} className={"QASearchButton"} buttonText={""} iconName={"SearchIcon"} iconClass={"QASearchSpec"} popperText={"Send a question about the text. If some text is marked, the answer will be based on it. For general ChatGPT/Bard/Bing-like behavior, with no regard to the current URL, start the question with \"/chat\"."} showPopper={props.showPopper}/>
      </div>
      {loadingText !== '' && <div className='LoadingQAStyle'><b>{loadingText}</b><br /></div>}
      
      {props.qa_list.length > 0 && 
      <div style={{width: '100%'}}>
        <DynamicQAList list={props.qa_list.slice().reverse()} handleDeleteQAList={props.handleDeleteQAList} askAsChat={askAsChat} showPopper={props.showPopper} />
      </div>}
    </div>
  );
}

class App extends Component {
  constructor(props) {
    super(props);

    this.toggle = props.handleToggle;

    this.textOutput = props.textOutput;
    this.titleOutput = props.titleOutput;

    this.lastQueryID = props.lastQueryID;

    this.handleTextOutputChange = props.handleTextOutputChange;

    this.url = window.location.href;
    this.domain = new URL(this.url).hostname;
    if (this.url.startsWith('file://')) {
      this.domain = 'file';
    }
    this.handleAddQAList = props.handleAddQAfield;
    this.handleDeleteQAList = props.handleDeleteQAfield;
    this.exportToNotion = props.exportToNotion;

    this.login_jwt = props.login_jwt;

    this.interval = setInterval(() => {
      if (window.location.href !== this.url) {
        this.url = window.location.href;
      }
    }, 100);
    this.DEFAULT_TEXT_OUTPUT = [RANDOM_TIPS[Math.floor(Math.random() * RANDOM_TIPS.length)]];
  }

  render() {
    return (
      <div className="App-BG">
        <div className="App">
          <div className="fixed-panel">
            <HeaderCustom className="App-header" tagline="Distill information." isExt={this.props.isExt} toggle_page={this.toggle} loading_flag={this.props.loading_flag} loggedIn={this.props.loggedIn} />
            <ParsingModule toggle_func={this.toggle} url={this.url} window={window} document={document} loggedIn={this.props.loggedIn} paletteOutput={this.props.paletteOutput} textOutput={this.props.textOutput} titleOutput={this.props.titleOutput} lastQueryID={this.lastQueryID} handleTextOutputChange={this.handleTextOutputChange} login_jwt={this.props.login_jwt} style_list={this.props.style_list} default_style={this.props.default_style} loading_flag={this.props.loading_flag} setLoadingFlag={this.props.setLoadingFlag} updateTextTitleOutputUserEdit={this.props.updateTextTitleOutputUserEdit} addNote={this.props.addNote} setDefaultStyle={this.props.setDefaultStyle} context_menu_flag={this.props.context_menu_flag} context_menu_selection={this.props.context_menu_selection} reset_context_menu={this.props.reset_context_menu} resetOutput={this.props.resetOutput} getSelectedTextPDF={this.props.getSelectedTextPDF} showPopper={this.props.showPopper} file_url={this.props.file_url} process_disabled={this.props.process_disabled} deletePalette={this.props.deletePalette} />
            <AlertBoard alert_message={this.props.alert_message} alert_handle_close={this.props.alert_handle_close} />
          </div>
          <div className="scrollable-panel">
            <YoutubeEmbed embedId={YOUTUBE_ID} login_jwt={this.props.login_jwt} new_user={this.props.new_user} />
            <FileDisclaimer file_url={this.props.file_url} process_disabled={this.props.process_disabled} />
            <LongLoadingMsg showLoadingMessage={this.props.showLoadingMessage} />
            <ProcessOutput toggle_func={this.toggle} url={this.url} window={window} document={document} loggedIn={this.props.loggedIn} paletteOutput={this.props.paletteOutput} textOutput={this.props.textOutput} titleOutput={this.props.titleOutput} lastQueryID={this.lastQueryID} handleTextOutputChange={this.handleTextOutputChange} login_jwt={this.props.login_jwt} style_list={this.props.style_list} default_style={this.props.default_style} loading_flag={this.props.loading_flag} setLoadingFlag={this.props.setLoadingFlag} updateTextTitleOutputUserEdit={this.props.updateTextTitleOutputUserEdit} addNote={this.props.addNote} setDefaultStyle={this.props.setDefaultStyle} context_menu_flag={this.props.context_menu_flag} context_menu_selection={this.props.context_menu_selection} reset_context_menu={this.props.reset_context_menu} resetOutput={this.props.resetOutput} getSelectedTextPDF={this.props.getSelectedTextPDF} showPopper={this.props.showPopper} file_url={this.props.file_url} process_disabled={this.props.process_disabled} deletePalette={this.props.deletePalette} DEFAULT_TEXT_OUTPUT={this.DEFAULT_TEXT_OUTPUT} alert_handle_new={this.props.alert_handle_new} />
            <AskQuestion url={this.url} window={window} document={document} qa_list={this.props.qa_list} handleAddQAList={this.handleAddQAList} handleDeleteQAList={this.handleDeleteQAList} login_jwt={this.props.login_jwt} setLoadingFlag={this.props.setLoadingFlag} context_menu_selection={this.props.context_menu_selection} showPopper={this.props.showPopper} file_url={this.props.file_url} process_disabled={this.props.process_disabled} loggedIn={this.props.loggedIn}/>
            <SaveToMyCollection divider_list={this.props.divider_list} login_jwt={this.props.login_jwt} paletteOutput={this.props.paletteOutput} textOutput={this.props.textOutput} titleOutput={this.props.titleOutput} url={this.url} qa_list={this.props.qa_list} updateSavedQueries={this.props.updateSavedQueries} showPopper={this.props.showPopper} exportToNotion={this.exportToNotion} loggedIn={this.props.loggedIn} />
            
            {/* Settings for main page. Too lazy to put in a specialized function */}
            <div className="SettingsAppPage"><br />
              <div style={{textAlign: 'left', textIndent: '10px'}}>
                <MyCheckbox text={"Auto-open on current domain (" + this.domain.toString() + ')'} value={this.props.auto_open_current_website} setValue={this.props.toggle_auto_open_website} /><br />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '5px' }}>
                <div style={{ textIndent: '10px' }}>
                  <MyCheckbox text={''} value={this.props.auto_process_current_website} setValue={this.props.toggle_auto_process_website} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ textIndent: '25px' }}>
                    {"When opened on this domain, auto-process in style: "}
                    <StyleListFromJSON stylelist={this.props.style_list} current_style={this.props.auto_process_current_website_style} handleStyleChange={(event) => this.props.handle_auto_process_current_website_style(event.target.value)} />
                  </span>
                  <br />
                </div>
              </div>
            </div>
            <Disclaimer />
          </div>
        </div>
      </div>
    );
  }

}

export default App;