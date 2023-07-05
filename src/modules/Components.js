/*global chrome*/
import React, { Component, useState, useEffect, useRef} from 'react';
import logo from './logonew.png';
import './App.css';
import { config } from './config';
import { createPopper } from '@popperjs/core';
import logosvg from './logo.svg';
import { TailSpin } from  'react-loader-spinner'
import Swal from 'sweetalert2';

const API_URL = config.API_URL;
const MAX_TITLE_LENGTH = config.MAX_TITLE_LENGTH;

export function SwalAlert(title, text, icon="error") {
  Swal.fire({
    title: title,
    text: text,
    icon: icon,
    showCancelButton: false,
    confirmButtonColor: '#F87D09',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Okay',
    customClass: {
      container: 'z-19999' // currently not working, neither in CSS file.
    },
})
}
export function GoodOneButton({handleGoodBadClick, showPopper, className, queryid}) {
  return (
      <ButtonWithPopper onClick={event => handleGoodBadClick('good', queryid)} className={(typeof className === 'string') ? className : "ButtonGeneric-style"} buttonText={""} iconName={"ThumbsUpPalette"} iconClass={"PaletteIconButtonSpecThumbs"} popperText={"This button sends the server a thumb-up for the original processing it made (before user editing). It helps us improve the service."} showPopper={showPopper}/>
  );
}

export function BadOneButton({handleGoodBadClick, showPopper, className, queryid}) {
  return (
      <ButtonWithPopper onClick={event => handleGoodBadClick('bad', queryid)} className={(typeof className === 'string') ? className : "ButtonGeneric-style"} buttonText={""} iconName={"ThumbsDownPalette"} iconClass={"PaletteIconButtonSpecThumbs"} popperText={"This button sends the server a thumb-down for the original processing it made (before user editing). It helps us improve the service. After reporting, you'll be able to request a fresh processing."} showPopper={showPopper}/>
  );
}



export function Disclaimer() {
    return (
      <div>
        <p className="Disclaimer-style">Disclaimer &#128519;: This is a beta version. Bugs and inaccurate results may occur.</p>
      </div>
    );
  }

export function ButtonWithPopper({onClick, className, buttonText='', iconName='', iconClass='', popperText, showPopper, disabledFlag=false, role=null}) {
  const buttonRef = useRef(null);
  const [popperElement, setPopperElement] = useState(null);
  const popperInstance = useRef(null);

  useEffect(() => {
    buttonRef.current.disabled = disabledFlag;
  }, [disabledFlag]);

  useEffect(() => {
    if (buttonRef.current && popperElement) {
      popperInstance.current = createPopper(buttonRef.current, popperElement, {
        placement: 'top',
      });
    }

    return () => {
      if (popperInstance.current) {
        popperInstance.current.destroy();
      }
    };
  }, [buttonRef.current, popperElement]);

  const handleMouseEnter = () => {
    setPopperElement(<div className='tooltip'>{popperText}</div>);
  };

  const handleMouseLeave = () => {
    setPopperElement(null);
  };

  return (
    <>
      <button ref={buttonRef} className={className} onClick={onClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} disabled={disabledFlag} role={role}>
        {buttonText.length > 0 ? buttonText : <img src={chrome.runtime.getURL("static/media/" + iconName + ".svg")} className={iconClass} alt="logo" />}
      </button>
      {showPopper && popperElement && (        
        <div
          style={{
            position: 'fixed',
            top: 8,
            left: 87,
            zIndex: 9999,
          }}
        >
          {popperElement}
        </div>
      )}
    </>
  );
};

export function AlertBoard(props) {
  return props.alert_message.length > 0 ? (
    <div className="AlertBoard-style">
      <div className="AlertBoardTitle-style">
        <button className={"PaletteButtonEscape"} onClick={props.alert_handle_close}>
          <img src={chrome.runtime.getURL("static/media/EscapeIcon.svg")} className={"PaletteIconButtonSpec"} />
        </button>
        <strong>Alert</strong>
      </div>
      <div className="AlertBoardContent-style">
        <div className="AlertBoardContentItemText-style">{props.alert_message}</div>
      </div>
    </div>
  ) : null;
}

