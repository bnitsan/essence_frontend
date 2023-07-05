//document.querySelector('embed').postMessage({type: 'getSelectedText'}, '*');
//console.log('query-pdf executed.');

try {
    const embedElement = document.querySelector("embed");
    if (embedElement) {
      embedElement.postMessage({ type: "getSelectedText" }, "*");
      console.log("query-pdf executed.");
    } else {
      throw new Error("Embed element not found.");
    }
  } catch (error) {
    console.error(error);
  }
  