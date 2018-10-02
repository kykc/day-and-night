var layout1 = {
    yaxis: {rangemode: 'tozero', zeroline: true}
};

var traces = [];

window.plotApprox = function(code) {
    window.getApprox(code, function(clientData) {
        if (clientData.error) {
            alert(code + ": " + clientData.error);
        } else {
            var x = Object.keys(clientData);
            var y = Object.values(clientData).map(row => row['day_length'] / 60);

            var trace = {x: x, y: y, type: 'scatter', name: code};
            traces.push(trace);
            Plotly.newPlot('div1', traces, layout1, {responsive: true});
        }
    });
};

window.drawClick = function() {
    window.plotApprox(document.getElementById('locationSelect').value);
    document.getElementById('locationSelect').value = '';
};

window.clearPlots = function() {
    traces = [];
    window.plotApprox('Baseline');
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

    window.plotApprox('Baseline');
};

window.exportPlot = function() {
    document.querySelectorAll('[data-title="Download plot as a png"]')[0].click();
};