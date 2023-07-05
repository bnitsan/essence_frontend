const keyEvent = new KeyboardEvent('keydown', {
    keyCode: 65,
    code: 'KeyA',
    key: 'a',
    shiftKey: false,
    ctrlKey: true,
    altKey: false,
    metaKey: false,
  });
  document.querySelector('embed').postMessage({
    type: 'sendKeyEvent',
    keyEvent: {
        keyCode: keyEvent.keyCode,
        code: keyEvent.code,
        key: keyEvent.key,
        shiftKey: keyEvent.shiftKey,
        ctrlKey: keyEvent.ctrlKey,
        altKey: keyEvent.altKey,
        metaKey: keyEvent.metaKey,
    }}, '*')