export function HeaderCustom(props) {
  return (
      <header className="App-header">
        <div class="HeaderFigma">
          <div class="PreHeader"></div>
          <button className="link-button" onClick={() => props.toggle_page(3)}>
                {props.loggedIn ? 
                <span class="HeaderSettings">Settings</span>
                :
                <span class="HeaderSettings">Login</span>
                }</button>
          <span class="HeaderSubtitle">{props.tagline}</span>
          <button className="link-button" onClick={() => props.toggle_page(2)}>
            <span class="HeaderAbout">About</span></button>
          <span class="HeaderTitle">Essence</span>
          <div class="PostHeader"></div>
          <div class="spinner-wrapper">
            <TailSpin
              height="62"
              width="62"
              position="absolute"
              top="2px"
              left="10px"
              color="#F87D09"
              ariaLabel="tail-spin-loading"
              radius="1"
              wrapperStyle={{}}
              wrapperClass=""
              visible={props.loading_flag || false}
            />
          </div>
        </div>
      </header>
  );
  }
    
  
export function HeaderCustomOld(props) {
return (
    <header className="App-header">
    <table>
    <tr>
        <td>
        {props.loading_flag ? 
        <img src={chrome.runtime.getURL("static/media/logonew.png")} className="App-logo-spin" alt="logo" />
        :
        <img src={chrome.runtime.getURL("static/media/logonew.png")} className="App-logo" alt="logo" />
        } 
        </td>
        <td>
        <table className='TopTable-style' width="100%">
            <tr><h1 className="App-title">Essence</h1></tr>
        </table>
        </td>
        <td>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </td>
        <td>              
        <table className='TopTableRight-style'>
            <tr><button className="link-button" onClick={() => props.toggle_page(2)}>About</button></tr>
            <tr><button className="link-button" onClick={() => props.toggle_page(3)}>
              {props.loggedIn ? 
              <span>Settings</span>
              :
              <span>Login</span>
              }</button></tr>
        </table>
        </td>
    </tr>
    </table>
    <h3 className="App-subtitle" align="left">{props.tagline}</h3>
</header>
);
}
  
export function MyHoverButton() {
  const [showTextBox, setShowTextBox] = useState(false);
  const [textBoxPosition, setTextBoxPosition] = useState({ x: 0, y: 0 });

  return (
    <div>
      <button
        onMouseEnter={() => setShowTextBox(true)}
        onMouseLeave={() => setShowTextBox(false)}
        onMouseMove={event => setTextBoxPosition({ x: event.clientX, y: event.clientY })}
      >
        Hover over me
      </button>
      {showTextBox && (
        <div style={{ position: 'absolute', left: textBoxPosition.x, top: textBoxPosition.y }}>
          <span className='App-general'>{'textuni'}</span>
        </div>
      )}
    </div>
  );
}

export function DissipatingMessage({message, time_ms}) {
  // State to keep track of whether the alert should be shown
  const [showAlert, setShowAlert] = useState(true);

  // Hide the alert after time_ms (i.e. time in milliseconds)
  setTimeout(() => setShowAlert(false), time_ms);

  return (
    <div>
      {showAlert && (
        <div>
          {message}
        </div>
      )}
    </div>
  );
}

export function setLocalData(key, value) {
  // Note: there are two variants, local and sync.
  // In sync, the data is synced across all devices. However, this storage is limited. We therefore opt for local.
  chrome.storage.local.set({[key]: value}, function() {
    return;
  });
}

// mostly unused. Currently the function content is called explicitly in some places.
export function getLocalData(key) {
  chrome.storage.local.get([key], function(result) {
    console.log('Data retrieved. Key: ' + key + '. Value: ' + result[key]);
  });
}

