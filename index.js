var fs = require('fs');
var http = require('http');

var async = require('async');
var cradle = require('cradle');
var colors = require('colors');

var root = './example';
var docs = {};
// TODO: Options.
var db = new(cradle.Connection)('http://localhost:5984').database('civl');

var extensions = {
  'js': 'javascript',
  'coffee':'coffeescript'
};

var formats = {
  'map': 'function(doc){\n{{body}}\n}',
  'reduce': 'function(keys, values){\n{{body}}\n}'
}

var settings = {
  function_signatures: true,
  database: 'civl'
}

fs.readdir(root, function(err, files) { handle([], null, files, function() { Object.keys(docs).map(function(k){ fire(docs[k]); }); }); } );

// Finds and cooks potatoes
function handle(depth, err, files, callback) {
  if (err) return console.log(err);

  var each = function(file, next) {
    var location = root + '/' + depth.join('/') + '/' + file;
    var stat = fs.statSync(location);
    var token;

    if (stat.isDirectory())
      fs.readdir(location, function(err, files) { handle(depth.concat(file), null, files, next); } );
    else if (stat.isFile()) {
      token = depth.concat(file.split('.'));

      if (token.length === 4)
        build(token, fs.readFileSync(location, { encoding: 'utf8' }))
      else
        console.log('Invalid file `' + file.red + '` ignored.');

      next();
    }
  };

  async.each(files, each, callback);
}

function process() {}

// This is the best I can do at predicting language. I'll make something nicer later. "Use the latest language"
function build(token, body) {
  console.log(token.join('.').cyan, body.yellow);

  if (!docs[token[0]])
    docs[token[0]] = { '_id': '_design/' + token[0], 'language': extensions[token[3]] || token[3], 'views': {} }
  
  if (!docs[token[0]]['views'][token[1]])
    docs[token[0]]['views'][token[1]] = {};
  
  docs[token[0]]['views'][token[1]][token[2]] = (settings.function_signatures)?(format(token[2], body)):(body);
}

function format(type, body) {
  // TODO: Temporary
  return formats[type].replace('{{body}}', body);
}

// Format: document.view.function.language
//http://localhost:5984/civl/_all_docs?startkey=%22_design/%22&endkey=%22_design0%22&include_docs=true

// Fire potatoes from potato cannon to CouchDB
function fire(document) {
  db.get(document._id,
    function(err, doc) {
      if (doc)
        document._rev = doc._rev;
      db.save(document);
    }
  )
}