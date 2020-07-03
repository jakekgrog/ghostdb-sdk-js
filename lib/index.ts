import Cache from './cache';
import * as path from 'path';

//Absolute path required for testing
var cache = new Cache(path.resolve(__dirname, 'ghostdb_test.conf'));

setInterval(simulateTraffic, 2500)

function simulateTraffic() {
    cache.put("Dublin", "Ireland").then(function (data) {
        console.log("1", data);
    });

    // cache.put("Dublin", "Ireland").then(function (data) {
    //     console.log("2", data);
    // });
    // cache.add("Dublin", "Ireland").then(function (data) {
    //     console.log("3", data);
    // });
    
    // cache.get("Dublin").then(function (data) {
    //     console.log("4", data);
    // });
    // cache.flush().then(function (data) {
    //     console.log("FLUSH", data);
    // });
    // cache.add("Dublin", "Ireland").then(function (data) {
    //     console.log("5", data);
    // });
    // cache.get("Dublin").then(function (data) {
    //     console.log("6", data);
    // });
    // cache.delete("Dublin").then(function (data) {
    //     console.log(data);
    // });
    // cache.get("Dublin").then(function (data) {
    //     console.log(data);
    // });
    // cache.delete("Dublin").then(function (data) {
    //     console.log(data);
    // });
    // cache.add("Dublin", "Ireland").then(function (data) {
    //     console.log(data);
    // });
    cache.getSnitchMetrics().then((data: any) => {
        //console.log(data[0].metrics.Gobj);
    });
    cache.getWatchdogMetrics().then(data => {
        //console.log(data[0].metrics.Gobj);
    });
    cache.ping().then(data => {
        console.log(data[0]);
    });
}