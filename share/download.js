//- JavaScript source code

//- download.js ~~
//
//  This is a quick Node.js script that was written to replace the need for
//  Curl as part of the build process for the QMachine project.
//
//                                                      ~~ (c) SRW, 07 Jul 2014
//                                                  ~~ last updated 02 Jan 2015

(function () {
    'use strict';

 // Pragmas

    /*jshint maxparams: 2, quotmark: single, strict: true */

    /*jslint indent: 4, maxlen: 80, node: true */

    /*properties
        argv, createWriteStream, error, exit, get, hasOwnProperty, headers,
        indexOf, join, length, location, message, networkInterfaces, on, parse,
        pipe, protocol, push, statusCode, writeFile
    */

 // Prerequisites

 // Declarations

    var download, fs, http, https, is_online, os, url;

 // Definitions

 /*
    download = function (src_url, dest_filename) {
     // This function was prettier because it used streaming, but it caused
     // problems with Make ...
        if (is_online() === false) {
            console.error('This computer is not online.');
            return process.exit(1);
        }
        var obj, outfile, protocol;
        obj = url.parse(src_url);
        outfile = fs.createWriteStream(dest_filename);
        if (obj.protocol === 'http:') {
            protocol = http;
        } else if (obj.protocol === 'https:') {
            protocol = https;
        } else {
            throw new Error('Unsupported protocol: "' + obj.protocol + '"');
        }
        protocol.get(src_url, function (response) {
         // This function needs documentation.
            if ([300, 301, 302, 303, 307].indexOf(response.statusCode) >= 0) {
                download(response.headers.location, dest_filename);
                return;
            }
            if ([200, 201].indexOf(response.statusCode) < 0) {
                throw new Error('Error ' + response.statusCode);
            }
            response.on('end', process.exit).pipe(outfile);
            return;
        }).on('error', function (err) {
         // This function needs documentation.
            console.error('Error:', err);
            return process.exit(1);
        });
        return;
    };
 */

    download = function (src_url, dest_file) {
     // This function needs documentation.
        if (is_online() === false) {
            console.error('This computer is not online.');
            return process.exit(1);
        }
        var obj, protocol;
        obj = url.parse(src_url);
        if (obj.protocol === 'http:') {
            protocol = http;
        } else if (obj.protocol === 'https:') {
            protocol = https;
        } else {
            throw new Error('Unsupported protocol: "' + obj.protocol + '"');
        }
        protocol.get(src_url, function (response) {
         // This function needs documentation.
            if ([300, 301, 302, 303, 307].indexOf(response.statusCode) >= 0) {
                download(response.headers.location, dest_file);
                return;
            }
            if ([200, 201].indexOf(response.statusCode) < 0) {
                throw new Error('Error ' + response.statusCode);
            }
            var temp = [];
            response.on('data', function (chunk) {
             // This function needs documentation.
                temp.push(chunk);
                return;
            });
            response.on('end', function () {
             // This function needs documentation.
                fs.writeFile(dest_file, temp.join(''), function (err) {
                 // This function needs documentation.
                    if (err !== null) {
                        throw err;
                    }
                    return process.exit();
                });
                return;
            });
            return;
        }).on('error', function (err) {
         // This function needs documentation.
            console.error('Error:', err.message);
            return process.exit(1);
        });
        return;
    };

    fs = require('fs');

    http = require('http');

    https = require('https');

    is_online = function () {
     // This function needs documentation.
        var key, x, y;
        x = os.networkInterfaces();
        y = [];
        for (key in x) {
            if ((x.hasOwnProperty(key)) && (key !== 'lo0')) {
                y.push(key);
            }
        }
        return (y.length > 0);
    };

    os = require('os');

    url = require('url');

 // Invocations

    download(process.argv[2], process.argv[3]);

 // That's all, folks!

    return;

}());

//- vim:set syntax=javascript:
