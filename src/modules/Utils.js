/*global chrome*/
import React, { Component, useState, useEffect } from 'react';

function initialize_context_menu(change_to_main_page, handle_process_page, handle_process_marked, handle_add_note, toggle, app) {
    chrome.runtime.onMessage.addListener((message) => {
      const msg_type = message.type;
      const selection = message.text;
      console.log('selection: ' + selection + '. type: ' + msg_type);
      
      if (typeof msg_type !== "string" || msg_type.length < 2) {
        console.log('early returning');
        return;
      }
  
      const msg_cat = msg_type.slice(-1);
      const style = msg_type.slice(0, -1);
    
      if (app.style.display == "none") {
        toggle();
      }
      change_to_main_page();

      if (msg_cat == "1") {
        handle_process_marked(style, selection);
      } else if (msg_cat == "2") {
        handle_process_page(style);
      } else if (msg_cat == "3") {
        handle_add_note(selection);
      }
    });
}
  
// transofrm a {key: value} JSON to a list of [key, value] lists
export function DictToList(dict) {
    var list = []
    for (var key in dict) {
        list.push([key, dict[key]])
    }
    return list
    }

// transofrm a list of [key, value] lists to a {key: value} JSON
export function ListToDict(list) {
    var dict = {}
    // if list is undefined, return an empty dict
    if (list === undefined) {
        return dict
    }
    for (var i = 0; i < list.length; i++) {
        dict[list[i][0]] = list[i][1]
    }
    return dict
}