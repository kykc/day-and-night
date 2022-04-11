const pad = x => ("00" + x).slice(-2);

const toTime = function(v) {
    return pad(parseInt(v / 60)) + "h" + pad(parseInt(v % 60)) + "m";
};

const layout = {
    yaxis: {
        range: [0, 1440],
        tickvals: [...Array(25).keys()].map(x => x * 60),
        ticktext: [...Array(25).keys()].map(x => x * 60).map(toTime)
    }
};

var traces = [];

window.plotApprox = function(code) {

    waitingDialog.show(undefined, {onHide: () => document.getElementById("locationSelect").focus()});
    window.getApprox(code, function(clientData) {
        if (clientData.error) {
            alert(code + ": " + clientData.error);
        } else {
            var x = Object.keys(clientData);
            var y = Object.values(clientData).map(row => row['day_length'] / 60);

            var trace = {x: x, y: y, type: 'scatter', name: code};

            trace.text = trace.y.map(v => toTime(v));
            traces.push(trace);

            Plotly.newPlot('div1', traces, layout, {responsive: true});
        }

        waitingDialog.hide();
    });
};

window.drawClick = function() {
    window.plotApprox(document.getElementById('locationSelect').value);
    document.getElementById('locationSelect').value = '';
};

window.clearPlots = function() {
    traces = [];
    window.plotApprox('∅');
};

window.onload = function() {
    document.getElementById('locationSelect').addEventListener("keyup", function(event) {
        // Cancel the default action, if needed

        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("performBtn").click();
        }
    });

    window.plotApprox('∅');
};

window.exportPlot = function() {
    document.querySelectorAll('[data-title="Download plot as a png"]')[0].click();
};