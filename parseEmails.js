var Q = require('q');
var fs = require('fs');
var FILE_PATH = 'apalsson';

var readFile = function(name) {
  var def = Q.defer();
  fs.readFile(name, function (err, data) {
    if (err) {
      def.reject(err);
      return;
    }
    def.resolve(data);
  });
  return def.promise;
}


var getMessage = function(fileName) {
  return readFile(fileName)
  .then(function(data) {
    var ret = null;
    try {
      ret = JSON.parse(data);
    } catch (err) {
      console.log('failed to parse message');
    }
    return ret;
  }, function(err) {
    console.log('failed to read message');
    return null;
  });
}

var parseOne = function(fileName) {  
  return function() {
console.log(fileName);
    return getMessage(fileName)
    .then(function(data) {
      if (data && data.data && data.data.payload)
        var messageData = parseMessageData(data);
    }, function(err) {
      console.log(err);
    });
  }
}

var listFiles = function(path) {
  var def = Q.defer();  
  fs.readdir(path, function(err, data) {
    if (err) {
      def.reject(err);
      return;
    }
    def.resolve(data);
  });
  return def.promise;
};

var parseMessages = function() {
  return listFiles(FILE_PATH)
  .then(function(files) {
    var ret = null;
    for (var i = 0; i < files.length; i++) {
    //for (var i = 0; i < 1; i++) {
      var file = FILE_PATH + '/' + files[i];
      var getter = parseOne(file);
      if (ret == null) {
        ret = getter();
      } else {
        ret = ret.then(getter);
      }
    }
    return ret;
  }, function(err){
    console.log('failed to read files', err);
  });
};


var parseMessageData = function(data) {
  // This is called once per message! do cool shot here
};

parseMessages()
.then(function() {
  console.log('done');
});
