#!/usr/bin/env node

const debug   = false;

const express = require('express');
const DHT     = require('bittorrent-dht');
const async   = require('async');
const app     = express();


const dhtClients = [
  new DHT({
    concurrency: 1024
  })
];

var dhtPeers = [];

dhtClients.forEach(function(dht) {
  dht.listen(0, function () {
    console.log('DHT is now started');
  });

  dht.on('peer', function (peer, hash, from) {
    var hash                  = hash.toString('hex').toLowerCase();
    if (debug) console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port + " for " + hash)
    dhtPeers[hash]          = dhtPeers[hash] ? dhtPeers[hash] : {};
    dhtPeers[hash]['found'] = dhtPeers[hash]['found'] ? dhtPeers[hash]['found'] : 0;

    if (!dhtPeers[hash][peer.host]) {
      dhtPeers[hash][peer.host] = 1;
      dhtPeers[hash]['found']++;
    }
  });
});

app.listen(3000, function () {
  console.log('Server has started, open in your browser http://localhost:3000');
});

function getFoundPeersNumber(hash) {
  var hash = hash.toLowerCase();
  if (dhtPeers[hash]) {
    return dhtPeers[hash]['found'];
  } else {
    if (debug) console.log('No peers found for ' + hash);
    return 0;
  }
}

function cleanPeerCache(hash) {
  delete dhtPeers[hash];
}

app.get('/alive.txt', function(req, res) {
  res.send("OK");
});

app.get('/dht-peers', function (req, res) {
  var hashes = req.query.hashcsv.split(",")

  async.map(hashes, function(hash, mapCallback) {
    var hash = hash.toLowerCase().trim();

    var dhtI = Math.floor(Math.random()*dhtClients.length);
    var dht = dhtClients[dhtI];

    dht.lookup(hash, function(error, peers) {
      if (error) {
        mapCallback(error);
      } else {
        console.log('Found ' + getFoundPeersNumber(hash) + ' peers for hash: ' + hash);
        var result = {'hash': hash, 'peers': getFoundPeersNumber(hash)};
        cleanPeerCache(hash);
        mapCallback(null, result);
      }
    });
  }, function(err, results) {
    if (debug) console.log(results);
    res.setHeader('Content-Type', 'application/json');

    if (err) {
      console.log(err);
    }

    if (!results) results = [];

    res.send(JSON.stringify(results));
  });
})