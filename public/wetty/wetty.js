
var term;
var buf = '';
var socket;

function Wetty(argv) {
    if (!socket) {
        var params = [];
        for (var k in argv) {
            var v;
            if (typeof argv[k] === "object" || typeof argv[k] === "array") {
                v = encodeURIComponent(JSON.stringify(argv[k]));
            } else {
                v = argv[k];
            }
            params.push(k + "=" + v);
        }
        socket = io(location.origin, {
            path: "/wetty/socket.io",
            query: params.join("&")
        });
    }
    this._argv = argv;
    this.socket = socket;
    socket.on('connect', function () {
        lib.init(function () {
            hterm.defaultStorage = new lib.Storage.Local();
            term = new hterm.Terminal();
            window.term = term;
            term.decorate(document.getElementById('terminal'));

            term.setCursorPosition(0, 0);
            term.setCursorVisible(true);
            term.prefs_.set('ctrl-c-copy', true);
            term.prefs_.set('ctrl-v-paste', true);
            term.prefs_.set('use-default-window-copy', true);
            term.runCommandClass(WettyHtermConnector, document.location.hash.substr(1));
            socket.emit('resize', {
                col: term.screenSize.width,
                row: term.screenSize.height
            });

            if (buf && buf !== '') {
                term.io.writeUTF16(buf);
                buf = '';
            }
        });
    });
    socket.on('output', function (data) {
        if (!term) {
            buf += data;
            return;
        }
        term.io.writeUTF16(data);
    });

    socket.on('disconnect', function () {
        console.log("Socket.io connection closed");
    });
    socket.on("error", function(data){
        console.log("SOCKET IO ERROR", data);
    });
}

function WettyHtermConnector(argv) {
    this.argv_ = argv;
    this.io = null;
    this.pid_ = -1;
}
WettyHtermConnector.prototype.run = function () {
    this.io = this.argv_.io.push();

    this.io.onVTKeystroke = this.sendString_.bind(this);
    this.io.sendString = this.sendString_.bind(this);
    this.io.onTerminalResize = this.onTerminalResize.bind(this);
};

WettyHtermConnector.prototype.sendString_ = function (str) {
    socket.emit('input', str);
};

WettyHtermConnector.prototype.onTerminalResize = function (col, row) {
    socket.emit('resize', {col: col, row: row});
};
window.Wetty = Wetty;