export function getSavedQueries(login_jwt, handleSavedQueriesChange) {
  var url = API_URL + '/getsavedqueries';

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login_jwt
    },
    body: JSON.stringify(
      {field: ''}
    )
  })
  .then((response) => {
    if (!response.ok) {
      if (response.msg.startsWith('Bad Auth')) {
        throw new Error("Unauthorized");
      }
      throw new Error("Error");
    }
    return response.json();
  })
  .then((saved_query_data) => {
    handleSavedQueriesChange(saved_query_data);
  })
  .catch((error) => {
    console.error('Error saved queries:', error);
  });
}

export function autologin(login_jwt, handleLogin) {
  var base_url = API_URL + "/loginjwt";

  fetch(base_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login_jwt,
    },
    body: JSON.stringify({
      field: '', // placeholder
    })
  })
    .then(response => response.json())
    .then(data => {
      // data.logged_in is almost certainly true. Will leave as a placeholder in case we want to change the functionality, e.g. jwt token unexpired, but user is banned
      data.logged_in ? handleLogin(true, data.username, '', data.remaining_queries, data.remaining_questions) : handleLogin(false, '', '');
    })
    .catch(error => {
      console.log('Error occured in JWT confirmation: ', error);
    });
  }

export function new_divider_request_and_save(login_jwt, divider_name, setLastDivider, setNewDividerName, all_data, updateSavedQueries) {
  fetch(API_URL + "/adddivider", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login_jwt,
    },
    body: JSON.stringify({
      new_divider_name: divider_name,
    })
  })
    .then(response => response.json())
    .then(data => {
      // data.logged_in is almost certainly true. Will leave as a placeholder in case we want to change the functionality, e.g. jwt token unexpired, but user is banned
      setLastDivider(divider_name);
      setNewDividerName('');
      save_session(login_jwt, all_data, divider_name, updateSavedQueries);
    })
    .catch(error => {
      console.log('Error occured in new divider creation: ', error);
    });
}
  

export async function new_divider_request_old(login_jwt, divider_name) {
  fetch(API_URL + "/adddivider", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login_jwt,
    },
    body: JSON.stringify({
      new_divider_name: divider_name,
    })
  })
    .then(response => response.json())
    .then(data => {
      // data.logged_in is almost certainly true. Will leave as a placeholder in case we want to change the functionality, e.g. jwt token unexpired, but user is banned
      console.log('add new divider response: ', data);
    })
    .catch(error => {
      console.log('Error occured in new divider creation: ', error);
    });
}

export function CheckWidth(window, bodyElement, appCurrentStatus, extensionWidth) {
  const [myVariable, setMyVariable] = useState(null);

  useEffect(() => {
    // Check if myVariable has been changed every 100ms
    const interval = setInterval(() => {
      // Do something with myVariable here
      console.log(myVariable);
      if (appCurrentStatus === "block") {
        bodyElement.style.width = `${window.innerWidth - extensionWidth}px`;
      } else {
        bodyElement.style.width = `${window.innerWidth}px`;
      };
    }, 100);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [myVariable]);

}

export function save_session(login_jwt, all_data, divider_name, executeEventually) {
  // Due to difficulty with ordering of execution, we accept here a "executeEventually" function
  // that is called after the fetch is returned. This is a hacky solution, but it works.
  var base_url = API_URL + "/savesession"

  fetch(base_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login_jwt,
    },
    body: JSON.stringify({
      data: all_data,
      divider: divider_name,
    })
  })
    .then(response => response.json())
    .then(data => {
      // data.logged_in is almost certainly true. Will leave as a placeholder in case we want to change the functionality, e.g. jwt token unexpired, but user is banned
      // data.logged_in ? handleLogin(true, data.username, '') : handleLogin(false, '', '');
      console.log('Returned from save fetch, ', data);

      executeEventually();
    })
    .catch(error => {
      console.log('Error occured in JWT confirmation: ', error);
    });
  }

