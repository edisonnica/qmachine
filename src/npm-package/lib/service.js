//- JavaScript source code

//- service.js ~~
//                                                      ~~ (c) SRW, 24 Nov 2012
//                                                  ~~ last updated 26 Mar 2013

(function () {
    'use strict';

 // Pragmas

    /*jslint indent: 4, maxlen: 80, node: true */

 // Declarations

    var cluster, collect_garbage, configure, corser, http, is_Function,
        katamari, log, spawn_workers, url, warn;

 // Definitions

    cluster = require('cluster');

    collect_garbage = function (f, options) {
     // This function needs documentation.
        if (cluster.isWorker) {
            return;
        }
        if (options.hasOwnProperty('gc_interval') === false) {
            throw new Error('WTF');
        }
        setInterval(f, options.gc_interval * 1000);
        return;
    };

    configure = require('./configure');

    corser = require('corser');

    http = require('http');

    is_Function = function (f) {
     // This function needs documentation.
        return ((typeof f === 'function') && (f instanceof Function));
    };

    katamari = require('./katamari');

    log = function () {
     // This function needs documentation.
        console.log.apply(console.log, arguments);
        return;
    };

    spawn_workers = function (n) {
     // This function needs documentation.
        var spawn_worker;
        spawn_worker = function () {
         // This function needs documentation.
            var worker = cluster.fork();
            worker.on('error', function (err) {
             // This function needs documentation.
                console.error(err);
                return;
            });
            worker.on('message', function (message) {
             // This function needs documentation.
                log(worker.pid + ':', message.cmd);
                return;
            });
            return worker;
        };
        if ((cluster.isMaster) && (n > 0)) {
            cluster.on('exit', function (prev_worker) {
             // This function needs documentation.
                var next_worker, output;
                next_worker = spawn_worker();
                log(prev_worker.pid + ':', 'RIP', next_worker.pid);
                return;
            });
            while (n > 0) {
                spawn_worker();
                n -= 1;
            }
        }
        return;
    };

    url = require('url');

    warn = function (lines) {
     // This function needs documentation.
        var text;
        text = lines.join(' ').replace(/([\w\-\:\,\.\s]{65,79})\s/g, "$1\n");
        console.warn('\n%s\n', text);
        return;
    };

 // Out-of-scope definitions

    exports.launch = function (obj) {
     // This function needs documentation.
        var config, defs, enable_cors, go_away, rules, server, static_content;
        config = configure(obj, {
            enable_api_server:  false,
            enable_CORS:        false,
            enable_www_server:  false,
            hostname:           '0.0.0.0',
            //log_server: {},
            max_http_sockets:   500,
            max_upload_size:    1048576,    //- 1024 * 1024 = 1 Megabyte
            persistent_storage: {
                avar_ttl:       86400,      //- expire avars after 24 hours
                gc_interval:    10          //- collect garbage every _ seconds
            },
            port:               8177,
            static_content:     'katamari.json',
            worker_procs:       0
        });
        if ((config.enable_api_server === false) &&
                (config.enable_www_server === false)) {
         // Exit early if the configuration is underspecified.
            warn(['No servers specified.']);
            return;
        }
        go_away = function (response) {
         // This function needs documentation.
            response.writeHead(444);
            response.end();
            return;
        };
        rules = [];
        if (config.enable_CORS === true) {
            enable_cors = corser.create({});
            server = http.createServer(function (request, response) {
             // This function needs documentation.
                log({
                    headers: request.headers,
                    ip: request.connection.remoteAddress,
                    method: request.method,
                    timestamp: new Date(),
                    url: request.url
                });
                enable_cors(request, response, function () {
                 // This function needs documentation.
                    var flag, i, n, params, rule, url;
                    flag = false;
                    n = rules.length;
                    url = request.url;
                    for (i = 0; (flag === false) && (i < n); i += 1) {
                        rule = rules[i];
                        if ((request.method === rule.method) &&
                                (rule.pattern.test(url))) {
                            flag = true;
                            params = url.match(rule.pattern).slice(1);
                            rule.handler(request, response, params);
                        }
                    }
                    if (flag === false) {
                        go_away(response);
                    }
                    return;
                });
                return;
            });
            rules.push({
                method:  'OPTIONS',
                pattern: /^\//,
                handler: function (request, response) {
                 // This function needs documentation.
                    response.writeHead(204);
                    response.end();
                    return;
                }
            });
        } else {
            server = http.createServer(function (request, response) {
             // This function needs documentation.
                log({
                    headers: request.headers,
                    ip: request.connection.remoteAddress,
                    method: request.method,
                    timestamp: new Date(),
                    url: request.url
                });
                var flag, i, n, params, rule, url;
                flag = false;
                n = rules.length;
                url = request.url;
                for (i = 0; (flag === false) && (i < n); i += 1) {
                    rule = rules[i];
                    if ((request.method === rule.method) &&
                            (rule.pattern.test(url))) {
                        flag = true;
                        params = url.match(rule.pattern).slice(1);
                        rule.handler(request, response, params);
                    }
                }
                if (flag === false) {
                    go_away(response);
                }
                return;
            });
        }
        if (config.enable_api_server === true) {
         // This part makes my eyes bleed, but it works really well.
            if (config.persistent_storage.hasOwnProperty('couch')) {
                defs = require('./defs-couch')(config.persistent_storage);
            } else if (config.persistent_storage.hasOwnProperty('mongo')) {
                if ((config.max_upload_size > 4194304) && (cluster.isMaster)) {
                    warn([
                        'WARNING: Older versions of MongoDB cannot save',
                        'documents greater than 4MB (when converted to BSON).',
                        'Consider setting a smaller "max_upload_size".'
                    ]);
                }
                defs = require('./defs-mongo')(config.persistent_storage);
            } else if (config.persistent_storage.hasOwnProperty('postgres')) {
                defs = require('./defs-postgres')(config.persistent_storage);
            } else if (config.persistent_storage.hasOwnProperty('redis')) {
                defs = require('./defs-redis')(config.persistent_storage);
            } else if (config.persistent_storage.hasOwnProperty('sqlite')) {
                if ((config.persistent_storage.sqlite === ':memory:') &&
                        (cluster.isMaster) && (config.worker_procs > 0)) {
                    warn([
                        'WARNING: In-memory SQLite databases do not provide',
                        'shared persistent storage because each worker will',
                        'create and use its own individual database. Thus,',
                        'you should expect your API server to behave',
                        'erratically at best.'
                    ]);
                }
                defs = require('./defs-sqlite')(config.persistent_storage);
            } else {
                throw new Error('No persistent storage was specified.');
            }
         // These are mainly here for debugging at the moment ...
            if (is_Function(defs.collect_garbage) === false) {
                throw new TypeError('No "collect_garbage" method is defined.');
            }
            if (is_Function(defs.get_box_key) === false) {
                throw new TypeError('No "get_box_key" method is defined.');
            }
            if (is_Function(defs.get_box_status) === false) {
                throw new TypeError('No "get_box_status" method is defined.');
            }
            if (is_Function(defs.post_box_key) === false) {
                throw new TypeError('No "post_box_key" method is defined.');
            }
            rules.push({
                method:  'GET',
                pattern: /^\/box\/([\w\-]+)\?key=([A-z0-9]+)$/,
                handler: function (request, response, params) {
                 // This function needs documentation.
                    var callback;
                    callback = function (err, results) {
                     // This function needs documentation.
                        if (err !== null) {
                            console.error(err);
                        }
                        if ((results === null) || (results === undefined)) {
                            results = '{}';
                        }
                        response.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        response.end(results);
                        return;
                    };
                    return defs.get_box_key(params, callback);
                }
            });
            rules.push({
                method:  'GET',
                pattern: /^\/box\/([\w\-]+)\?status=([A-z0-9]+)$/,
                handler: function (request, response, params) {
                 // This function needs documentation.
                    var callback;
                    callback = function (err, results) {
                     // This function needs documentation.
                        if (err !== null) {
                            console.error(err);
                        }
                        if ((results instanceof Array) === false) {
                            results = [];
                        }
                        response.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        response.end(JSON.stringify(results));
                        return;
                    };
                    return defs.get_box_status(params, callback);
                }
            });
            rules.push({
                method:  'POST',
                pattern: /^\/box\/([\w\-]+)\?key=([A-z0-9]+)$/,
                handler: function (request, response, params) {
                 // This function needs documentation.
                    var callback, headers, temp;
                    callback = function (err) {
                     // This function needs documentation.
                        if (err !== null) {
                            console.error(err);
                            return go_away(response);
                        }
                        response.writeHead(201, {
                            'Content-Type': 'text/plain'
                        });
                        response.end();
                        return;
                    };
                    headers = request.headers;
                    if (headers.hasOwnProperty('content-length')  === false) {
                        return callback('Missing "content-length" header');
                    }
                    if (headers['content-length'] > config.max_fu_size) {
                        return callback('Maximum file upload size exceeded');
                    }
                    temp = [];
                    request.on('data', function (chunk) {
                     // This function needs documentation.
                        temp.push(chunk.toString());
                        return;
                    });
                    request.on('end', function () {
                     // This function needs documentation.
                        var body, box, key, obj;
                        body = temp.join('');
                        box = params[0];
                        key = params[1];
                        try {
                            obj = JSON.parse(body);
                            if ((obj.box !== box) || (obj.key !== key)) {
                                throw new Error('Mismatched JSON properties');
                            }
                            if ((typeof obj.status === 'string') &&
                                    (/^[A-z0-9]+$/).test(obj.status)) {
                                params.push(obj.status);
                            }
                        } catch (err) {
                            return callback(err);
                        }
                        params.push(body);
                        return defs.post_box_key(params, callback);
                    });
                    return;
                }
            });
            collect_garbage(defs.collect_garbage, config.persistent_storage);
        }
        if (config.enable_www_server === true) {
            static_content = katamari.unroll(config.static_content);
            rules.push({
                method:  'GET',
                pattern: /^(\/[\w\-\.]*)/,
                handler: function (request, response, params) {
                 // This function needs documentation.
                    var headers, name, resource, temp;
                    headers = request.headers;
                    name = (params[0] === '/') ? '/index.html' : params[0];
                    if (static_content.hasOwnProperty(name) === false) {
                        return go_away(response);
                    }
                    resource = static_content[name];
                    if (headers.hasOwnProperty('if-modified-since')) {
                        try {
                            temp = new Date(headers['if-modified-since']);
                        } catch (err) {
                            return go_away(response);
                        }
                        if (resource.last_mod_date <= temp) {
                            response.writeHead(304, {
                                'Date': (new Date()).toGMTString()
                            });
                            response.end();
                            return;
                        }
                    }
                    response.writeHead(200, {
                        'Content-Type': resource.mime_type,
                        'Date': (new Date()).toGMTString(),
                        'Last-Modified': resource.last_modified
                    });
                    response.end(resource.buffer);
                    return;
                }
            });
        }
        if ((cluster.isMaster) && (config.worker_procs > 0)) {
            spawn_workers(config.worker_procs);
            server = null;
            return;
        }
        http.globalAgent.maxSockets = config.max_http_sockets;
        server.on('error', function (message) {
         // This function needs documentation.
            console.error('Server error:', message);
            return;
        });
        server.listen(config.port, config.hostname);
        log('QM up -> http://%s:%d ...', config.hostname, config.port);
        return;
    };

 // That's all, folks!

    return;

}());

//- vim:set syntax=javascript:
