/*global chrome*/
/* src/content.js */
/*
The basis for this React app was adopted from https://github.com/satendra02/react-chrome-extension
Developed further by Nitsan Bar
*/
import React from 'react';
import ReactDOM from 'react-dom';
import Frame, { FrameContextConsumer } from 'react-frame-component';
import App from "./modules/App";
import AppSaved from "./modules/AppSaved";
import AboutPage from "./modules/AboutPage";
import LoginPage from "./modules/LoginPage";
import './modules/App.css';
import { setLocalData, getSavedQueries, autologin, getAutoTitle, trim_title, handleExportToNotion } from './modules/Components';
import { config } from './modules/config';
import registerServiceWorker from './registerServiceWorker';

const bgColor = "rgb(255,255,255)";//"rgb(0,22,36)";

const NEW_DIVIDER_KEYWORD = config.NEW_DIVIDER_KEYWORD;
const DEFAULT_STLYE_LIST = config.DEFAULT_STLYE_LIST;
const DEFAULT_TEXT_OUTPUT = config.DEFAULT_TEXT_OUTPUT;
const DEFAULT_TITLE_OUTPUT = config.DEFAULT_TITLE_OUTPUT;
const DEFAULT_SAVED_LIST = config.DEFAULT_SAVED_LIST;
const DEFAULT_WIDTH = config.DEFAULT_WIDTH;
const DEFAULT_WIDGET_WIDTH = config.DEFAULT_WIDGET_WIDTH;
const DEFAULT_WIDGET_HEIGHT = config.DEFAULT_WIDGET_HEIGHT;
const MIN_TIME_SHOW_LOADING_ADVICE = config.MIN_TIME_SHOW_LOADING_ADVICE;