/* 
a bunch of boilerplate code for the buttons of App.js
*/
export function PrintSavedQAList({savedQAList}) {
  // print every item of savedQAList in the form item[0]: item[1]
  return (
      <div >
          {savedQAList.map((item, index) => (
              <div key={index}>
                  <div className={"PaletteContainer"}>
                    <div className="SavedQAList-style"><strong>{item[0]}</strong></div>
                    <div className="SavedQAList-style">
                      {item[1]}
                    </div>
                  </div>
              </div>
          ))}
      </div>
  );
}

export function delete_divider(login_jwt, divider_name, updateSavedQueries) {
  fetch(API_URL + "/deletedivider", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login_jwt,
    },
    body: JSON.stringify({
      divider_name: divider_name,
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log('delete divider response: ', data);
      updateSavedQueries();
    })
    .catch(error => {
      console.log('Error occured in divider deletion: ', error);
    });
}

export function delete_session(login_jwt, subject, session_id, updateSavedQueries) {
  fetch(API_URL + "/deletesession", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login_jwt,
    },
    body: JSON.stringify({
      session_id: session_id,
      subject: subject,
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log('delete divider response: ', data);
      updateSavedQueries();
    })
    .catch(error => {
      console.log('Error occured in session deletion: ', error);
    });
}

export function MyCheckbox({ text, value, setValue, disabled=false }) {

  return (
    <label>
      <input type="checkbox" value={value} onChange={() => setValue(!value)} checked={value} className="custom-checkbox" disabled={disabled} />
      <span class="checkmark"></span>
      {text}
    </label>
  );
}

export function FileDisclaimer({file_url, process_disabled}) {
  return (
    file_url && process_disabled ?
      <div className="PaletteContainer">
        <div className="FileDisclaimerStyle">
            <div style={{height: '5px'}}><br /></div>
            <b>Since you loaded this document from file (and not web), you must highlight text, right click it and select "Process this..."</b>
        </div>
      </div>
      :
      <></>
  )
}

function InnerTableJSON(props) {
  // table for the inner list
  return (
    <div>
      <table>
        <tr>
          {props.innerlist[0].map((col, col_index) => (
            ((props.innerlist[0].length > 1) ? 
              <th contentEditable={props.contentEditable} onBlur={(event) => props.updateTextTitleOutputUserEdit(props.palette_index, null, event.target.innerText, props.index, 'value', 0, col_index)}>{col}</th> 
              : 
              <td contentEditable={props.contentEditable} onBlur={(event) => props.updateTextTitleOutputUserEdit(props.palette_index, null, event.target.innerText, props.index, 'value', 0, col_index)}>{col}</td>
            )
          ))}
        </tr>
          {props.innerlist.slice(1).map((list, row_index) => (
            <tr>
              {list.map((col, col_index) => (
                <td contentEditable={props.contentEditable} onBlur={(event) => props.updateTextTitleOutputUserEdit(props.palette_index, null, event.target.innerText, props.index, 'value', row_index+1, col_index)}>{col}</td>
              ))}
            </tr>
          ))}
      </table>
    </div>
  );
}


export function OutputTableJSONfunc(props) {
  return (
    (typeof props.lists === 'string') ? 
    (
    <form>
      <textarea className="TextArea-style" id="docsum" name="summary" rows="12" cols="41" value={props.lists}>
      </textarea>
    </form>
    )
    :
    (
    <table className='OutputTable-style' width="100%">
      {props.lists.map((list, index) => {
        return (typeof list.value === 'string') ? ( 
        <tr>
          <th className='FirstColumn-style' contentEditable={props.contentEditable} onBlur={(event) => props.updateTextTitleOutputUserEdit(props.id, null, event.target.innerText, index, 'key', null, null)}>{list.key}</th>
          <td contentEditable={props.contentEditable} onBlur={(event) => props.updateTextTitleOutputUserEdit(props.id, null, event.target.innerText, index, 'value', null, null)}>{list.value}</td> 
        </tr>
        )
        :
        (
        <tr>
          <th contentEditable={props.contentEditable} onBlur={(event) => props.updateTextTitleOutputUserEdit(props.id, null, event.target.innerText, index, 'key', null, null)}>{list.key}</th>
          <td ><InnerTableJSON innerlist={list.value} updateTextTitleOutputUserEdit={props.updateTextTitleOutputUserEdit} index={index} palette_index={props.id} contentEditable={props.contentEditable} /></td>         
        </tr>
        )
      })}
    </table>
    )
  );
}

export function AddNoteButton(props) {
  return (
    <ButtonWithPopper disabledFlag={props.process_disabled} onClick={() => props.addNote('')} className={"MainButton"} buttonText={""} iconName={"AddNoteIcon"} iconClass={"MainIconButtonSpec"} popperText={"Add a note. Notice that you can directly add highlighted text by right-clicking it, then Process Marked, then Add as note."} showPopper={props.showPopper}/>
  )
}

function DeletePaletteButton(props) {
  return (
    <ButtonWithPopper disabledFlag={props.process_disabled} onClick={() => props.deletePalette(props.id)} className={(typeof props.className === 'string') ? props.className : "ButtonGeneric-style"} buttonText={""} iconName={"TrashPalette"} iconClass={"PaletteIconButtonSpec"} popperText={"Delete this output palette."} showPopper={props.showPopper}/>
  )
}

function LinkButton(props) {
  const openNewTab = (url) => {
    window.open(url, '_blank');
  }

  return (
    <ButtonWithPopper disabledFlag={props.process_disabled} onClick={() => openNewTab(props.url)} className={(typeof props.className === 'string') ? props.className : "ButtonGeneric-style"} buttonText={""} iconName={"LinkPalette"} iconClass={"PaletteIconButtonSpec"} popperText={"Open the original URL of this palette."} showPopper={props.showPopper}/>
  )
}

export function LeftAlignedTextWithRightAlignedButtons ({ output, showPopper, process_disabled, handleGoodBadClick, id, updateTextTitleOutputUserEdit, deletePalette, contentEditable, alert_handle_new }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div contentEditable={contentEditable} onBlur={(event) => updateTextTitleOutputUserEdit(id, event.target.innerText, null, null)} className='PaletteOutput-title'>{output.title}</div>
      <div style={{ display: 'flex', position: 'relative' }}>
        <div style={{ display: 'flex', position: 'absolute', right: 0 }}>
          {((output.queryid !== '' && deletePalette !== undefined) ?
          <>
            <GoodOneButton className={'PaletteButton'} handleGoodBadClick={handleGoodBadClick} showPopper={showPopper} queryid={output.queryid} />
            <BadOneButton className={'PaletteButton'} handleGoodBadClick={handleGoodBadClick} showPopper={showPopper} queryid={output.queryid} />
          </>
          :
          <></>
          )}
          {((deletePalette !== undefined) ?
          <>
          <DeletePaletteButton className={'PaletteButton'} showPopper={showPopper} process_disabled={process_disabled} deletePalette={deletePalette} id={id} />
          <LinkButton className={'PaletteButton'} showPopper={showPopper} process_disabled={process_disabled} url={output.url} id={id} />
          </>
          :
          <></>
          )}
        </div>
      </div>
    </div>
  );
};

export function SinglePaletteOutput ({ output, id, handleGoodBadClick, showPopper, process_disabled, updateTextTitleOutputUserEdit, deletePalette, contentEditable, alert_handle_new }) {
  return (
    <div className='PaletteContainer'>
      <div className='App-general-left-process'>
        <LeftAlignedTextWithRightAlignedButtons output={output} showPopper={showPopper} process_disabled={process_disabled} handleGoodBadClick={handleGoodBadClick} id={id} updateTextTitleOutputUserEdit={updateTextTitleOutputUserEdit} deletePalette={deletePalette} contentEditable={contentEditable} alert_handle_new={alert_handle_new} />
        <OutputTableJSONfunc lists={output.text} id={id} updateTextTitleOutputUserEdit={updateTextTitleOutputUserEdit} contentEditable={contentEditable} />
      </div>
    </div>
  );
}

