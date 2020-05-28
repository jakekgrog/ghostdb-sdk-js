var Cache = require('./cache');
var path = require('path');

//Absolute path required for testing
var cache = new Cache(path.resolve(__dirname, 'ghostdb_test.conf'));

setInterval(simulateTraffic, 2500)

function simulateTraffic() {
    cache.put("Dublin", "Ireland").then(function (data) {
        console.log(data);
    });

    cache.put("Dublin", "Ireland").then(function (data) {
        console.log(data);
    });
    cache.add("Dublin", "Ireland").then(function (data) {
        console.log(data);
    });
    cache.add("London", "England").then(function (data) {
        console.log(data);
    });
    //cache.flush();
    cache.get("Dublin").then(function (data) {
        console.log(data);
    });
    cache.add("Dublin", "Ireland").then(function (data) {
        console.log(data);
    });
    cache.get("Dublin").then(function (data) {
        console.log(data);
    });
    cache.delete("Dublin").then(function (data) {
        console.log(data);
    });
    cache.get("Dublin").then(function (data) {
        console.log(data);
    });
    cache.delete("Dublin").then(function (data) {
        console.log(data);
    });
    cache.add("Dublin", "Ireland").then(function (data) {
        console.log(data);
    });
    // cache.getSnitchMetrics().then(data => {
    //     console.log(data);
    // });
    // cache.getWatchdogMetrics().then(data => {
    //     console.log(data);
    // });
    cache.flushNode("127.0.0.1").then(function (data) {
        console.log(data);
    })
    cache.ping().then(data => {
        console.log(data);
    });
}