class Main extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        first_load: false,
        pageNum: -2,                                         // we define a pageNum state variable. Currently: 0 - main page, 1 - saves page, etc. see render() below
        titleOutput: document.title.toString(),              // DEFAULT_TITLE_OUTPUT,
        textOutput: DEFAULT_TEXT_OUTPUT,
        paletteOutput: [],
        loggedInFlag: false,
        loggedInUser: '',
        globalAppFlag: false,
        login_jwt: '',
        lastQueryID: "None",
        last_query_json: {},
        last_query_title: '',
        last_query_qalist: [],
        last_palette: [],
        saved_queries: [],
        qa_list: [],
        divider_list: [{id: -1, val: NEW_DIVIDER_KEYWORD}],
        style_list: DEFAULT_STLYE_LIST,
        default_style: DEFAULT_STLYE_LIST[0].val,
        loading_flag: false,
        resetOnNewPage: false,
        notionIntegration: false,
        notionDBid: '',
        context_menu_flag: '',
        context_menu_selection: '',
        showPopper: true,
        websites_auto_open: [],
        websites_auto_process: [],
        auto_open_current_website: false,
        auto_process_current_website: false,
        auto_process_current_website_style: 'generic',
        file_url: window.location.href.startsWith('file://') ? true : false,
        process_disabled: window.location.href.startsWith('file://') ? true : false,
        showLoadingMessage: false,
        alert_message: '',
        alert_open: false,
        remaining_queries: 'Unknown',
        remaining_questions: 'Unknown',
      };
      this.loadingTimer = null;

      this.try_auto_login = this.try_auto_login.bind(this);
      this.updateTextTitleOutputUserEdit = this.updateTextTitleOutputUserEdit.bind(this);
      this.handle_auto_process_current_website_style = this.handle_auto_process_current_website_style.bind(this);

      this.initialize_context_menu();
      this.check_websites_auto_open();
      
      this.initialize_JWT();
    }
    
    componentDidMount() {
      // Perform any set up or initialization that requires the component's
      // DOM nodes to be available.
      
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if( request.message === "clicked_browser_action") {
            if (this.state.first_load === false) {
              this.setState({first_load: true});
              if (this.state.login_jwt.length > 0) {
                this.change_to_main_page();
                this.try_auto_login();
              } else {
                console.log('gonna go 3');
                this.setState({pageNum: 3});
              }
              if (this.state.auto_process_current_website === true) {
                this.setDefaultStyle(this.state.auto_process_current_website_style);
                this.setState({context_menu_flag: this.state.auto_process_current_website_style, context_menu_selection: ''});        
              }
            }
          }
        }
      );
    }
    
    updateSavedQueries = () => {
      getSavedQueries(this.state.login_jwt, this.handleSavedQueriesChange);
    }
      
    reset_context_menu = () => {
      this.setState({context_menu_flag: '', context_menu_selection: ''});
    }

    initialize_context_menu = () => {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type !== undefined && this.state.first_load === false) {
          this.setState({first_load: true});
          this.try_auto_login();
        }
        const msg_type = message.type;
        const selection = message.text;

        if ((typeof msg_type !== "string") || (msg_type.length < 2)) {
          return;
        }
    
        const msg_cat = msg_type.slice(-1);
        const style = msg_type.slice(8, -1);
      
        if (app.style.display == "none") {
          this.change_to_main_page();
          toggle();
        }
        this.change_to_main_page();
  
        if (msg_cat == "1") {
          // handle_process_marked
          this.setDefaultStyle(style);
          this.setState({context_menu_flag: style, context_menu_selection: selection});
        } else if (msg_cat == "2") {
          // handle_process_page
          this.setDefaultStyle(style);
          this.setState({context_menu_flag: style, context_menu_selection: ''});
        } else if (msg_cat == "3") {
          // handle_add_note
          this.setState({context_menu_flag: '', context_menu_selection: selection});
        } else if (msg_cat == "4") {
          // handle a "file://" url
          this.setState({context_menu_flag: style, context_menu_selection: selection, file_url: true, process_disabled: false}, () => {
            console.log('Set contexts');
          });
        }
      });
      if (window.location.href.startsWith('file://')) {
        this.setState({file_url: true, process_disabled: true});
      }
    }

    change_to_main_page = () => { this.setState({pageNum: 0}); }
    
    addNote = (new_text) => {
      if (new_text == '') {
        this.setState({paletteOutput: [...this.state.paletteOutput, {'title': "Note", 'text': [{'key': '', 'value': "Edit..."}], 'queryid': '', 'style': '', 'type': 'note', 'url': window.location.href}]});
      } else {
        this.setState({paletteOutput: [...this.state.paletteOutput, {'title': "Note", 'text': [{'key': '', 'value': new_text}], 'queryid': '', 'style': '', 'type': 'note', 'url': window.location.href}]});
      }
    }
    
    initialize_JWT = () => {
      chrome.storage.local.get(['essence_global_flag', 'essence_login_jwt'])
      .then((result) => {
        if (result['essence_global_flag'] === true) {
          this.setState({
            globalAppFlag: true, 
            login_jwt: result['essence_login_jwt'],
          });
        }
        if (!(typeof result['essence_login_jwt'] === 'string' && result['essence_login_jwt'].length > 0)) {
          console.log('not able to log in');
          this.changeToPage(3);
        }
      })
    }

    check_for_JWT = async () => {
      const result = await chrome.storage.local.get(['essence_login_jwt']);
      if (!(typeof result['essence_login_jwt'] === 'string' && result['essence_login_jwt'].length > 0)) {
        return false;
      } else {
        return true;
      }
    }

    check_websites_auto_open = async () => {
      let domain;
      if (window.location.href.startsWith('file://')) {
        domain = 'file';
      } else {
        domain = new URL(window.location.href).hostname;
      }
    
      // get essence_websites_auto_open from local storage
      const result1 = await chrome.storage.local.get(['essence_websites_auto_open']);
      if (result1['essence_websites_auto_open'] !== undefined) {
        await this.setState({websites_auto_open: result1['essence_websites_auto_open']});
        if (this.state.websites_auto_open.length > 0 && this.state.websites_auto_open.includes(domain)) {
          await this.setState({auto_open_current_website: true});
        }
      }
      // get essence_websites_auto_process from local storage
      const result2 = await chrome.storage.local.get(['essence_websites_auto_process']);
      if (result2['essence_websites_auto_process'] !== undefined) {
        await this.setState({websites_auto_process: result2['essence_websites_auto_process']});
        if (this.state.websites_auto_process !== undefined && this.state.websites_auto_process.length > 0) {
          const website = this.state.websites_auto_process.find(website => website.domain_name === domain);
          if (website) {
            await this.setState({auto_process_current_website: true, auto_process_current_website_style: website.style});
            await this.setDefaultStyle(website.style);
            await this.setState({context_menu_flag: website.style, context_menu_selection: ''});        
          }
        }
      }

      if (this.state.auto_open_current_website === true) {
        this.setState({first_load: true});
        this.try_auto_login();
        if (this.check_for_JWT()) { this.change_to_main_page(); }
        toggle();
      }
    }
        
    check_websites_auto_open2 = () => {
      let domain;
      if (window.location.href.startsWith('file://')) {
        domain = 'file';
      } else {
        domain = new URL(window.location.href).hostname;
      }
      chrome.storage.local.get(['essence_websites_auto_open'])
      .then((result) => {
        if (result['essence_websites_auto_open'] !== undefined) {
          this.setState({websites_auto_open: result['essence_websites_auto_open']}, () => {
            if (this.state.websites_auto_open.length > 0) {
              if (this.state.websites_auto_open.includes(domain)) {
                this.setState({auto_open_current_website: true});
              }
            }
          });
        }
      })
      .then(() => {
        chrome.storage.local.get(['essence_websites_auto_process'])
        .then((result) => {
          // some logging
          console.log('auto open: ' + this.state.websites_auto_open);
          console.log('auto process: ');
          console.log(result['essence_websites_auto_process']);
          if (result['essence_websites_auto_process'] !== undefined) {
            this.setState({websites_auto_process: result['essence_websites_auto_process']}, () => {
              if (this.state.websites_auto_process !== undefined && this.state.websites_auto_process.length > 0) {
                const website = this.state.websites_auto_process.find(website => website.domain_name === domain);
                if (website) {
                  console.log('setting yooo');
                  console.log(website);
                  this.setState({auto_process_current_website: true, auto_process_current_website_style: website.style});
                  this.setDefaultStyle(website.style);
                  this.setState({context_menu_flag: website.style, context_menu_selection: ''});        
                }
              }    
            });
          }
        });
      })
      .then(() => {
        if (this.state.auto_open_current_website === true) {
          toggle();
          this.setState({first_load: true});
          this.try_auto_login();
          console.log('final then phew');
        }
      });
    }

    // this function is called when the component is mounted, and it tries to login using the jwt stored in chrome.storage.local
    try_auto_login() {
      chrome.storage.local.get(['essence_global_flag', 'essence_login_jwt', 'essence_last_palette', 'essence_last_query_json', 'essence_last_query_title', 'essence_last_query_qalist', 'essence_saved_queries', 'essence_last_style', 'essence_show_popper', 'essence_reset_on_new_page', 'essence_notion_integration', 'essence_notion_db_id'])
      .then((result) => {
        if (result['essence_global_flag'] === true) {
          if (result['essence_reset_on_new_page'] === undefined || result['essence_reset_on_new_page'] == false) {
            this.setState({
              last_query_json: result['essence_last_query_json'], // ListToDict(result['essence_last_query_json']), 
              last_title_output: result['essence_last_query_title'],
              last_qa_list: result['essence_last_query_qalist'],
              last_palette: result['essence_last_palette'],
              saved_queries: result['essence_saved_queries']});
            }
        }
        if (result['essence_reset_on_new_page'] === undefined || result['essence_reset_on_new_page'] == false) {
          if (result['essence_last_query_json'] !== undefined) {
            this.setState({textOutput: result['essence_last_query_json']});
          }
          if (result['essence_last_palette'] !== undefined) {
            this.setState({paletteOutput: result['essence_last_palette']});
          }
          if (result['essence_last_query_title'] !== undefined && result['essence_last_palette'] !== undefined && result['essence_last_palette'].length > 0) {
            this.setState({titleOutput: result['essence_last_query_title']});
          }
          if (result['essence_last_query_qalist'] !== undefined) {
            this.setState({qa_list: result['essence_last_query_qalist']});
          }
        }
        if (result['essence_last_style'] !== undefined) {
          this.setState({default_style: result['essence_last_style']});
        }
        if (result['essence_show_popper'] !== undefined) {
          this.setState({showPopper: result['essence_show_popper']});
        }
        if (result['essence_reset_on_new_page'] !== undefined) {
          this.setState({resetOnNewPage: result['essence_reset_on_new_page']});
        }
        if (result['essence_notion_integration'] !== undefined) {
          this.setState({notionIntegration: result['essence_notion_integration']});
        }
        if (result['essence_notion_db_id'] !== undefined) {
          this.setState({notionDBid: result['essence_notion_db_id']});
        }
      }).then(() => {
        // console.log('updated state is ', this.state);
        if (this.state.login_jwt.length > 0) {
          autologin(this.state.login_jwt, this.handleLogin);
        }
      })
    }

    handleTitleChange = (new_title) => {
      this.setState({titleOutput: new_title});
    }

    // save last_query_json to chrome.storage.local every time the outputs are updated
    componentDidUpdate(prevProps, prevState) {
      if (this.state.titleOutput !== prevState.titleOutput) {
        setLocalData("essence_last_query_title", this.state.titleOutput);
      }
      if (this.state.textOutput !== prevState.textOutput) {
        setLocalData("essence_last_query_json", this.state.textOutput);
      }
      if (this.state.paletteOutput !== prevState.paletteOutput) {
        setLocalData("essence_last_palette", this.state.paletteOutput);
        // if length of prev and current differ, trigger getAutoTitle
        if (this.state.paletteOutput.length !== prevState.paletteOutput.length && prevState.paletteOutput.length > 0) {
          if (this.state.paletteOutput.length > prevState.paletteOutput.length && this.state.paletteOutput.length > 0 && this.state.paletteOutput[this.state.paletteOutput.length - 1].title == 'Note') {
            return;
          }
          getAutoTitle(this.state.login_jwt, this.handleTitleChange, this.state.titleOutput, this.state.paletteOutput);
        } else {
          if (this.state.paletteOutput.length === 1) {
            if (document.title.toString() !== undefined && document.title.length.toString() > 0) {
              this.setState({titleOutput: document.title.toString()});
            } else {
              this.setState({titleOutput: this.state.paletteOutput[0].title});
            }
          }
        }
      }
      if (this.state.qa_list !== prevState.qa_list) {
        setLocalData("essence_last_query_qalist", this.state.qa_list);
      }
    }

    deletePalette = (index) => {
      let new_paletteOutput = [...this.state.paletteOutput];
      new_paletteOutput.splice(index, 1);
      this.setState({paletteOutput: new_paletteOutput});
    }

    updateTextTitleOutputUserEdit(palette_index, new_title, new_text, index, key_or_value, row, col) {
      if (palette_index == -1) {
        this.setState({titleOutput: (new_title == null) ? this.state.titleOutput : new_title});
        return;
      }
      // update the textOutput state variable at index and key_or_val; at row, col if applicable
      if (this.state.paletteOutput.length == 0) {
        return;
      }
      let new_paletteOutput = [...this.state.paletteOutput];

      if (new_title !== null) {
        new_paletteOutput[palette_index]['title'] = new_title;
        this.setState({paletteOutput: new_paletteOutput});
      }
      if (new_text === null) {
        return;
      }

      if (key_or_value === 'key') {
        new_paletteOutput[palette_index]['text'][index]['key'] = new_text;
        // if the new_text is empty, delete the entry index altogether
        if (new_text == '') {
          new_paletteOutput[palette_index]['text'].splice(index, 1);
        }
      }
      else if (key_or_value === 'value') {
        if (typeof new_paletteOutput[palette_index]['text'][index]['value'] === 'string') {
          new_paletteOutput[palette_index]['text'][index]['value'] = new_text;
        }
        else {
          new_paletteOutput[palette_index]['text'][index]['value'][row][col] = new_text;
        }
      }
      this.setState({paletteOutput: new_paletteOutput});

    }

    setDefaultStyle = (new_style) => {
      this.setState({default_style: new_style});
      setLocalData("essence_last_style", new_style);
    }

    setLoadingFlag = (new_state) => {
      this.setState({loading_flag: new_state});
      if (new_state) {
        this.loadingTimer = setTimeout(() => {
          this.setState({ showLoadingMessage: true });
        }, MIN_TIME_SHOW_LOADING_ADVICE); // set the timer to ~15 seconds
      } else {
        clearTimeout(this.loadingTimer);
        this.setState({ showLoadingMessage: false });
      }
    }

    addQAresult = (field1, field2, field3) => {
      // create a new member with the given field1, field2, and id values
      const newMember = [field1, field2, Date.now(), field3];  // use Date.now() as a unique id
      // update the component's state by appending the new member to the qa_list array
      this.setState(prevState => ({
        qa_list: [...prevState.qa_list, newMember]
      }));
    }
        
    deleteQAresult = (id) => {
      // update the component's state by creating a new qa_list array that does not include the member with the given id value
      this.setState(prevState => ({
        qa_list: prevState.qa_list.filter(member => member[2] !== id)
      }));
    }
        
    handleSavedQueriesChange = (new_saved_queries) => {
      setLocalData("essence_saved_queries", new_saved_queries);
      // update divider_list to be the subject key of each element of the array new_saved_queries using map
      this.setState({saved_queries: new_saved_queries, divider_list: [...new_saved_queries.map((item, index) => ({'id': index, 'val': item['subject']})), ...[{id: -1, val: NEW_DIVIDER_KEYWORD}]] });
    }

    handleLogin = (newLoginState, newLoggedInUser, new_jwt_token, remaining_queries, remaining_questions) => {
      this.setState({loggedInFlag: newLoginState, loggedInUser: newLoggedInUser});

      // if loggedInFlag is set false, we have a log-out, therefore we should clear the saved stuff
      if (newLoginState == false) {
        this.setState({essence_global_flag: false, login_jwt: {}, last_query_json: {}, last_palette: [], saved_queries: {}, remaining_queries: '', remaining_questions: ''});
        this.deleteStorage(['essence_global_flag', 'essence_login_jwt', 'essence_last_query_json', 'essence_last_query_title', 'essence_last_palette', 'essence_last_query_qalist', 'essence_saved_queries', 'essence_last_style']);
        this.resetState();
      }
      else { 
        // we have a LOGIN
        this.setState({remaining_queries: remaining_queries, remaining_questions: remaining_questions});
        if (new_jwt_token.length > 0) { // meaning the login was fresh, new JWT token was received
          this.setState({essence_global_flag: true, login_jwt: new_jwt_token});
          
          setLocalData("essence_login_jwt", new_jwt_token);
          setLocalData("essence_global_flag", true);

          getSavedQueries(new_jwt_token, this.handleSavedQueriesChange);
        }
        else {
          getSavedQueries(this.state.login_jwt, this.handleSavedQueriesChange);
        }
      }
    }

    deleteStorage = (fields) => {
      // delete the given fields from local storage
      fields.forEach((field) => {
        chrome.storage.local.remove(field, function() {
          console.log('deleted ', field);
        });
      });
    }

    resetState = () => {
      this.setState({
        // pageNum: 0,
        textOutput: DEFAULT_TEXT_OUTPUT,
        titleOutput: document.title.toString(),//DEFAULT_TITLE_OUTPUT,
        paletteOutput: [],
        loggedInFlag: false,
        loggedInUser: '',
        globalAppFlag: false,
        login_jwt: '',
        lastQueryID: "None",
        last_query_json: {},
        last_query_title: '',
        last_query_qalist: [],
        saved_queries: {},
        qa_list: [],
        divider_list: [{id: -1, val: NEW_DIVIDER_KEYWORD}],
        style_list: DEFAULT_STLYE_LIST,
        default_style: DEFAULT_STLYE_LIST[0].val,
        loading_flag: false,
        notionIntegration: false,
        notionDBid: '',
      });
    }

    handleTextOutputChange = (data, title, query_id, new_def_style, marked_text, url) => {
      // add to paletteOutput
      if (marked_text === '') {
        this.setState({paletteOutput: [...this.state.paletteOutput, {'text': (typeof data == 'string') ? [{'key': ' ', 'value': data}] : data, 'title': title ?? '', 'queryid': query_id ?? '', 'style': new_def_style, 'type': 'process', 'url': url ?? ''}]})
      } else {
        this.setState({paletteOutput: [...this.state.paletteOutput, {'text': (typeof data == 'string') ? [{'key': ' ', 'value': data}] : data, 'title': title ?? '', 'queryid': query_id ?? '', 'style': new_def_style, 'type': 'process_marked', 'url': url ?? ''}]})
      }
    }

    changeToPage = (newPageNum) => {
      this.setState({pageNum: newPageNum});
    }
    
    resetOutputNotQA = () => {
      this.setState({textOutput: [], titleOutput: document.title.toString(), paletteOutput: [], lastQueryID: "None"});
    }

    resetOutput = () => {
      this.setState({textOutput: [], titleOutput: document.title.toString(), paletteOutput: [], lastQueryID: "None", qa_list: []});
    }

    getSelectedTextPDF = () => {
      console.log('this is never executed.');
      return getPdfSelectedText().then(selectedText => {
        return selectedText;
      });
    }

    toggleShowPopper = (value) => {
      this.setState({showPopper: value});
      setLocalData("essence_show_popper", value);
    }

    toggleResetOnNewPage = (value) => {
      this.setState({resetOnNewPage: value});
      setLocalData("essence_reset_on_new_page", value);
    }

    toggleNotionIntegration = (value) => {
      this.setState({notionIntegration: value});
      setLocalData("essence_notion_integration", value);
      if (!value) {
        this.setNotionDatabaseID('');
      }
    }

    setNotionDatabaseID = (value) => {
      this.setState({notionDBid: value});
      setLocalData("essence_notion_db_id", value);
    }

    exportToNotion = () => {
      const session = {'title': this.state.titleOutput, 'url': window.location.href, 'palettes': this.state.paletteOutput, 'qa_list': this.state.qa_list};
      handleExportToNotion(session, this.state.notionDBid, this.state.notionIntegration, this.state.login_jwt);
    }

    toggle_auto_open_website = (new_val) => {
      let domain;
      if (window.location.href.startsWith('file://')) {
        domain = 'file';
      } else {
        domain = new URL(window.location.href).hostname;
      }
      if (this.state.auto_open_current_website) {
        this.setState({auto_open_current_website: false});
        let new_website_list = this.state.websites_auto_open.filter((item) => item !== domain);
        this.setState({websites_auto_open: new_website_list});
        setLocalData("essence_websites_auto_open", new_website_list);
      } else {
        this.setState({auto_open_current_website: true});
        let new_website_list = this.state.websites_auto_open;
        new_website_list.push(domain);
        setLocalData("essence_websites_auto_open", new_website_list);
      }
    }

    handleEditCurrentList = (list) => {
      this.setState({titleOutput: list.title, qa_list: list.qa_list, paletteOutput: list.long_summary}); //lastQueryID: list.query_id, last_query_title: list.title, last_query_qalist: list.qa_list, last_query_json: list.query_json});
      this.changeToPage(0);
    }

    alert_handle_close = () => {
      this.setState({alert_open: false});
      this.setState({alert_message: ''});
    }

    alert_handle_new = (message) => {
      this.setState({alert_open: true, alert_message: message});
      // after 3 seconds, close the alert
      setTimeout(() => {
        if (this.state.alert_message == message) {
          this.setState({alert_open: false});
          this.setState({alert_message: ''});
        }
      }, 4000);
    }

    new_user = () => {
      if (this.state.remaining_queries == config.DEFAULT_REMAINING_QUERIES && this.state.remaining_questions == config.DEFAULT_REMAINING_QUESTIONS && this.state.paletteOutput.length == 0 && this.state.qa_list.length == 0) {
        return true;
      }
      return false;
    }

    toggle_auto_process_website = (new_val) => {
      let domain;
      if (window.location.href.startsWith('file://')) {
        domain = 'file';
      } else {
        domain = new URL(window.location.href).hostname;
      }
      if (domain != 'file') {
        if (this.state.auto_process_current_website) {
          this.setState({auto_process_current_website: false});
          let new_website_list = this.state.websites_auto_process.filter((item) => item.domain_name !== domain);
          setLocalData("essence_websites_auto_process", new_website_list);
        } else {
          this.setState({auto_process_current_website: true});
          let new_website_list = this.state.websites_auto_process.filter((item) => item.domain_name !== domain);
          new_website_list.push({domain_name: domain, style: this.state.auto_process_current_website_style});
          setLocalData("essence_websites_auto_process", new_website_list);
        }
      }
    }
    
    handle_auto_process_current_website_style = (new_style) => {
      this.setState({auto_process_current_website_style: new_style});
      setLocalData("auto_process_current_website_style", new_style);
      if (this.state.auto_process_current_website) {
        let domain;
        if (window.location.href.startsWith('file://')) {
          domain = 'file';
        } else {
          domain = new URL(window.location.href).hostname;
        }
        let new_website_list = this.state.websites_auto_process.filter((item) => item.domain_name !== domain);
        new_website_list.push({domain_name: domain, style: new_style});
        setLocalData("essence_websites_auto_process", new_website_list);
      }
    }

    mainpage() {
      return (
        (
          <Frame style={{width: "100%", height: "100%", backgroundColor: bgColor}} head={[<link key="content-css" type="text/css" rel="stylesheet" href={chrome.runtime.getURL("/static/css/content.css")} ></link>,<link key="google-fonts" href="https://fonts.googleapis.com/css?family=Nunito&display=swap" rel="stylesheet" ></link>]}> 
             <FrameContextConsumer>
              {
                ({document, window}) => {
                  return <App 
                  document={document}
                  window={window}
                  isExt={true}
                  handleToggle={this.changeToPage}
                  textOutput={this.state.textOutput}
                  titleOutput={this.state.titleOutput}
                  paletteOutput={this.state.paletteOutput}
                  lastQueryID={this.state.lastQueryID}
                  handleTextOutputChange={this.handleTextOutputChange}
                  qa_list={this.state.qa_list}
                  handleAddQAfield={this.addQAresult}
                  handleDeleteQAfield={this.deleteQAresult}
                  divider_list={this.state.divider_list}
                  login_jwt={this.state.login_jwt}
                  loggedIn={this.state.loggedInFlag}
                  updateSavedQueries={this.updateSavedQueries}
                  style_list={this.state.style_list}
                  default_style={this.state.default_style}
                  loading_flag={this.state.loading_flag}
                  setLoadingFlag={this.setLoadingFlag}
                  updateTextTitleOutputUserEdit={this.updateTextTitleOutputUserEdit}
                  deletePalette={this.deletePalette}
                  addNote={this.addNote}
                  setDefaultStyle={this.setDefaultStyle}
                  context_menu_flag={this.state.context_menu_flag}
                  context_menu_selection={this.state.context_menu_selection}
                  reset_context_menu={this.reset_context_menu}
                  resetOutput={this.resetOutput}
                  getSelectedTextPDF={this.getSelectedTextPDF}
                  showPopper={this.state.showPopper}
                  auto_open_current_website={this.state.auto_open_current_website}
                  toggle_auto_open_website={this.toggle_auto_open_website}
                  auto_process_current_website={this.state.auto_process_current_website}
                  toggle_auto_process_website={this.toggle_auto_process_website}
                  auto_process_current_website_style={this.state.auto_process_current_website_style}
                  handle_auto_process_current_website_style={this.handle_auto_process_current_website_style}
                  file_url={this.state.file_url}
                  process_disabled={this.state.process_disabled}
                  exportToNotion={this.exportToNotion}
                  showLoadingMessage={this.state.showLoadingMessage}
                  alert_message={this.state.alert_message}
                  alert_handle_new={this.alert_handle_new}
                  alert_handle_close={this.alert_handle_new}
                  new_user={this.new_user} />
                }
              }
              </FrameContextConsumer>
          </Frame>
        )
      )
    }

    savepage() {
      return (
        (
          <Frame style={{width: "100%", height: "100%", backgroundColor: bgColor}} head={[<link type="text/css" rel="stylesheet" href={chrome.runtime.getURL("/static/css/content.css")} ></link>]}> 
            <FrameContextConsumer>
            {
               ({document, window}) => {
                 return <AppSaved 
                 document={document}
                 window={window}
                 isExt={true} 
                 handleToggle={this.changeToPage} 
                 saved_queries={this.state.saved_queries} 
                 handleChangeSavedQueries={this.handleSavedQueriesChange}
                 updateSavedQueries={this.updateSavedQueries}
                 login_jwt={this.state.login_jwt}
                 loggedIn={this.state.loggedInFlag}
                 handleEditCurrentList={this.handleEditCurrentList}
                 showPopper={this.state.showPopper} /> 
               }
             }
             </FrameContextConsumer>
          </Frame>
          )
      )
    }

    aboutpage() {
      return (
        (
          <Frame style={{width: "100%", height: "100%", backgroundColor: bgColor}} head={[<link type="text/css" rel="stylesheet" href={chrome.runtime.getURL("/static/css/content.css")} ></link>]}> 
            <FrameContextConsumer>
            {
               ({document, window}) => {
                 return <AboutPage document={document} window={window} isExt={true} handleToggle={this.changeToPage} loggedIn={this.state.loggedInFlag}/> 
               }
             }
             </FrameContextConsumer>
          </Frame>
          )
      )
    }

    loginpage() {
      return (
        (
          <Frame style={{width: "100%", height: "100%", backgroundColor: bgColor}} head={[<link type="text/css" rel="stylesheet" href={chrome.runtime.getURL("/static/css/content.css")} ></link>]}> 
            <FrameContextConsumer>
            {
               ({document, window}) => {
                 return <LoginPage 
                 document={document} 
                 window={window} 
                 isExt={true} 
                 handleToggle={this.changeToPage} 
                 handleLogin={this.handleLogin} 
                 loggedInFlag={this.state.loggedInFlag} 
                 loggedInUser={this.state.loggedInUser} 
                 login_jwt={this.state.login_jwt}
                 showPopper={this.state.showPopper}
                 toggleShowPopper={this.toggleShowPopper}
                 auto_open_current_website={this.state.auto_open_current_website}
                 toggle_auto_open_website={this.toggle_auto_open_website}
                 resetOnNewPage={this.state.resetOnNewPage}
                 toggleResetOnNewPage={this.toggleResetOnNewPage}
                 notionIntegration={this.state.notionIntegration}
                 toggleNotionIntegration={this.toggleNotionIntegration}
                 notionDBid={this.state.notionDBid}
                 setNotionDatabaseID={this.setNotionDatabaseID}
                 alert_message={this.state.alert_message}
                 alert_handle_new={this.alert_handle_new}
                 alert_handle_close={this.alert_handle_new}
                 remaining_queries={this.state.remaining_queries}
                 remaining_questions={this.state.remaining_questions} /> 
               }
             }
             </FrameContextConsumer>
          </Frame>
          )
      )
    }

    floatpage() {
      return (
        (
          <Frame style={{width: "20%", height: "20%", backgroundColor: bgColor}} head={[<link type="text/css" rel="stylesheet" href={chrome.runtime.getURL("/static/css/content.css")} ></link>]}> 
            <FrameContextConsumer>
            {
               ({document, window}) => {
                 return <LoginPage 
                 document={document} 
                 window={window} 
                 isExt={true} 
                 handleToggle={this.changeToPage} 
                 handleLogin={this.handleLogin} 
                 loggedInFlag={this.state.loggedInFlag} 
                 loggedInUser={this.state.loggedInUser} 
                 login_jwt={this.state.login_jwt} /> 
               }
             }
             </FrameContextConsumer>
          </Frame>
          )
      )
    }

    render() {
        return (
          //this.state.initial_load != true ? <div>Loading...</div>
          //:
          this.state.pageNum == -1 ? this.floatpage() // currently not used
          :
          this.state.pageNum == 0 ? this.mainpage()  // this.mainpage() 
          : 
          this.state.pageNum == 1 ? this.savepage() 
          : 
          this.state.pageNum == 2 ? this.aboutpage()
          :
          this.state.pageNum == 3 ? this.loginpage()
          :
          <></>
        )
    }
}

// Defining pdf(embed) and body(html) elements allow us later to resize them upon toggling the extension
const pdfElement = document.querySelector('embed');
const bodyElement = document.querySelector('html');

const app = document.createElement('div');
const frame = document.createElement('iframe');

const extensionWidth = DEFAULT_WIDTH;
app.style.width = `${extensionWidth}px`;
app.id = "my-extension-root";

document.body.appendChild(app);
ReactDOM.render(<Main />, app);

app.style.display = "none"; // by default, the app is hidden

/* ****************** *************** ****************** */
/* ****************** LOCAL FUCNTIONS ****************** */
/* ****************** *************** ****************** */

function getPdfSelectedText() {
  return new Promise(resolve => {
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
  });
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === 'getPdfSelection' || msg.message === 'getPdfSelection') {
    getPdfSelectedText().then(sendResponse);
    return true;
  }
});

chrome.runtime.onMessage.addListener(
   function(request, sender, sendResponse) {
      if( request.message === "clicked_browser_action") {
        toggle();
      }
   }
);

function toggle(){
  if(app.style.display === "none"){
    app.style.display = "block";
    //app.style.backgroundColor = "rgb(0,22,36) !important";
    bodyElement.style.width = `${window.innerWidth - extensionWidth}px`;
    bodyElement.style.direction = 'ltr';
    try{
      pdfElement.style.width = `${window.innerWidth - extensionWidth}px`;
    } catch (e) {
      return;
    }
  } else{
    app.style.display = "none";
    bodyElement.style.width = `${window.innerWidth}px`;
    bodyElement.style.direction = 'ltr';
    try {
      pdfElement.style.width = `${window.innerWidth}px`;
    } catch (e) {
      return;
    }
  }
}
