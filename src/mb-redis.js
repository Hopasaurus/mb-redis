

// mountebank style impostor for redis.

// make a tcp server
// parse the redis protocol  (partial parse, just enough to chop a stream into parts)
// do the mountebank dance
//   send request and await instructions
//     respond with the mock response or
//     forward to real server and wait for response or
//     drop connection.

const net = require('net');

const port = 6379;
const host = 'localhost';


// next objective is to make a simple proxy
// just forward all connections/data to and from the real deal.
// next step will be to convert to rxjs.

const server = net.createServer((c) => {
    console.log('client connected');
    const proxy = net.createConnection(port, host);

    proxy.on('data', (data) => {
        console.log('got data from the proxy');
        c.write(data);
    });
    proxy.on('end', () => {
        console.log('proxied server ended connection.');
        //c.end();
    });
    proxy.on('error', (error) => {
        throw error;
    });

    c.on('data', (data) => {
        console.log('got data from the client');
        proxy.write(data);
    });
    c.on('end', () => {
        console.log('client disconnected');
        //proxy.close();
    });
});
server.on('error', (err) => {
    throw err;
});
server.listen(6378, () => {
    console.log('server bound');
});


/*
Turn the connections themselves into an Observable
var connections = Rx.Observable.fromEvent(server, 'connection',
    socket => new JsonSocket(socket));

connections
//flatten the messages into their own Observable
    .flatMap(socket => {
        return Rx.Observable.fromEvent(socket.__socket, 'message')
        //Handle the socket closing as well
            .takeUntil(Rx.Observable.fromEvent(socket.__socket, 'close'));
    }, (socket, msg) => {
        //Transform each message to include the socket as well.
        return { socket : socket.__socket, data : msg};
    })
    .subscribe(processData, handleError);

 */

