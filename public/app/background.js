/*
chrome.extension.isAllowedFileSchemeAccess(function(isAllowed) {
  if (isAllowed) {
    console.log('1');
  } else {
    chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "panel",
      width: 300,
      height: 100
    });
  }
});
*/

// this is the a general listener for the browser action. In some cases where the extension is inactive it will yield a popup, otherwise it will send a message to the content script
/*chrome.action.onClicked.addListener(function (tab) {
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('https://chrome.google.com/')) {
    chrome.browserAction.setPopup({popup: "popup.html"});
    chrome.tabs.create({url: "popup.html"});
  } else {
    chrome.browserAction.setPopup({popup: null});
    chrome.tabs.sendMessage(tab.id, {
      message: "clicked_browser_action",
    });
  }
});*/

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('https://chrome.google.com/')) {
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "panel",
        width: 250,
        height: 100,
        top: 0,
        left: 700
      });    
    } else {
      chrome.tabs.sendMessage(activeTab.id, {
        message: "clicked_browser_action",
      });
      }
  });
});


/*chrome.windows.create({
  url: chrome.runtime.getURL("popup.html"),
  type: "panel",
  width: 250,
  height: 100
});*/

/*
################################################################
create a context menu item with icon and title
################################################################
*/
// check current url

//////////////////////////// MARKED text ////////////////////////////

chrome.contextMenus.create({id: "essence_parent_marked",    title: "Process marked text... %s", contexts: ["selection"]});
chrome.contextMenus.create({id: "essence_generic1",         title: "Generic style",           parentId: "essence_parent_marked", contexts: ["selection"]});
chrome.contextMenus.create({id: "essence_bulletsgeneric1",  title: "Generic Bullets style",   parentId: "essence_parent_marked", contexts: ["selection"]});
chrome.contextMenus.create({id: "essence_travel1",          title: "Travel style",            parentId: "essence_parent_marked", contexts: ["selection"]});
chrome.contextMenus.create({id: "essence_spaper1",          title: "Scientific Paper style",  parentId: "essence_parent_marked", contexts: ["selection"]});
chrome.contextMenus.create({id: "essence_bizanalytics1",    title: "Biz. Analytics style",    parentId: "essence_parent_marked", contexts: ["selection"]});
chrome.contextMenus.create({id: "essence_explain1",         title: "Explain text",            parentId: "essence_parent_marked", contexts: ["selection"]});
chrome.contextMenus.create({id: "essence_tabularize1",      title: "Turn into a table (generic)", parentId: "essence_parent_marked", contexts: ["selection"]});

chrome.contextMenus.create({id: "essence_addnote3",         title: "Add as note",             parentId: "essence_parent_marked", contexts: ["selection"]});

//////////////////////////// PROCESS page ////////////////////////////
chrome.contextMenus.create({id: "essence_parent_process_page",  title: "Process page... %s", contexts: ["page"]});
chrome.contextMenus.create({id: "essence_generic2",             title: "Generic style",           parentId: "essence_parent_process_page", contexts: ["page"]});
chrome.contextMenus.create({id: "essence_bulletsgeneric2",      title: "Generic Bullets style",   parentId: "essence_parent_process_page", contexts: ["page"]});
chrome.contextMenus.create({id: "essence_travel2",              title: "Travel style",            parentId: "essence_parent_process_page", contexts: ["page"]});
chrome.contextMenus.create({id: "essence_spaper2",              title: "Scientific Paper style",  parentId: "essence_parent_process_page", contexts: ["page"]});
chrome.contextMenus.create({id: "essence_bizanalytics2",        title: "Biz. Analytics style",    parentId: "essence_parent_process_page", contexts: ["page"]});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab.id != -1) {
    chrome.tabs.sendMessage(tab.id, {
      type: info.menuItemId,
      text: info.selectionText === undefined ? info.selectedText : info.selectionText,
      // textB: info.selectedText
    })
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {
        type: info.menuItemId,
        text: info.selectionText === undefined ? info.selectedText : info.selectionText,
      });
    });  
  }
});

chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
  chrome.tabs.sendMessage(tab.id, 'getPdfSelection', sel => {
    console.log('BG LISTENER: ' + sel.menuItemId);
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    const url = tab.url;

    if (url.startsWith("file://")) {
      // remove contextMenu item
      chrome.contextMenus.remove("essence_parent_marked");
      chrome.contextMenus.remove("essence_generic1");
      chrome.contextMenus.remove("essence_bulletsgeneric1");
      chrome.contextMenus.remove("essence_travel1");
      chrome.contextMenus.remove("essence_spaper1");
      chrome.contextMenus.remove("essence_bizanalytics1");
      chrome.contextMenus.remove("essence_explain1");
      chrome.contextMenus.remove("essence_tabularize1");
      chrome.contextMenus.remove("essence_addnote3");

      chrome.contextMenus.create({id: "essence_file4", title: "Process this... %s" , contexts: ["selection"]});

    }
  }
});

