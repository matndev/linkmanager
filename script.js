"use strict";

var { forkJoin, of } = rxjs;
var { map, catchError } = rxjs.operators;
var LocalizedFormat = dayjs_plugin_localizedFormat;
// var LocalizedFormat = require("dayjs/plugin/localizedFormat");
// var customLocale = window.dayjs_locale_fr;

var USER_I18N = (function getBrowserLocales(options = {}) {
  const defaultOptions = {
    languageCodeOnly: false,
  };

  const opt = {
    ...defaultOptions,
    ...options,
  };

  const browserLocales = navigator.languages === undefined ? [navigator.language] : navigator.languages;

  if (!browserLocales) {
    return undefined;
  }

  return browserLocales.map((locale) => {
    const trimmedLocale = locale.trim();

    return opt.languageCodeOnly ? trimmedLocale.split(/-|_/)[0] : trimmedLocale;
  });
})()[0];

window.app = function () {
  return {
    path: "assets/favicon/",
    exportJson: "",
    stylesheet: "flat",
    // COMMAND
    command: "",
    // MODAL
    isModalOpen: false,
    addType: "raw",
    flagNewBookmark: false,
    flagExport: false,
    flagSettings: false,
    flagOptionsLink: false,
    // TABLE
    trHover: false,
    items: [],
    attachments: [],
    init() {
      db.allDocs({ include_docs: true, attachments: true, binary: true }, (error, result) => {
        if (error) {
          console.log(error);
        }
        console.log("INIT docs DB: ", result);
        result.rows.forEach((obj) => {
          if (obj.doc.hasOwnProperty("_attachments"))
            this.attachments.push({
              id: obj.id,
              img: URL.createObjectURL(obj.doc._attachments[obj.id + ".ico"].data),
            });
          else this.items.push(obj.doc);
        });
        console.log("INIT docs: ", this.items);
        console.log("INIT docs attachments: ", this.attachments);
      });
      tableInit();
    },
    disableFlags() {
      this.flagNewBookmark = false;
      this.flagExport = false;
      this.flagSettings = false;
    },
    importData(json) {
      console.log("Import...");
      let docList = JSON.parse(json);
      docList = Array.isArray(docList) ? docList : [docList];
      db.bulkDocs(docList)
        .then(function (result) {
          console.log("Import in PouchDB success ", result);
          this.isModalOpen = false;
        })
        .catch(function (err) {
          console.log("Import in PouchDB failed ", err);
        });
    },
    // EXPORT
    exportData() {
      console.log("Export...");
      this.isModalOpen = true;
      this.flagNewBookmark = false;
      this.flagExport = true;
      this.flagSettings = false;
    },
    exportToTxt() {
      db.allDocs({ include_docs: true }).then((result) => {
        var array = result.rows.map((obj) => {
          return obj.doc;
        });
        this.exportTxt = transformArrayToReadableList(array);
        this.exportJson = null;
        saveFile("linkmanager-download.txt", this.exportTxt);
      });
    },
    exportDb() {
      db.allDocs({ include_docs: true }).then((result) => {
        var array = result.rows.map((obj) => {
          return obj.doc;
        });
        this.exportJson = JSON.stringify(array, null, 2);
        this.exportTxt = null;
        saveFile("linkmanager-download.json", this.exportJson);
      });
    },
    // SETTINGS
    settings() {
      console.log("settings modal");
      this.isModalOpen = true;
      this.flagSettings = true;
      this.flagNewBookmark = false;
      this.flagExport = false;
    },
    changeDesign() {
      if (this.stylesheet === "flat") this.stylesheet = "fancy";
      else this.stylesheet = "flat";
      document.getElementById("stylesheet").setAttribute("href", this.stylesheet + ".css");
    },
    async addBookmark(data) {
      console.log("Add bookmark...");
      const lengthDash = getLongestDashSuite(data);
      const res = data.split("-".repeat(lengthDash));
      const item = {
        link: res[0],
        description: res[1],
        favicon: getDomainFromURL(res[0]), // domain
        creationDate: dayjs(),
        domain: "",
        category: "",
        tags: "",
        visible: true,
        active: false,
      };
      const blob = dataURItoBlob(res[2]);

      const requests = {
        saveItem: db.post(item),
      };

      let isFaviconExists = false;
      db.getAttachment(item.favicon, item.favicon + ".ico")
        .then(function (blobOrBuffer) {
          // handle result
          console.log("then getAttachment: ", blobOrBuffer);
          isFaviconExists = true;
        })
        .catch(function (err) {
          console.log("favicon not found");
          requests.saveAttachment = db.putAttachment(item.favicon, item.favicon + ".ico", blob, "image/x-icon");
        })
        .finally((res) => {
          forkJoin(requests).subscribe((res) => {
            forkJoin({
              savedItem: db.get(res.saveItem.id),
              savedAttachment: db.getAttachment(item.favicon, isFaviconExists ? item.favicon + ".ico" : res.saveAttachment.id + ".ico"),
            }).subscribe((itemWithAttachment) => {
              console.log("DB get item : ", itemWithAttachment);
              const objectURL = URL.createObjectURL(itemWithAttachment.savedAttachment);
              this.items.push({
                ...itemWithAttachment.savedItem,
                faviconImg: objectURL,
              });
              console.log("this.items: ", this.items);
            });
          });
          this.isModalOpen = false;
        });
      // }
    },
    getFaviconById(id) {
      if (!this.$el.__x) return this.path + id;
      const attachments = this.$el.__x.getUnobservedData().attachments;
      const element = attachments.find((attachment) => attachment.id === id);
      return element && element.img ? element.img : this.path + id;
    },
    openOptionsLinkModal(proxy) {
      console.log("proxy", proxy);
      this.disableFlags();
      this.isModalOpen = true;
      this.flagOptionsLink = true;
    },
    deleteDoc(proxy) {
      const id = JSON.parse(JSON.stringify(proxy))._id; // Get rid of Proxy object
      db.get(id)
        .then(function (doc) {
          return db.remove(doc);
        })
        .then((result) => {
          this.items = this.items.filter((item) => item._id !== result.id);
          // console.log('result delete: ', result);
        })
        .catch((err) => {
          console.log(err);
        });
    },
  };
};

