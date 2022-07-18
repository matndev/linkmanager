// // Zoom constants. Define Max, Min, increment and default values
// // const ZOOM_INCREMENT = 0.2;
// // const MAX_ZOOM = 3;
// // const MIN_ZOOM = 0.3;
// // const DEFAULT_ZOOM = 1;
// var infos = {};

// // function firstUnpinnedTab(tabs) {
// //   for (var tab of tabs) {
// //     if (!tab.pinned) {
// //       return tab.index;
// //     }
// //   }
// // }

// /**
//  * listTabs to switch to
//  */
// function listTabs() {
//   getCurrentWindowTabs().then((tabs) => {
//     let tabsList = document.getElementById('tabs-list');
//     let currentTabs = document.createDocumentFragment();
//     let limit = 5;
//     let counter = 0;

//     tabsList.textContent = '';

//     for (let tab of tabs) {
//       if (!tab.active && counter <= limit) {
//         let tabLink = document.createElement('a');

//         tabLink.textContent = tab.title || tab.id;
//         tabLink.setAttribute('href', tab.id);
//         tabLink.classList.add('switch-tabs');
//         currentTabs.appendChild(tabLink);
//       }

//       counter += 1;
//     }

//     tabsList.appendChild(currentTabs);
//   });
// }

// document.addEventListener("DOMContentLoaded", listTabs);

// function getCurrentWindowTabs() {
//   return browser.tabs.query({currentWindow: true});
// }

// // document.addEventListener("click", (e) => {
// //   function callOnActiveTab(callback) {
// //     getCurrentWindowTabs().then((tabs) => {
// //       for (var tab of tabs) {
// //         if (tab.active) {
// //           callback(tab, tabs);
// //         }
// //       }
// //     });
// //   }

// //   if (e.target.id === "tabs-alertinfo") {
// //     callOnActiveTab((tab) => {
// //       let props = "";
// //       for (let item in tab) {
// //         props += `${ item } = ${ tab[item] } \n`;
// //       }
// //       alert(props);
// //     });
// //   }

// //   e.preventDefault();
// // });

// //onRemoved listener. fired when tab is removed
// browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
//   console.log(`The tab with id: ${tabId}, is closing`);

//   if(removeInfo.isWindowClosing) {
//     console.log(`Its window is also closing.`);
//   } else {
//     console.log(`Its window is not closing`);
//   }
// });

// //onMoved listener. fired when tab is moved into the same window
// browser.tabs.onMoved.addListener((tabId, moveInfo) => {
//   var startIndex = moveInfo.fromIndex;
//   var endIndex = moveInfo.toIndex;
//   console.log(`Tab with id: ${tabId} moved from index: ${startIndex} to index: ${endIndex}`);
// });

// /** MA PARTIE */

// function callOnActiveTab(callback) {
//   getCurrentWindowTabs().then((tabs) => {
//     for (var tab of tabs) {
//       if (tab.active) {
//         callback(tab, tabs);
//       }
//     }
//   });
// }

// function getInfos() {
//   console.log('DEMARRAGE EXTENSION');
//   callOnActiveTab((tab) => {
//     let props = "";
//     for (let item in tab) {
//       props += `${ item } = ${ tab[item] } \n`;
//     }
//     alert(props);
//     // infos = props;
//     // console.log('webext: ', props);
//     // document.getElementsByClassName('url').textContent = props;
//   });
// }

// browser.browserAction.onClicked.addListener(function(tab) {
//   let props = "";
//   for (let item in tab) {
//     props += `${ item } = ${ tab[item] } \n`;
//   }
//   console.log('DEMARRAGE EXTENSION 2: ', props);
// });
// browser.browserAction.onClicked.removeListener(getInfos);

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

function getLongestDashSuite(input) {
  const arr = input.match(/[-]+/g);
  return arr != null && arr.length > 0 ? arr.reduce((r, s) => (r > s.length ? r : s.length), 0) : 0;
}

// let faviconURL = '';
var activeTabPromise = browser.tabs.query({ active: true, currentWindow: true });
activeTabPromise.then((tabs) => {
  for (const tab of tabs) {
    console.log(`url: ${tab.url}\ntitle: ${tab.title}\nfavicon: ${tab.favIconUrl}`);
    const faviconURL = tab.favIconUrl;
    // const idFavicon = downloadFavicon(faviconURL);

    let lengthUrl = getLongestDashSuite(tab.url);
    let lengthTitle = getLongestDashSuite(tab.title);
    const length = lengthUrl > lengthTitle ? lengthUrl + 1 : lengthTitle + 1;

    const output = tab.url + "-".repeat(length) + tab.title + "-".repeat(length) + faviconURL; // idFavicon
    const infosTag = document.getElementById("infos");
    infosTag.innerText = output;

    browser.tabs.query({ currentWindow: true }).then((tabs) => {
      console.log("tabs: ", tabs);
      const regex = new RegExp("^(file:/*).*(LinkManager).*(.html)");
      for (const tab of tabs) {
        if (regex.test(tab.url)) {
          function onExecuted(result) {
            console.log(`clipboard content injected`);
          }

          function onError(error) {
            console.error(`Error: ${error}`);
          }

          const dataFromClipboard =
            'const div = document.createElement("div");' +
            'div.className = "clipboard";' +
            'div.textContent = "' +
            output +
            '";' +
            'div.style.display = "none";' +
            "document.body.appendChild(div);" +
            "undefined;";

          const executing = browser.tabs.executeScript(tab.id, {
            code: dataFromClipboard,
          });
          executing.then(onExecuted, onError);
        }
      }
    });

    navigator.clipboard.writeText(output).then(
      function () {
        console.log("copy to clipboard success..");
      },
      function () {
        console.log("copy to clipboard failed..");
      }
    );
  }
});

function downloadFavicon(faviconURL) {
  const id = "lm-" + uuidv4() + ".ico";
  browser.runtime.sendMessage({
    type: "downloadFavicon",
    faviconURL: faviconURL,
    filename: id,
  });
  return id;
}
