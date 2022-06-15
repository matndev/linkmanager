// function updateCount(tabId, isOnRemoved) {
//   browser.tabs.query({})
//   .then((tabs) => {
//     let length = tabs.length;

//     // onRemoved fires too early and the count is one too many.
//     // see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
//     if (isOnRemoved && tabId && tabs.map((t) => { return t.id; }).includes(tabId)) {
//       length--;
//     }

//     browser.browserAction.setBadgeText({text: length.toString()});
//     if (length > 2) {
//       browser.browserAction.setBadgeBackgroundColor({'color': 'green'});
//     } else {
//       browser.browserAction.setBadgeBackgroundColor({'color': 'red'});
//     }
//   });
// }


// browser.tabs.onRemoved.addListener(
//   (tabId) => { updateCount(tabId, true);
// });
// browser.tabs.onCreated.addListener(
//   (tabId) => { updateCount(tabId, false);
// });
// updateCount();

// function randFunc(tab) {
//   let props = "";
//   for (let item in tab) {
//     props += `${ item } = ${ tab[item] } \n`;
//   }
//   console.log('DEMARRAGE EXTENSION 2: ', props);
//   alert(props);
// }

// function testFunc() {
//   console.log('TEST FUNCTION');
// }
// browser.browserAction.onClicked.addListener(testFunc);

function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], {type: mimeString});
  return blob;

}

browser.runtime.onMessage.addListener(notify);

function notify(message) {
  if (message.type === "downloadFavicon") {
    const blob = dataURItoBlob(message.faviconURL);
    const targetURL = URL.createObjectURL(blob);
    // targetURL : The URL lifetime is tied to the document in the window on which it was created. (MDN)
    console.log('message.faviconURL: ', message.faviconURL);
    console.log('blob: ', blob);
    console.log('targetURL: ', targetURL);
    // browser.downloads.download({ url : targetURL, filename: message.filename, saveAs: false });
  }
}