function getInfoFromURL(url) {
  // https://s2.googleusercontent.com/s2/favicons?domain_url=
  // http://icons.duckduckgo.com/ip2/  www.stackoverflow.com.ico

  // fetch(url)
  // .then(async r=> console.log(await r.text()))
  // .catch(e=>console.error('Boo...' + e));

  // fetchJsonp(url, {timeout: 3000})
  // .then(res => res.json())
  // .then(json => console.log(json));

  // fetchJsonp(url)
  // .then(function(response) {
  //     return response.json()
  // }).then(function(json) {
  //     console.log('parsed json', json)
  // }).catch(function(ex) {
  //     console.log('parsing failed', ex)
  // })

  // (function() {
  //     var cors_api_host = 'cors-anywhere.herokuapp.com';
  //     var cors_api_url = 'https://' + cors_api_host + '/';
  //     var slice = [].slice;
  //     var origin = window.location.protocol + '//' + window.location.host;
  //     var open = XMLHttpRequest.prototype.open;
  //     XMLHttpRequest.prototype.open = function() {
  //         var args = slice.call(arguments);
  //         var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(args[1]);
  //         if (targetOrigin && targetOrigin[0].toLowerCase() !== origin &&
  //             targetOrigin[1] !== cors_api_host) {
  //             args[1] = cors_api_url + args[1];
  //         }
  //         return open.apply(this, args);
  //     };
  // })();

  const getTitle = (url) => {
    return fetch(`https://crossorigin.me/${url}`)
      .then((response) => response.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const title = doc.querySelectorAll("title")[0];
        return title.innerText;
      });
  };
  console.log(getTitle(url));
}

// getInfoFromURL('https://www.decathlonpro.fr/haltere-hexagonale-sveltus-17-5-kg-id-8671187.html');

function transformArrayToReadableList(array) {
  dayjs.extend(LocalizedFormat);
  const filteredArray = array
    .filter((entry) => !entry.hasOwnProperty("_attachments"))
    .map((item) => {
      return {
        link: item.link,
        category: item.category,
        // creationDate: dayjs(item.creationDate).toString(),
        creationDate: dayjs().format("L LTS"),
        description: item.description,
        domain: item.domain,
        favicon: item.favicon,
        tags: item.tags,
      };
    });
  let result = "";
  filteredArray.forEach(
    (item) => {
      for (const [key, value] of Object.entries(item)) {
        result += key + ": " + value + "\r\n";
      }
      result += "\r\n";
    }
    // item.forEach((field) => (result += field + "\r\n"))
  );
  return result;
}

function saveFile(filename, data) {
  const blob = new Blob([data]); // , { type: "text/csv" }
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    // elem.style.display = 'none';
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
    URL.revokeObjectURL(elem.href);
  }
}

/**
 * Watch DOM events for clipboard user click from Web extension
 */
function observeNewCopyFromExtension() {
  var targetNode = document;
  var config = { subtree: true, attributes: false, childList: true };

  var callback = function (mutationsList) {
    for (var mutation of mutationsList) {
      if (mutation.type == "childList" && mutation.addedNodes[0] && mutation.addedNodes[0].className === "clipboard") {
        const nodeData = mutation.addedNodes[0].innerText;
        window.app().addBookmark(nodeData);
      }
    }
  };

  var observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
  // observer.disconnect();
}
observeNewCopyFromExtension();
