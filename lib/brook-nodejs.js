var Namespace = require('../lib/namespace.js');
/**
@fileOverview brook
@author daichi.hiroki<hirokidaichi@gmail.com>
*/


/**
@name brook
@namespace brookライブラリ群のルートとなる名前空間です。promiseの生成処理を持っています。
*/
Namespace('brook').define(function(ns){
    var VERSION = "0.01";
    /**
     * @class brook.promiseで生成されるインスタンスのインナークラス
     * @name _Promise
     * @memberOf brook
     * @description
     * 実行する前の次の処理をもつオブジェクトです。
     * Promiseインスタンスはbind関数で結合する事が出来ます。連続した非同期/同期の処理をデータの流れとして抽象化して結合する事が出来ます。
     * subscribe/forEach/runなどの処理を実行するまでは、結合した処理は実行される事はありません。
     * また、コンストラクタは公開されていません。brook.promiseがファクトリとなっています。
     */
    var Promise = function(next){
        this.next = next ||  function(next,val){ return next(val); };
    };
    (function(proto){
    /**#@+
     * @methodOf brook._Promise.prototype
     */

    /**
     * @name concat
     * @param {Promise} promise
     */
    proto.concat = function(after){
        var _before = this;
        var next    = function(n,val){
            return _before.subscribe( after.ready(n),val);
        };
        return new Promise(next);
    };
    /**
     * @name bind
     * @param {Promise} promise
     */
    proto.bind = function(){
        var r = this;
        for( var i = 0,l = arguments.length;i<l;i++){
            var s = arguments[i];
            s = ( s instanceof Promise) ? s : promise( s );
            r = r.concat( s );
        }
        return r;
    };
    /**
     * @name ready
     * @param {Promise} promise
     */
    proto.ready = function(n){
        var promise = this;
        return function(val){
            return promise.subscribe(n,val);
        };
    };
    /**
     * @name run
     * @param {Promise} promise
     */
    proto.run = function(val){
        this.subscribe( undefined , val );
    };
    /**
     * @name subscribe
     * @param {Promise} promise
     */
    proto.subscribe = function(next,val){
        var next = next ? next : function(){};
        if( !this.errorHandler )
            return this.next(next,val);
        
        try {
            this.next(next,val);
        }
        catch(e){
            this.onError(e);
        }
    };
    /**
     * @name forEach
     * @param {Promise} promise
     */
    proto.forEach = proto.subscribe;
    /**
     * @name setErrorHandler
     * @param {Promise} promise
     */
    proto.setErrorHandler = function(promise){
        this.errorHandler = promise;
    };
    /**
     * @name onError
     */
    proto.onError = function(e){
        (this.errorHandler||new Promise).subscribe(function(){},e);
    };
    /**#@-*/
    })(Promise.prototype);
    /**
     * @name promise
     * @function
     * @memberOf brook
     * @param {function} next
     * @return {Promise}
     * @description
     * プロミスを生成するファクトリメソッドです。nextは、さらに次の処理を第一引数に受け取り、第二引数に前回の処理の結果を受け取ります。
     * 引数が無い場合は、データをそのまま次の処理に送るpromiseを生成します。
     * @example
     * var p = ns.promise(function(next,value){ next(value+1)});
     * @example
     * var p = ns.promise();
     */
    var promise = function(next){return new Promise(next)};
    ns.provide({
        promise : promise,
        VERSION : VERSION
    });
});

/**
@fileOverview brook.util
@author daichi.hiroki<hirokidaichi@gmail.com>
*/


