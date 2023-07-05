/* global chrome */
(function() {
    /*
     Copyright The Closure Library Authors.
     SPDX-License-Identifier: Apache-2.0
    */
    var a;
    const b = document.documentElement,
        c = document.getElementsByTagName("embed")[0];
    (a = c && c.clientWidth >= .9 * b.clientWidth && c.clientHeight >= .9 * b.clientHeight && ("application/pdf" == c.type || "application/x-google-chrome-pdf" == c.type) ? c : null) && a.postMessage({
        type: "getSelectedText"
    });
})
.call(this);
