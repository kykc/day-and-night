'use strict';

let express = require('express');
let app = express();
let fs = require('fs');
let browserify = require('browserify');
let moment = require('moment');
let request = require('request');

let b = browserify();
b.add('./api-client.js');
let stream = b.bundle();
let jsBundle = "";

stream.on('data', function(chunk) {
    jsBundle += chunk;
});

let toRadians = function (angle) {
    return angle * (Math.PI / 180);
};

let toDegrees = function (angle) {
    return angle * (180 / Math.PI);
};

let calcDeclination = function(dayIdx) {
    let part = Math.cos(toRadians(360.0/365 * (dayIdx + 1)));
    return part * 23.45 * -1.;
};

let calcHourAngleOfSunrise = function(latitude, dayIdx) {
    let delta = toRadians(calcDeclination(dayIdx));
    let l = toRadians(latitude);
    let term = Math.cos(toRadians(90.833)) / (Math.cos(l) / Math.cos(delta)) - Math.tan(l) * Math.tan(delta);

    let result = 0;

    if (Math.abs(term) > 1.) {
        result = toDegrees(Math.acos(1. * Math.sign(term)));
    } else {
        result = toDegrees(Math.acos(term));
    }

    return result;
};

let calcDayLengthInSeconds = function(ha) {
    return (2.0 * ha / 15) * 60 * 60;
};

let generateDates = function() {
    let dates = [];

    let dt = moment(moment().format("YYYY") + "-01-01");
    do {
        dates.push(dt.format("YYYY-MM-DD"));
        dt = dt.add(1, 'days');
    } while (dt.format("YYYY") === moment().format("YYYY"));

    return dates;
};

let getCoords = function(something, req, callback) {
    let uri = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(something)}&format=json&polygon=0&addressdetails=1`;
    let headers = {'User-Agent': req.get('User-Agent')};

    request({uri: uri, headers: headers}, function(err, resp) {
        if (resp.body && resp.statusCode == 200) {
            callback(JSON.parse(resp.body));
        } else {
            callback({error: true});
        }
    });
};

app.get('/api/approx-day-length', function (req, res) {
    cityToCoords(req.query.code).then(async function(location) {
        res.setHeader('Content-Type', 'application/json');
        let latitude = parseFloat(location.lat);
        let dayIdx = parseInt(moment(req.query.date).format("DDD"));
        res.send(JSON.stringify(calcDayLengthInSeconds(calcHourAngleOfSunrise(latitude, dayIdx))));
    });
});

app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.send(fs.readFileSync('client-html/index.html', {encoding: "utf8"}));
});

app.get('/dashboard.css', function(req, res) {
    res.setHeader('Content-Type', 'text/css');
    res.send(fs.readFileSync('client-html/dashboard.css', {encoding: "utf8"}));
});

app.get('/api/get-coords', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    getCoords(req.query.code, req, function(result) {
        if (result.error || result.length === 0) {
            res.send(JSON.stringify({error: true}));
        } else {
            res.send(JSON.stringify(result));
        }
    });

});

app.get('/api/approx-data', function (req, res) {

    res.setHeader('Content-Type', 'application/json');
    let dates = generateDates();

    if (req.query.code === 'Baseline') {
        let result = {};

        for (var i = 0; i < dates.length; ++i) {
            result[dates[i]] = {day_length: 1440 * 60};
        }

        res.send(JSON.stringify(result));
    } else {
        getCoords(req.query.code, req, function (locations) {
            if (locations.error || locations.length === 0) {
                res.send(JSON.stringify({error: 'Location not found'}));
            } else {
                let location = locations[0]; // TODO: let the user choose in the autocomplete manner when more than one match found
                let result = {};

                for (var i = 0; i < dates.length; ++i) {
                    let dayIdx = parseInt(moment(dates[i]).format("DDD"));
                    result[dates[i]] = {day_length: calcDayLengthInSeconds(calcHourAngleOfSunrise(location['lat'], dayIdx))};
                }

                res.send(JSON.stringify(result));
            }
        });
    }
});


app.get('/bundle.js', function (req, res) {
    res.setHeader('Content-Type', 'text/javascript');
    res.send(jsBundle);
});

app.use('/js', express.static('client-js'));
app.listen('3088');
console.log('Listening on http://localhost:3088');
