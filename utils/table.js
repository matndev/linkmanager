function tableInit() {
  var thElm;
  var startOffset;

  Array.prototype.forEach.call(document.querySelectorAll("table.lm-table th"), function (th, index, array) {
    th.style.position = "relative";

    var grip = document.createElement("div");
    grip.innerHTML = "&nbsp;";
    grip.classList = "table-separator";
    grip.style.top = 0;
    grip.style.right = 0;
    grip.style.bottom = 0;
    grip.style.width = "5px";
    grip.style.position = "absolute";
    grip.style.cursor = "col-resize";
    grip.style.backgroundImage =
      "linear-gradient(90deg, rgba(54,54,54,1) 30%, rgba(64,64,64,1) 30%, rgba(95,95,95,1) 70%, rgba(54,54,54,1) 70%)";
    grip.addEventListener("mousedown", function (e) {
      thElm = th;
      startOffset = th.offsetWidth - e.pageX;
      let app = document.getElementById("app");
      let arr = app.className.split(" ");
      if (arr.indexOf("noselect") === -1) {
        app.className += " " + "noselect";
      }
    });

    if (index !== array.length - 1) th.appendChild(grip);
  });

  document.addEventListener("mousemove", function (e) {
    if (thElm && thElm.className.indexOf("fixed") === -1) {
      thElm.style.width = startOffset + e.pageX + "px";
    }
  });

  document.addEventListener("mouseup", function () {
    thElm = undefined;
    let app = document.getElementById("app");
    app.className = app.className.replace(/\bnoselect\b/g, "");
  });
}
// http://jsfiddle.net/thrilleratplay/epcybL4v/
