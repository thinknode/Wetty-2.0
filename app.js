var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');
var server = require('socket.io');
var pty = require('pty.js');
var fs = require('fs');
var uuid = require('node-uuid');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec;

var opts = require('optimist').options({
    sslkey: {
        demand: false,
        description: 'path to SSL key'
    },
    sslcert: {
        demand: false,
        description: 'path to SSL certificate'
    },
    sshhost: {
        demand: false,
        description: 'ssh server host'
    },
    sshport: {
        demand: false,
        description: 'ssh server port'
    },
    sshuser: {
        demand: false,
        description: 'ssh user'
    },
    sshauth: {
        demand: false,
        description: 'defaults to "password", you can use "publickey,password" instead'
    },
    port: {
        demand: false,
        default: 3000,
        alias: 'p',
        description: 'wetty listen port'
    }
}).boolean('allow_discovery').argv;

var sshOpts = {
    port: 22,
    host: "localhost",
    auth: "password",
    user: ""
};

var runhttps;

if (opts.sshport) {
    sshOpts.port = opts.sshport;
}

if (opts.sshhost) {
    sshOpts.host = opts.sshhost;
}

if (opts.sshauth) {
    sshOpts.auth = opts.sshauth;
}

if (opts.sshuser) {
    sshOpts.user = opts.sshuser;
}

if (opts.sslkey && opts.sslcert) {
    runhttps = true;
    opts['ssl'] = {};
    opts.ssl['key'] = fs.readFileSync(path.resolve(opts.sslkey));
    opts.ssl['cert'] = fs.readFileSync(path.resolve(opts.sslcert));
}

opts.connectionType = process.getuid() === 0 ? "login" : "ssh";

process.on('uncaughtException', function (e) {
    console.error('Error: ' + e);
});

var httpserv;
var app = express();
app.get('/wetty/ssh/:user', function (req, res) {
    res.sendfile(__dirname + '/public/wetty/index.html');
});
app.use('/', express.static(path.join(__dirname, 'public')));

if (runhttps) {
    httpserv = https.createServer(opts.ssl, app).listen(opts.port, function () {
        console.log('https on port ' + opts.port);
    });
} else {
    httpserv = http.createServer(app).listen(opts.port, function () {
        console.log('http on port ' + opts.port);
    });
}

var io = server(httpserv, {path: '/wetty/socket.io'});
io.use(function (socket, next) {
    if (socket.handshake.query.connectionType) {
        socket.connectionType = socket.handshake.query.connectionType;
    } else {
        socket.connectionType = opts.connectionType;
    }
    if (socket.handshake.query.ssh) {
        if (!socket.sshOpts) {
            socket.sshOpts = sshOpts;
        }
        var sshQueryOpts = JSON.parse(socket.handshake.query.ssh);
        if (sshQueryOpts.auth !== "publickey" && sshQueryOpts.auth !== "password") {
            throw new Error("auth must be publickey or password");
        }

        if (sshQueryOpts.auth === "publickey" && (!sshQueryOpts.identityRSA || !sshQueryOpts.user)) {
            throw new Error("No identityRSA or user provided");
        } else {
            socket.sshOpts.auth = sshQueryOpts.auth;
            var buf = new Buffer(sshQueryOpts.identityRSA, "base64");
            socket.sshOpts.identityRSA = buf.toString("utf8");
            socket.sshOpts.user = sshQueryOpts.user;
        }
    }

    next();

});
io.on('connection', function (socket) {
    var sshuser = '';
    var request = socket.request;
    var identityDir = process.env.HOME + "/.ssh/wetty";
    var identityFile;
    var connectionUUID = uuid.v4(null, new Buffer(16), 0).toString("hex");
    var deletedIdentity = false;
    console.log((new Date()) + ' Connection accepted.');
    if ((match = request.headers.referer.match('/wetty/ssh/.+$'))) {
        sshuser = match[0].replace('/wetty/ssh/', '') + '@';
    } else if (socket.sshOpts.user) {
        sshuser = socket.sshOpts.user + '@';
    }

    var term;
    if (socket.connectionType === "login") {
        term = pty.spawn('/bin/login', [], {
            name: 'xterm-256color',
            cols: 80,
            rows: 30
        });
    } else {
        var sshArgs = [];

        if (socket.sshOpts.auth === "publickey") {
            identityDir = identityDir + "/" + connectionUUID;
            identityFile = identityDir + "/id_rsa";
            mkdirp.sync(identityDir);
            fs.writeFileSync(identityFile, socket.sshOpts.identityRSA, {mode: "0600"});
            socket.identityFile = identityFile;
            socket.identityDir = identityDir;
            sshArgs.push("-i");
            sshArgs.push(identityFile);
        }

        sshArgs.push("-p");
        sshArgs.push(socket.sshOpts.port);
        sshArgs.push("-o");
        sshArgs.push("PreferredAuthentications=" + socket.sshOpts.auth);
        sshArgs.push(sshuser + socket.sshOpts.host);

        term = pty.spawn('ssh', sshArgs, {
            name: 'xterm-256color',
            cols: 80,
            rows: 30
        });
        term.connectionUUID = connectionUUID;
        if (socket.sshOpts.auth === "publickey" && socket.identityDir) {
            // Delete the private key from the server 30 seconds after the session has been created
            setTimeout(function () {
                if (deletedIdentity === false) {
                    exec("rm -r " + socket.identityDir, function (err, stdout, stderr) {
                        if (err) {
                            throw err;
                        }
                        deletedIdentity = true;
                    });
                }
            }, 30000);

        }
    }

    console.log((new Date()) + " PID=" + term.pid + " STARTED on behalf of user=" + sshuser + socket.sshOpts.host);
    term.on('data', function (data) {
        socket.emit('output', data);
    });
    term.on('exit', function (code) {
        console.log((new Date()) + " PID=" + term.pid + " ENDED");
        if (socket.sshOpts.auth === "publickey" && deletedIdentity === false) {
            exec("rm -r " + socket.identityDir, function (err, stdout, stderr) {
                if (err) {
                    throw err;
                }
                deletedIdentity = true;
            });
        }
    });
    socket.on('resize', function (data) {
        term.resize(data.col, data.row);
    });
    socket.on('input', function (data) {
        term.write(data);
    });
    socket.on('disconnect', function () {
        term.end();
    });
    socket.on("error", function (data) {
        console.log("error", data);
    });
});
