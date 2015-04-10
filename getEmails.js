var https = require('https');
var http = require('http');
var Q = require('q');
var fs = require('fs');

var access_token = 'ya29.UQHeVYPFyZIPg-OzhVI5CO0uTZkLKtUaw21St204R71BmZFNkDtswaoR4zu2JXdQsSqFrW5QbGtpqw';
var BASE_URL = 'www.googleapis.com';
var BASE_PATH = '/gmail/v1/users/me/messages';
var FILE_PATH = 'apalsson';

var doRequest = function(path, query) {
  if (query) {
    path += '?' + query;
  }
  console.log('running ' + path);
  var def = Q.defer();  
  var result = {};
  var options = {
    hostname: BASE_URL,
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };
  
  https.get(options, function(res) {
    result.status = res.statusCode;
    console.log('got status: ' + result.status);
    var output = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {      
      output += chunk;
    })
    .on('end', function() {
      try {
        var obj = JSON.parse(output);
        result.data = obj;
      } catch (err) {
        console.log('Failed to parse data: ', err);
      }
      def.resolve(result);
    });
  })  
  .on('error', function(e) {
    console.log('http error', e);
    result.error = e.message;
    def.reject(result);
  });

  return def.promise;
} 


var writeFile = function(name, data) {
  var def = Q.defer();
  fs.writeFile(name, data, function (err) {
    if (err) {
      console.log(err);
    }

    def.resolve();
  });
  return def.promise;
}


var getMessage = function(messageId) {
  return function() {
    return doRequest(BASE_PATH + '/' + messageId)
      .then(function(message) {
        return writeFile(FILE_PATH + '/' + messageId, 
                         JSON.stringify(message, null, 2));
    });
  };
}


var downloadMessages = function(messages) {
  var ret = null;
  for (var i = 0; i < messages.length; i++) {
    var message = messages[i];
    var getter = getMessage(message);
    if (ret == null) {
      ret = getter();
    } else {
      ret = ret.then(getter);
    }
  }
  return ret;
};

var listMessages = function() {
  var ids = [];
  var nextPageToken = null;

  var listPage = function() {
    return function() {
      var query = null;
      if (nextPageToken) {
        query = "pageToken=" + nextPageToken;
      }
      return doRequest(BASE_PATH, query)
        .then(function(res) {
          if (res.data.messages) {
            for (var i = 0; i < res.data.messages.length; i++) {
              var message = res.data.messages[i];
              ids.push(message.id);
            }
          }
          nextPageToken = res.data.nextPageToken;
        });
    }
  };

  var ret = null;
  for (var i = 0; i < 10; i++) {
    var getter = listPage();
    if (ret == null) {
      ret = getter();
    } else {
      ret = ret.then(getter);
    }
  }
  
  ret.then(function() {
    return downloadMessages(ids);
  });
};


listMessages()
