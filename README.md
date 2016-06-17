Wetty = Web + tty + query params
-----------------

This is a fork of the Wetty project created by (krishnasrinivas/wetty)[https://github.com/krishnasrinivas/wetty] 
which contains enhancements to support query parameters on the socket.io connection to the server. 
This is useful for connecting with a publickey where the client defines the private RSA/DSA key that the 
server is supposed to use to ssh to the specified host. Another notable change to this Wetty project from the original
is the ability to invoke the socket.io connection to the server via the Wetty constructor, as a opposed to before, 
where the mere inclusion of the Wetty client source code would invoke a connection to the server.


Install
-------

*  `git clone https://github.com/thinknode/wetty`

*  `cd wetty`

*  `npm install`


Client Side:
-------------------

The Wetty server will respond with client side javascript source code which will contain the client side
connection class called Wetty. The Wetty class is attached to the window object in your browser which you can gain access
to in order to invoke it at any time. The Wetty constructor accepts a single argument of type object or undefined. 

Argument properties:
1. (string) connectionType (default:ssh) - should be ssh or login
2. (object) ssh (default:none) - contains information about private keys and user being connected
3. (string) ssh.auth (default:password) - should be publickey or password
4. (Buffer) ssh.identityRSA (default:none)- A buffer of the private RSA/DSA key that will be used to authenticate access to the server
5. (string) ssh.user (default:none) - The user which will be sshing into the server

Example:
Executed this code once Wetty client source code has been injected to your page. 

`new window.Wetty({
        ssh: {
            auth: "publickey",
            identityRSA: new Buffer("private key rsa"),
            user: "myuser"
        },
        connectionType: "ssh"
    });`


Run on HTTP:
-----------

    grunt start

If you run it as root it will launch `/bin/login` (where you can specify
the user name), unless you explicitly request an ssh session via query parameters on connection to the server.

Every other user will default to use an ssh session, though you can override this behavior once again with query parameters.


If instead you wish to connect to a remote host you can specify the
`--sshhost` option, the SSH port using the `--sshport` option and the
SSH user using the `--sshuser` option.

You can also specify the SSH user name in the address bar like this:

  `http://yourserver:3000/wetty/ssh/<username>`

Run on HTTPS:
------------

Always use HTTPS! If you don't have SSL certificates from a CA you can
create a self signed certificate using this command:

  `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 30000 -nodes`

And then run:

    grunt start --sslkey key.pem --sslcert cert.pem
