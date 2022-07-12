const path = require("path");
const bodyParser = require('body-parser');
const fs = require('fs');
const port = 3000;
const express = require('express');
const httpProxy = require('http-proxy');
const helmet = require('helmet')
var proxy = httpProxy.createProxyServer({});
var app = express();
var util = require('util');

var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

const cors = require('cors');

proxy.on('error', function(e) {
    console.log(e);
});


fs.readFile('proxy.conf.json', (err, data) => {
    if (err) throw err;
    var config = JSON.parse(data);

    //console.log(config);

    Object.keys(config).forEach(addr => {
        console.log("Setting proxy --> " + addr, '--> '+  config[addr].target);

        app.all(addr, (req, res) => {
            let arr = req.url.split('/');
            arr.splice(0, 2);

            req.url = '/' + arr.join('/');

            console.log(req.url);
            console.log(config[addr].target);

            proxy.on('error', err => { 
                console.error('proxyRequest', err)
            })

            proxy.web(req, res, {
                target: config[addr].target,
                https: true,
                changeOrigin: true
              });
        })
    });

    app.options('*', cors())
    app.use(cors());
    app.disable('x-powered-by');
    app.disable('x-xss-protection');
    app.disable('x-content-type-options');
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        console.log(req.headers);
        const csp = "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
        res.set("Content-Security-Policy", csp);
        next();
      });
      
    app.use(express.static(__dirname+'/build'));
    app.get('*', function(req, res) {
      res.sendFile(path.join(__dirname+'/build/index.html'));
    });

    const server = app.listen(port, () => {
        console.log("projectmgr-react --> listening at: " + port)
    });
    /*
    const io = require('socket.io')(server);

    io.on("connection", socket => {
        socket.on('test-message', (update) => {
            io.emit("test-message", update);
        });

        socket.on('send-issue-update', (update) => {
            io.emit('issue-update', update);
        })
        socket.on('send-boarditem-update', (update) => {

            io.emit('boarditem-update', update);
        });

        socket.on('send-board-update', (update) => {
            io.emit('board-update', update);
        });

        socket.on('send-syncketch-update', (update) => {
            io.emit('syncsketch-update', update);
        });

        socket.on('disconnect', () => {});
    });
    */
});