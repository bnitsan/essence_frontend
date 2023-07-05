/*global chrome*/
import React, { Component, useState, useEffect } from 'react';
import './App.css';
import { Disclaimer, HeaderCustom, PrintSavedQAList, delete_divider, delete_session, PaletteOutputSaved, ButtonWithPopper } from "./Components";
import { config } from './config';
import Swal from 'sweetalert2';

const API_URL = config.API_URL;
const DEFAULT_SAVED_LIST = config.DEFAULT_SAVED_LIST;

function InnerTableJSON(props) {
  // table for the inner list
  return (
    <div>
      <table>
        <tr>
          {props.innerlist[0].map((col, col_index) => (
            <th>{col}</th>
          ))}
        </tr>
          {props.innerlist.slice(1).map((list, row_index) => (
            <tr>
              {list.map((col, col_index) => (
                <td>{col}</td>
              ))}
            </tr>
          ))}
      </table>
    </div>
  );
}

function OutputTableJSONfunc(props) {
  return (
    (typeof lists === 'string') ? 
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
        return (
          (typeof list.value === 'string') ? ( 
          <tr>
            <th >{list.key}</th>
            <td >{list.value}</td> 
          </tr>
          )
          :
          (
          <tr>
            <th >{list.key}</th>
            <td ><InnerTableJSON innerlist={list.value} /></td>         
          </tr>
          )
        )})}
    </table>
    )
  );
}

function InnerListPrint(props) {
  const [isClicked, setIsClicked] = useState(Array(props.list_content.length).fill(false));

  const handleSpanClick=(index, text, e)=>{ 
    let ids = [...isClicked];     // create the copy of state array
    ids[index] = !ids[index];     // new value
    setIsClicked(ids);       //update the value
  }
  
  const handleDeleteClick=(index, e)=>{ 
    Swal.fire({
      title: 'Are you sure you want to delete this session?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#004A55',
      cancelButtonColor: '#F87D09',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        container: 'z-19999' // currently not working, neither in CSS file.
      },
    }).then((result) => {
      if (result.value) {
        Swal.fire({
          title: 'Deleted!',
          text: 'Session has been deleted.',
          icon: 'success',
          confirmButtonColor: '#004A55',
        });
        delete_session(props.login_jwt, props.subject, index, props.updateSavedQueries);
      }
    })

  }

  return (
    (typeof props.list_content === 'string') ? 
    <p>{props.list_content}</p> 
    : 
    <div>
      <ul class="no-bullets">
        {props.list_content.map((keypoint, index) => (
          <li key={keypoint.id}> <span onClick={(event) => handleSpanClick(index, keypoint.long_summary, event)}></span>
          <ButtonWithPopper disabledFlag={false} onClick={(event) => handleSpanClick(index, keypoint.long_summary, event)} className={"SavedSessionButton"} buttonText={""} iconName={"ExpandSaved"} iconClass={"SavedSessionButtonSpec"} popperText={"Expand/collapse session."} showPopper={props.showPopper}/>         
          <ButtonWithPopper disabledFlag={false} onClick={(event) => handleDeleteClick(keypoint.id, event)} className={"SavedSessionButton"} buttonText={""} iconName={"TrashSaved"} iconClass={"SavedSessionButtonSpec"} popperText={"Delete session."} showPopper={props.showPopper}/>         
          <ButtonWithPopper disabledFlag={false} onClick={() => props.handleEditCurrentList(keypoint)} className={'SavedSessionButton'} buttonText={""} iconName={"EditSaved"} iconClass={"SavedSessionButtonSpec"} popperText={"Open back in the main page and continue editing."} showPopper={props.showPopper}/>
          &nbsp;&nbsp;<span className='Keypoint-style' >{keypoint.title}</span>
          <div>{isClicked[index] 
          ? 
          <div>
            <PaletteOutputSaved paletteOutput={keypoint.long_summary} />
            <PrintSavedQAList savedQAList={keypoint.qa_list} /></div>
          :
          ''}</div></li>
        ))}
      </ul>
    </div>
  );
}

function SavedList(props) {
  
  const handleExportDivider = async (subject) => {
    // export the list to a file
    fetch(API_URL + '/exportdivider', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //"Access-Control-Allow-Origin": "*",
        "Authorization": "Bearer " + props.login_jwt,
      },
      body: JSON.stringify({
        divider_subject: subject,
      }),
    })
    .then(response => response.blob())
    .then(blob => {
      // chatgpt magic :-)
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = subject + '.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.log('Error in exporting divider: ', error);
      alert('Error in exporting divider: ' + error)
    });
  }

  const handleDeleteDivider = async (subject) => {
    Swal.fire({
      title: 'Are you sure you want to delete ' + subject + ' divider?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#004A55',
      cancelButtonColor: '#F87D09',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        container: 'z-19999' // currently not working, neither in CSS file.
      },
    }).then((result) => {
      if (result.value) {
        Swal.fire({
          title: 'Deleted!',
          text: 'Divider ' + subject + ' has been deleted.',
          icon: 'success',
          confirmButtonColor: '#004A55',
        });
        delete_divider(props.login_jwt, subject, props.updateSavedQueries);
      }
    })
  }

  return (
    <div>
      <ul class="no-bullets">
        {props.savedList.map(subject_list => (
          <li className="ListSubjects-style" key={subject_list.key}>
          <ButtonWithPopper disabledFlag={false} onClick={(event) => handleExportDivider(subject_list.subject)} className={"SavedDividerButton"} buttonText={""} iconName={"PrintSaved"} iconClass={"SavedDividerButtonSpec"} popperText={"Export the entire divider to a CSV file."} showPopper={props.showPopper}/>
          <ButtonWithPopper disabledFlag={false} onClick={(event) => handleDeleteDivider(subject_list.subject)} className={"SavedDividerButton"} buttonText={""} iconName={"TrashSaved"} iconClass={"SavedDividerButtonSpec"} popperText={"Delete the entire divider."} showPopper={props.showPopper}/>         
          &nbsp;{subject_list.subject} 
          <div className='ListContents-style'>
            <InnerListPrint list_content={subject_list.content} login_jwt={props.login_jwt} subject={subject_list.subject} updateSavedQueries={props.updateSavedQueries} handleEditCurrentList={props.handleEditCurrentList} showPopper={props.showPopper}></InnerListPrint>
          </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

class AppSaved extends Component {
  constructor(props) {
    super(props);

    this.toggle = props.handleToggle;
    this.handleChangeSavedQueries = props.handleChangeSavedQueries;
    props.updateSavedQueries();
  }

  render() {
    return (
      <div className="App-BG">
        <div className="App">
          <HeaderCustom className="App-header" tagline="Collect information." isExt={this.props.isExt} toggle_page={this.toggle} loggedIn={this.props.loggedIn}/>
          <div className="App-BG">
            <ButtonWithPopper disabledFlag={false} onClick={() => this.toggle(0)} className={"MainButton"} buttonText={""} iconName={"ComputerProcessIcon"} iconClass={"MainIconButtonSpec"} popperText={"Back to the main page."} showPopper={this.props.showPopper}/>
            
            <SavedList savedList={(this.props.saved_queries.length > 0) ? this.props.saved_queries : DEFAULT_SAVED_LIST} login_jwt={this.props.login_jwt} updateSavedQueries={this.props.updateSavedQueries} handleEditCurrentList={this.props.handleEditCurrentList} showPopper={this.props.showPopper} />

            <Disclaimer />
          </div>
        </div>
      </div>
    );
  }

}

export default AppSaved;