/**
@name brook.util
@namespace details here
*/
Namespace('brook.util')
.use('brook promise')
.define(function(ns){
    /**#@+
     * @methodOf brook.util
     */
    /**
     * @name mapper
     * @param {Promise} promise
     */
    var mapper = function(f){
        return ns.promise(function(next,val){
            return next(f(val));
        });
    };
    /**
     * @name through
     * @param {Promise} promise
     */
    var through = function(f){
        return ns.promise(function(next,val){
            f(val);
            return next(val);
        });
    };
    /**
     * @name filter
     * @param {Promise} promise
     */
    var filter = function(f){
        return ns.promise(function(next,val){
            if( f(val) ) return next(val);
        });
    };
    /**
     * @name takeBy
     */
    var takeBy = function(by){
        var num = 1;
        var queue = [];
        return ns.promise(function(next,val){
            queue.push( val );
            if( num++ % (by) ==0){
                next(queue);
                queue = [];
            }
        });
    };
    var now = Date.now ? function() { return Date.now(); }
                       : function() { return +new Date(); };
    var _arrayWalk = function(list,func,limit) {
        var index = 0, length = list.length;
        (function() {
            var startTime = now();
            while (length > index && limit > (now() - startTime))
                func(list[index++]);

            if (length > index) 
                setTimeout(arguments.callee, 10);
        })();
    };
    /**
     * @name scatter
     */
    var scatter = function(limit){
        return ns.promise(function(next,list){
            _arrayWalk(list,next,(limit || 400));
        });
    };
    /**
     * @name wait
     */
    var wait = function(msec){
        var msecFunc = ( typeof msec == 'function' )
            ? msec : function(){return msec};
        return ns.promise(function(next,val){
            setTimeout(function(){
                next(val);
            },msecFunc());
        });
    };
    var waitUntil = function(f){
        var p = function(next,val){
            if( f() ){
                return next(val);
            }
            setTimeout(function(){ p(next,val)},100);
        };
        return ns.promise(p);
    };
    var debug = function(sig){
        var sig = sig ? sig : "debug";
        return through(function(val) {
            console.log(sig + ":",val);
        });
    };
    var cond = function(f,promise){
        return ns.promise(function(next,val){
            if( !f(val) )
                return next( val );
            promise.subscribe(function(val){
                return next( val );
            },val);
        });
    };
    var match = function(dispatchTable){
        return ns.promise(function(next,val){
            var promise = dispatchTable[val] || dispatchTable['__default__'] || ns.promise();
            promise.subscribe(function(v){
                next(v);
            },val);
        });
    };
    var LOCK_MAP = {};
    var unlock = function(name){
        return ns.promise(function(next,val){
            LOCK_MAP[name] = false;
            next(val);
        });
    };
    var lock = function(name){
        var tryLock = (function(next,val){
            if( !LOCK_MAP[name] ){
                LOCK_MAP[name] = true;
                return next(val);
            }
            setTimeout(function(){
                tryLock(next,val);
            },100);
        });
        return ns.promise(tryLock);
    };
    var from = function(value){
        if( value.observe ){
            return ns.promise(function(next,val){
                value.observe(ns.promise(function(n,v){
                    next(v);
                }));
            });
        }
        return ns.promise(function(next,val){
            next(value);
        });
    };
    var EMIT_INTERVAL_MAP = {};
    var emitInterval = function(msec, name){
        var msecFunc = ( typeof msec == 'function' )
            ? msec : function(){return msec};

        return ns.promise(function(next,val){
            var id = setInterval(function(){
                next(val);
            },msecFunc());
            if (name) {
                EMIT_INTERVAL_MAP[name] = id;
            }
        });
    };
    var stopEmitInterval = function(name) {
        return ns.promise(function(next, value) {
            clearInterval(EMIT_INTERVAL_MAP[name]);
            next(value);
        });
    };
    /**#@-*/
    ns.provide({
        mapper  : mapper,
        through : through,
        filter  : filter,
        scatter : scatter,
        takeBy  : takeBy,
        wait    : wait,
        cond    : cond,
        match   : match,
        debug   : debug,
        lock    : lock,
        unlock  : unlock,
        from    : from,
        waitUntil : waitUntil,
        emitInterval: emitInterval,
        stopEmitInterval: stopEmitInterval
    });
});




Namespace()
.use('brook *')
.use('brook.util *')
.apply(function(ns){
module.exports = ns;
});
