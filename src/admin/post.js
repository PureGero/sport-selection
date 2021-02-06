export default (url, json, callback) => {
  var req = new XMLHttpRequest();

  req.onreadystatechange = function() {
    if (this.readyState == 4) {
      try {
        callback(JSON.parse(req.responseText));
      } catch (e) {
        callback(req.responseText, e);
      }
    }
  };

  req.open('POST', url, true);
  req.withCredentials = true;
  req.send(JSON.stringify(json));
};