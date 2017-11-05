# REST server to get the number of DHT peers

This is a nodejs REST server that exposes one endpoint to get the number of DHT peers.

It support multiple lookups using a single HTTP call.
It does parallel calls with bittorrent-dht library that support parallel querying.

### Example call:

GET /dht-peers?hashcsv=infoHash1,infoHash2,infoHashN

### Response:

```json
[{"hash":"infoHash1","peers":54}, {"hash":"infoHash2","peers":22}, {"hash":"infoHashN","peers":33}]
```