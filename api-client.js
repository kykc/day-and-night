let request = require('browser-request');

window.getApprox = function(code, callback) {
    request(`/api/approx-data?code=${code}`, function(er, res) {
        callback(JSON.parse(res.responseText));
    });
};