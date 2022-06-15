var db = new PouchDB('linkmanager');

db.info().then(function (info) {
    console.log('PouchDB loaded successfully...');
    console.log(info);
})

// db.exportData = function() {
//     db.allDocs({include_docs: true}, (error, result) => {
//         if (error) { console.log(error) }
//         return result.rows.map(obj => { return obj.doc });
//     });
// }