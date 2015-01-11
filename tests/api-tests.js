//- JavaScript source code

//- api-tests.js ~~
//
//  This file is a self-contained Node.js program that verifies the correctness
//  of a particular implementation of QMachine's HTTP API. This program does
//  not test the performance of the implementation under load.
//
//                                                      ~~ (c) SRW, 10 Jan 2015
//                                                  ~~ last updated 11 Jan 2015

(function () {
    'use strict';

 // Pragmas

    /*jshint maxparams: 2, quotmark: single, strict: true */

    /*jslint indent: 4, maxlen: 80, node: true */

    /*properties
        'Content-Length', 'Content-Type', data, end, error, exit,
        hasOwnProperty, headers, hostname, join, label, log, message, method,
        on, path, port, push, req, request, res, shift, statusCode, write
    */

 // Declarations

    var config, http, make_call, test;

 // Definitions

    config = {
        'hostname': 'localhost',
        'port': 8177
    };

    http = require('http');

    make_call = function (obj, callback) {
     // This function sends a single HTTP API call to the specified endpoint.
        var handler, options, req;
        handler = function (res) {
         // This function checks that the response matches what was expected.
            if (res.statusCode !== obj.res.statusCode) {
                throw new Error('status code mismatch (' +
                    res.statusCode + ' !== ' + obj.res.statusCode + ')');
            }
            var temp = [];
            res.on('data', function (chunk) {
             // This function accumulates the response data as it comes in.
                temp.push(chunk);
                return;
            });
            res.on('end', function () {
             // This function checks that the response data matches what was
             // expected.
                var data = temp.join('');
                if (data !== obj.res.data) {
                    throw new Error('data mismatch (' +
                        data + ' !== ' + obj.res.data + ')');
                }
                callback(null);
                return;
            });
            return;
        };
        options = {
            'hostname': config.hostname,
            'method': obj.req.method,
            'path': obj.req.path,
            'port': config.port
        };
        if (obj.req.hasOwnProperty('headers')) {
            options.headers = obj.req.headers;
        }
        req = http.request(options, handler).on('error', callback);
        if (obj.req.hasOwnProperty('data')) {
            req.write(obj.req.data);
        }
        req.end();
        return;
    };

    test = function (sequence) {
     // This function accepts arrays of objects that describe individual API
     // calls to be made. These calls will be made sequentially in FIFO order
     // by calling this function recursively from a callback function.
        var job = sequence.shift();
        if (job === undefined) {
            return;
        }
        make_call(job, function (err) {
         // This function is a callback function that will run `test` again
         // recursively.
            if (err !== null) {
                console.error(job.label + ': ' + err.message);
                process.exit(1);
                return;
            }
            test(sequence);
            return;
        });
        return;
    };

 // Out-of-scope definitions

    process.on('exit', function (code) {
     // This function always runs last, just before the program terminates.
        if (code === 0) {
            console.log('Success: all basic API tests passed.');
        } else {
            console.error('Exiting due to error ...');
        }
        return;
    });

 // Tests

    test([{
        'label': 'Simple test for the `get_avar` route',
        'req': {
            'method': 'GET',
            'path': '/box/simpletest?key=get_avar'
        },
        'res': {
            'data': '{}',
            'statusCode': 200
        }
    }]);

    test([{
        'label': 'Simple test for the `get_jobs` route',
        'req': {
            'method': 'GET',
            'path': '/box/simpletest?status=get_jobs'
        },
        'res': {
            'data': '[]',
            'statusCode': 200
        }
    }]);

    test([{
        'label': 'Simple test for the `set_avar` route',
        'req': {
            'data': '{"box":"simpletest","key":"set_avar","val":"ooga"}',
            'headers': {
                'Content-Length': 50,
                'Content-Type': 'application/json'
            },
            'method': 'POST',
            'path': '/box/simpletest?key=set_avar'
        },
        'res': {
            'data': '',
            'statusCode': 201
        }
    }]);

    test([{
        'label': 'Set a regular avar',
        'req': {
            'data': '{"box":"simpletest","key":"regular_avar","val":2}',
            'headers': {
                'Content-Length': 49,
                'Content-Type': 'application/json'
            },
            'method': 'POST',
            'path': '/box/simpletest?key=regular_avar'
        },
        'res': {
            'data': '',
            'statusCode': 201
        }
    }, {
        'label': 'Test the value of the regular avar that was just set',
        'req': {
            'method': 'GET',
            'path': '/box/simpletest?key=regular_avar'
        },
        'res': {
            'data': '{"box":"simpletest","key":"regular_avar","val":2}',
            'statusCode': 200
        }
    }]);

    test([{
        'label': 'GET requests must specify a "key" or a "status"',
        'req': {
            'method': 'GET',
            'path': '/box/justabox?'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'GET requests cannot specify both a "key" and a "status"',
        'req': {
            'method': 'GET',
            'path': '/box/toomanyparameters?key=hello&status=world'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'GET requests cannot specify both a "status" and a "key"',
        'req': {
            'method': 'GET',
            'path': '/box/sretemarapynamoot?status=hello&key=world'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'POST requests must specify a "key" in URL',
        'req': {
            'data': '{"box":"justabox","key":"abc123","val":2}',
            'headers': {
                'Content-Length': 41,
                'Content-Type': 'application/json'
            },
            'method': 'POST',
            'path': '/box/justabox?'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `set_avar` route, the body must not be empty',
        'req': {
            'method': 'POST',
            'path': '/box/emptybody?key=abc123'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `set_avar` route, "key" in body must match URL param',
        'req': {
            'data': '{"box":"justabox","key":"csharp","val":2}',
            'headers': {
                'Content-Length': 41,
                'Content-Type': 'application/json'
            },
            'method': 'POST',
            'path': '/box/mismatchedkeys?key=abc123'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `get_avar` route, "box" supports the expected characters',
        'req': {
            'method': 'GET',
            'path': '/box/ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
                    'abcdefghijklmnopqrstuvwxyz0123456789_-?key=deadbeef'
        },
        'res': {
            'data': '{}',
            'statusCode': 200
        }
    }]);

    test([{
        'label': 'In `get_jobs` route, "box" supports the expected characters',
        'req': {
            'method': 'GET',
            'path': '/box/ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
                    'abcdefghijklmnopqrstuvwxyz0123456789_-?status=waiting'
        },
        'res': {
            'data': '[]',
            'statusCode': 200
        }
    }]);

    test([{
        'label': 'In `set_avar` route, "box" supports the expected characters',
        'req': {
            'data': '{"box":"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrst' +
                    'uvwxyz0123456789_-","key":"abc123","val":2}',
            'headers': {
                'Content-Length': 97,
                'Content-Type': 'application/json'
            },
            'method': 'POST',
            'path': '/box/ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
                    'abcdefghijklmnopqrstuvwxyz0123456789_-?key=abc123'
        },
        'res': {
            'data': '',
            'statusCode': 201
        }
    }]);

    test([{
        'label': 'In `get_avar` route, "box" cannot contain a `.` character',
        'req': {
            'method': 'GET',
            'path': '/box/mongo.badness?key=deadbeef'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `get_jobs` route, "box" cannot contain a `.` character',
        'req': {
            'method': 'GET',
            'path': '/box/mongo.badness?status=waiting'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `set_avar` route, "box" cannot contain a `.` character',
        'req': {
            'data': '{"box":"mongo.badness","key":"abc123","val":2}',
            'headers': {
                'Content-Length': 46,
                'Content-Type': 'application/json'
            },
            'method': 'POST',
            'path': '/box/mongo.badness?key=abc123'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `get_avar` route, "box" cannot contain a `&` character',
        'req': {
            'method': 'GET',
            'path': '/box/param&badness?key=deadbeef'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `get_jobs` route, "box" cannot contain a `&` character',
        'req': {
            'method': 'GET',
            'path': '/box/param&badness?status=waiting'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `set_avar` route, "box" cannot contain a `&` character',
        'req': {
            'data': '{"box":"param&badness","key":"abc123","val":2}',
            'headers': {
                'Content-Length': 46,
                'Content-Type': 'application/json'
            },
            'method': 'POST',
            'path': '/box/param&badness?key=abc123'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `get_avar` route, "key" cannot contain a `.` character',
        'req': {
            'method': 'GET',
            'path': '/box/parambadness?key=abc.123'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `set_avar` route, "key" cannot contain a `.` character',
        'req': {
            'data': '{"box":"parambadness","key":"abc.123","val":2}',
            'headers': {
                'Content-Length': 46,
                'Content-Type': 'application/json'
            },
            'method': 'POST',
            'path': '/box/param&badness?key=abc.123'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `set_avar` route, "key" cannot contain a `&` character',
        'req': {
            'data': '{"box":"parambadness","key":"abc&123","val":2}',
            'headers': {
                'Content-Length': 46,
                'Content-Type': 'application/json'
            },
            'method': 'POST',
            'path': '/box/param&badness?key=abc&123'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

    test([{
        'label': 'In `get_jobs` route, "status" cannot contain a `.` character',
        'req': {
            'method': 'GET',
            'path': '/box/parambadness?status=still.waiting'
        },
        'res': {
            'data': '',
            'statusCode': 444
        }
    }]);

 // That's all, folks!

    return;

}());

//- vim:set syntax=javascript:
