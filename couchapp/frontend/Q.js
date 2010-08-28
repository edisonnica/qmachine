//- JavaScript source code

//- Q.js ~~
//  This mini-framework for "Quanah" requires only 'JSON' and 'curl' objects.
//                                                          ~~ SRW, 21 Jul 2010

if (!this.Q) {                          //- Check for the Q object's existence
    var Q = {};
}

(function () {                          //- Build inside an anonymous closure

//- PRIVATE MEMBERS

    var root = location.protocol + '//' + location.host + '/',
        db = root + 'app/',

        fresh_id = (function () {       //- Constructor for memoized function
            var ideal = 100,
                source = root + '_uuids?count=' + ideal,
                the_uuids = [],
                refill_uuids = function () {
                    if (the_uuids.length < ideal / 2) {
                        var msg = curl.GET(source),     //- AJAX will go here
                            latest = JSON.parse(msg);
                        the_uuids = the_uuids.concat(latest.uuids);
                    }
                };
            refill_uuids();
            return function (n) {       //- the "actual" function
                n = n || 1;
                var temp = the_uuids.splice(0,n);
                refill_uuids();
                return (n === 1) ? temp[0] : temp;
            };
        }()),

        author = (function () {
            var source = root + '_session',
                msg = JSON.parse(curl.GET(source));
            return msg.userCtx.name;
        }()),

        augment = function (branch, definition) {
            if (typeof Q[branch] !== 'function') {
                Q[branch] = definition;
            }
        },

        results = {
            "stdout":   [],
            "stderr":   []
        };

//- PUBLIC MEMBERS

    augment("print", function (msg) {   //- an all-purpose output function

        results.stdout.push(msg);

    });

    augment("up", function (obj) {      //- client --> cloud transfer

        var target = db + obj.id,
            source = JSON.stringify(obj),
            msg = curl.PUT(target, source);
            //msg = curl.PUT(target, source),
            //check = JSON.parse(msg);

        //if (check.ok === 'true') {
        //    obj.rev = check.rev;
        //    return obj;
        //} else {
        //    return check.error;
        //}
        return JSON.parse(msg);
    });

    augment("down", function (id) {     //- cloud --> client transfer

        var source = db + id,
            msg = curl.GET(source);

        return JSON.parse(msg);

    });

    augment("run", function (code) {    //- CLEARS RESULTS, then runs inline JS

        results.stdout.length = 0;      //- Sterilize the environment as much
        results.stderr.length = 0;      //  as possible before proceeding.

        try {                           //- Now, use a 'try/catch' statement
            eval(code);                 //  to evaluate the user's code and
        } catch (error) {               //  catch any exceptions that may have
            results.stderr.push(error); //  been thrown in the process.
        }
        return results;

    });

    augment("Doc", function (obj) {     //- Constructor for new CouchDB docs

        obj = obj || {};
        obj.id = obj.id || fresh_id(1);
        obj.name = author;

        var msg = Q.up(obj);

        if (msg.ok === 'false') {
            throw msg;
        }

        obj._rev = msg.rev;
        return obj;

    });

    augment("reval", function (func, argarray) {
        argarray = argarray || [];
        var id = fresh_id(),
            dQ = new Q.Doc({
                "id":  id,
                "code": '(' + func.toString() + ').apply(this, ' +
                            JSON.stringify(argarray) + ')'
            });
        Q.up(dQ);
        console.log('Waiting for response ...');
        while (!dQ.results) {
            dQ = Q.down(id);
        }
        return dQ.results.stdout;
    });

})();

if (this.console) {
    console.log("Welcome to the Quanah Lab :-)");
}

//- vim:set syntax=javascript:
