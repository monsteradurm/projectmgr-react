const path = require("path");
const bodyParser = require('body-parser');
const fs = require('fs');
const port = 3000;
const express = require('express');
const httpProxy = require('http-proxy');
//const helmet = require('helmet')
const ejs = require('ejs');

const environment = {
    boxAppSettings: {
      clientID: 'jvlhdebgtb6bwuwpibbvi9cjzyr4us48',
      clientSecret: '0F5sTCB9fevzNzvy5zE8ckSpLlzNrDVh',
      appAuth: {
        publicKeyID: 'gvr6gbx5',
        privateKey: '-----BEGIN ENCRYPTED PRIVATE KEY-----\nMIIFDjBABgkqhkiG9w0BBQ0wMzAbBgkqhkiG9w0BBQwwDgQIGrxKFrBjIvkCAggA\nMBQGCCqGSIb3DQMHBAhE3HVp7qS7DgSCBMhrOAlp4G7psdPj2XlZN7564pbql1U7\nOKBTcgp1zeIArddDtpsxa7lCwj83ds8GAEV8AySMjQ2iGF3HyFO48eCYHQqUmfPs\n9UK6y6ud/pynqXFTOiucMwplHgG0YSPrvMVFBJdxd1nJUDyBmBJxfpAj8GI/ZEcb\nUheoXyNFJerBCdnkrajz1LEfDIWG1TEkjvlx+vrWc6oTMfF1GvRfKL+02ZaeqAX1\nfXOnLPyyFIpZWWlyR6bflAqqqTLr39lAz8X7ZeYFJRmz54jRLAnKvSpxw9fAaeSe\nl7r02mEFuvACsfksoVB17aTejGYicTjjm2yBwjtMR1mIfce8cuB0O9KI4BRjgwHg\nZMyBdwZGYUnBZjTS6YwUyrO5g5/hOrsDfvJ8rNYM7MQbQHt0BQw8YY/TQTsB2ghO\nP7AfzLaCAU70G8riFh24WPAM2+VymGV5c4gkUlng/9P1acbh/YuwBjkxP3NY4GBf\nqx+BNygigyzqHOKxzf8X6fFte15tB6QzTQNwDuuqkCs47Ot/HwJJNmobJ3dEWi9a\n/B9BMYlYOlsXlNkEiLmcO/lBLuwNgaJGo+DKW8YgNr2JHTqww1mYcC7b2XdkpIIr\nJjgqk7jjZ7d/t/hUXvxlMXaEHaj4X1I84PPmeu4BOl+uOVnC401TG2ndCFiN88QR\nLAefypAYNzDib/iK4cgyggd0HZVE+pmDwCIl3n7bEoxBTOCXNFDSrgtbSAUZkdEt\nQ303qAKl8JPeuxf+ToV2t2zEFjSHlQgNNX6lFNjHhztZnthuRcik1kAwEuWuktIM\nKzqk+mR9/+iG1EV5C46Nmp+9kjl8jt2+DgSvyJr1hrn8IV9iqv3wQoUKDB94DPBF\nyE+HrlwH2zmQ+SlrNyylZey0i5mLxDOmW2Lyf5kdbcudzlwrm/zwGGcGlaa5UHgr\n0feNOxqU/h6cgWpkNCE1ptgDeTqaNb6x4yCS+RESb6HvVg63RxeVzG46x2UwHTww\n/TOb+n2ISOnuxO1VF35Xk1IqAnKzIGlnm/779VXDwmKIT9QFaqzPQySWS5SAtTMW\n2B5sWM21BfKpOiOEC4L7Ut5C09JaiZAZTZtBlukOzM9qIycVZg9iI7aXnLSsi+tK\nngwJWiJnLOukpgl4+IvInVyrcxTLmzz5vU7WO+C8Y3tsHX9xqSrmM2Ci0Q5xpxp3\nhafhZSJDeXKxDbz17H6RII6SUA0e4T3CF56uiU1arc9x2CbbLkW7UGFFXepnmNm/\nKG9jyj8cXa32IgU2oCK6UYEAlO/xY8cCT2yno618ZuFMvgmRaKw3T4uukShO5FXv\nT4LvQm5EZ+k5Y3x5l7FybEjUWl1WVEHAVkjpgUuDEq2JqQWGNUscPGS/aSjECvwY\nnlV0jZ/Xoo/2/zwr3cYGt257qO2xdgeaS1bHackBTFOS6HBzNLaGJaVMMexMRZ9n\nfAacgcX27pxNxfvVPY54MkqJX1PCgivmBZk22kreMJrKdwoIGahgj6H7t7q32dux\ncREUWZUmWHQj2IUk0Gl9qFvtaR+zLk58Ck87Rrl+HL6Yd9g56CUq01JsrJQGxTnm\n4gErK4mOYLiIMIzQZmG2uiJlRh/gT6P8gIKBsvewX/Y0ElL984wFN4j1pTUTEdqf\n4co=\n-----END ENCRYPTED PRIVATE KEY-----\n',
        passphrase: 'fa61b902971a403d71f5146c304f1428'
      }
    },
    enterpriseID: '203146362'
  };

var proxy = httpProxy.createProxyServer({});
var app = express();
var util = require('util');

var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

const reStream = (proxyReq, req) => {
    if (!isEmpty(req.body)) {

        var bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
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
                changeOrigin: true,
                onProxyReq: (config["onProxyReq"] ? reStream : null),
                followRedirects: true,
                loglevel: "debug"
              });
        })
    });

    app.options('*', cors())
    app.use(cors());
    /*
    app.disable('x-powered-by');
    app.disable('x-xss-protection');
    app.disable('x-content-type-options');*/

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        /*console.log(req.headers);
        const csp = "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
        res.set("Content-Security-Policy", csp);*/
        next();
      });
      
    app.use(express.static(__dirname+'/build'));
    
    app.get('/video360', function(req, res) {
        const id = req.query.id;
        const SDK = require('box-node-sdk').getPreconfiguredInstance(environment);
        const client = SDK.getAppAuthClient('enterprise', environment.enterpriseID);
        client.files.getDownloadURL(id?.toString()).then(downloadURL => {
            fs.readFile(path.join(__dirname+'/build/valiant360/video360.html'), 'utf-8', (err, html) => {
                res.send(ejs.render(html.replace('__REVIEW_URL__', downloadURL)))
            });
        })
    })

    app.get('/Image360', function(req, res) {
        const id = req.query.id;
        const SDK = require('box-node-sdk').getPreconfiguredInstance(environment);
        const client = SDK.getAppAuthClient('enterprise', environment.enterpriseID);
        client.files.getDownloadURL(id?.toString()).then(downloadURL => {
            fs.readFile(path.join(__dirname+'/build/valiant360/image360.html'), 'utf-8', (err, html) => {
                res.send(ejs.render(html.replace('__REVIEW_URL__', downloadURL)))
            });
        })
    })

    app.get('*', function(req, res) {
      res.sendFile(path.join(__dirname+'/build/index.html'));
    });



    const server = app.listen(port, () => {
        console.log("projectmgr-react --> listening at: " + port)
    });
});