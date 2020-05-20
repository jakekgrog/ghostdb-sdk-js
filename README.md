# GhostDB SDK for Node.js

The GhostDB SDK for Node.js allows Node.js developers to write software that makes use of the [GhostDB](https://www.github.com/ghostdb/ghostdb-cache-node) distributed caching system.

## Example Usage

```javascript
var path = require('path');
var gdb = require('ghost-db-sdk');

var cache = new gdb(path.resolve(__dirname, 'node.conf'));

async function getStockData(tickerSmbl) {
    // Fetch data from cache
    stockData = await cache.get(tickerSmbl);

    if (stockData.Value == "CACHE_MISS") {
        // Fetch from your database (MongoDB, MySQL etc.)
        // After any processing, we can 
        // assume our computed value is stored in
        // a variable called stockData
    
        // Store result in cache. We do not need to await here.
        // However if it is essential that data is cached
        // you can wait for a response telling you if data
        // has been cached or not.
        cache.put(tickerSmbl, stockData);
    }
    return stockData
}

return getStockData("AMZN")

```

## Installation

The GhostDB SDK for Node.js can be installed using npm at the command line:

```
> npm install ghost-db-sdk
```

To install the SDK so that it is added to your package.json file, you can use the following command:

```javascript
npm install --save ghost-db-sdk
```

Once installed, you must create a configuration file in order for the GhostDB SDK to interact with your GhostDB cluster. You can name this file whatever you like. This file is the same as it would be for the Node.js SDK. An example configuration file can be found below:

```
10.23.20.11
10.23.20.12
10.23.22.6
```

> We recommend that the node configuration file is read from a remote server. This way, your application servers are reading from the same file.

Now you are ready to integrate GhostDB into your Node.js application.

## Importing GhostDB

Now that the GhostDB SDK has been installed and configured, you can now integrate GhostDB into your application. 
The first thing you must do is import the SDK:

```javascript
ghostdb = require(‘ghost-db-sdk’);
```

Next, you must create a cache instance. To do this you must pass the name of your configuration file (the file containing IP addresses of GhostDB Nodes). For this guide we also use the ‘path’ package. If you do not have this package as a dependency on your project, you will need to install it.

```javascript
cache = new ghostdb(path.resolve(__dirname, ‘gdb.conf’));
```

Now that everything has been set up, you can interact with your cluster. The GhostDB SDK for Node.js provides eight asynchronous methods you can use to interact with your cluster.
Note: If you receive an error when using any of the below methods inside a function, please ensure your function is asynchronous. This can be achieved by using the async keyword

## Retrieval Methods

The first method is get(). This method requires you to pass a key which must be a string. If there exists a key/value pair with the key you passed in your distributed cache cluster, you will be returned the key/value pair, otherwise, you will be returned the string “CACHE_MISS”. An example of this is below:

```javascript
data = await cache.get(“mykey”)
```

The variable data will now contain one of two things:

```
{ “Message”: { “Key”: … , “Value”: … } }
{ “Message”: “CACHE_MISS” }
```

## Storage Methods

GhostDB has two storage commands: put() and add().
The put() method takes three arguments: put(key, value, ttl)
The key parameter must be a string. The value parameter can be whatever type you like. The ttl parameter is the time-to-live for the object in the cache. For example, if the ttl was set to 300 then this key/value pair will be considered to be expired after 300 seconds and automatically removed from the cache after that time. The ttl parameter must be an int.
If you do not want your key/value object to expire in the cache then you may set the time-to-live to be -1.
The add() method takes three arguments too: add(key, value, ttl)
The parameters are the same as they are for put()as well as the return types. 
The put() method will overwrite a key/value pair if the key already exists. The add() method will only write a key/value pair if the key does not exist.
You use both methods as follows:

```javascript
resultPut = await cache.put(“myKey”, “myValue”, -1)
resultAdd = await cache.add(“myKey”, “myValue”, -1)
```

The return types of both calls are as follows:

```
resultPut: {“Message”: “STORED”}
resultAdd: {“Message”: “NOT_STORED”}
```

## Deletion Methods

There are two deletion methods in GhostDB. The first deletion method is the delete() method. This method requires that a key is passed. The key must be of type string. If there exists a key/value pair with the key you passed to the method, then it will be removed from the cache, otherwise, you will be returned a string saying the key could not be found.
Below is example usage of this method:

```javascript
res = await cache.delete(“myKey”)
```

The variable res will now contain one of two things:

```
{ “Message”: “REMOVED” }
{ “Message”: “NOT_FOUND” }
```

The second deletion method is flush(). This method will clear all key/value pairs from all cache nodes and is used as follows:

```javascript
res = await cache.flush()
```

The variable res will now contain one of two things:

```
{ “Message”: “FLUSHED” }
{ “Message”: “ERR_FLUSH” }
```

## Metrics Commands

GhostDB provides two commands to give you access to cache metrics. The first method is getSnitchMetrics(). This will return the system metrics for each server as an array.
An example usage and return can be found below:

```javascript
metrics = await cache.getSnitchMetrics()
```

The return result will look similar to the below:

```
{ “metrics”: [ 
    { 
        “node”: “10.23.34.4”, 
        “data”: [{...}, … , {...}] 
    }, 
    {...} 
]}
```

The second metrics method is getWatchdogMetrics(). This will return the application metrics for each server as an array.
An example usage and return can be found below:

```javascript
metrics = await cache.getWatchdogMetrics()
```

The return result will look similar to the below:

```
{ “metrics”: [
    {
        “node”: “10.23.34.4”,
        “data”: [ {...}, ..., {...} ]
    },
    {...}
]}
```

## Ping Method

The ping method will return an object containing an array of all GhostDB Cache Nodes that could be reached.
It is used as follows: 

```javascript
servers = await cache.ping()
```

### Error Types

There are two GhostDB specific errors that might be thrown during the execution of GhostDB methods. 
The first is the GhostNoMoreServersError. This error will be thrown if no servers in your cache cluster are reachable.
The second is the GhostKeyError. This error is thrown if any key you provide to a GhostDB storage, deletion or retrieval method is not a string.
You can catch these errors as follows:

```javascript
try { 
    // Your code here
}
catch (e) {:
    if (e instanceof cache.GhostNoMoreServersError) {
        // Handle exception
    }
}
```

Replace `cache.GhostNoMoreServersError` with `cache.GhostKeyError` to catch the key error.

## Authors
- [Jake Grogan](https://www.github.com/jakekgrog)
- [Connor Mulready](https://www.github.com/nohclu)