function LeftAlignedTextWithRightAlignedButtonsSaved ({ output, showPopper, process_disabled, handleGoodBadClick, id, updateTextTitleOutputUserEdit, deletePalette, contentEditable }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px' }}>
      <a href={output.url} target="_blank" className='PaletteOutputSaved-title'>{output.title}</a>
    </div>
  );
};

function SinglePaletteOutputSaved ({ output, id, handleGoodBadClick, showPopper, process_disabled, updateTextTitleOutputUserEdit, deletePalette, contentEditable }) {
  return (
    <div className='PaletteContainer'>
      <div className='App-general-left-process'>
        <LeftAlignedTextWithRightAlignedButtonsSaved output={output} showPopper={showPopper} process_disabled={process_disabled} handleGoodBadClick={handleGoodBadClick} id={id} updateTextTitleOutputUserEdit={updateTextTitleOutputUserEdit} deletePalette={deletePalette} contentEditable={contentEditable} />
        <div className='App-general-left-process-content'>
          <div className='App-general-left-process-content-text'>
            <OutputTableJSONfunc lists={output.text} id={id} updateTextTitleOutputUserEdit={updateTextTitleOutputUserEdit} contentEditable={contentEditable} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaletteOutputSaved(props) {
  return (
    props.paletteOutput.length > 0 ? (
      <div>
        {props.paletteOutput.map((output, index) => {
          return (
            <SinglePaletteOutputSaved
              output={output}
              id={index}
              handleGoodBadClick={props.handleGoodBadClick}
              showPopper={props.showPopper}
              process_disabled={props.process_disabled}
              updateTextTitleOutputUserEdit={props.updateTextTitleOutputUserEdit}
              deletePalette={props.deletePalette}
              contentEditable={false}
              />
          );
        })}
      </div>
    ) : (
      <div>
      </div>
    )
  );
}

export function getAutoTitle(login_jwt, handleTitleChange, current_title, palette) {
  // used whenever the user adds/removes a palette or changes title of one of them

  // define a list which runs on palette list and gets the 'title' field of each element
  const title_list = palette.map((item) => item.title);
  // if length of title_list is < 1, then return
  if (title_list.length < 1) {
    return;
  } else if (title_list.length === 1) {
    // if length of title_list is 1, then set the title to that
    handleTitleChange(title_list[0]);
    return;
  }

  var url = API_URL + '/getautotitle';

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login_jwt
    },
    body: JSON.stringify(
      {titles: title_list}
    )
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.title !== '' && data.title !== current_title) {
      handleTitleChange(data.title);
    }
  })
  .catch((error) => {
    console.error('Error in auto title fetch: ', error);
  });
}

export function trim_title(title) {
  if (title.length > MAX_TITLE_LENGTH) {
    return title.substring(0, MAX_TITLE_LENGTH) + '...';
  } else {
    return title;
  }
}


export function handleExportToNotion(session, database_id, notion_flag, login_jwt) {
  if (!notion_flag) {
    alert('Please enable Notion export in the Settings page. If not logged in, login first.');
    return;
  }

  var url = API_URL + '/exporttonotion';

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login_jwt
    },
    body: JSON.stringify(
      {
        database_id: database_id,
        session: session,
      }
    )
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
      alert(data.error);
    } else {

      Swal.fire({
        title: 'Success',
        text: 'Exported session to your Notion',
        icon: "success",
        showCancelButton: false,
        confirmButtonColor: '#F87D09',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Okay',
        allowOutsideClick: true,
        customClass: {
          container: 'z-19999' // currently not working, neither in CSS file.
        },
      })    

    }
  })
}

