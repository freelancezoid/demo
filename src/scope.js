/**
 * Created by kiwi on 08/12/2016.
 */
/* jshint globalstrict: true */
'use strict';

function initWatchVal(){}

function Scope(){
    this.$$watchers = [];
}

Scope.prototype.$watch = function(watchFn,listenerFn){
    var watcher = {
        watchFn:watchFn,
        listenerFn: listenerFn || function(){},
        last: initWatchVal
    };
    this.$$watchers.push(watcher);
};

Scope.prototype.$$digestOnce = function(){
    var self = this;
    var newValue, oldValue, dirty;

    this.$$watchers.forEach(function(watcher){
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;
        if( newValue !== oldValue ){
            watcher.last = newValue;
            oldValue = (oldValue === initWatchVal) ? newValue : oldValue;
            watcher.listenerFn(newValue, oldValue, self);
            dirty = true;
        }
    });

    return dirty;
};

Scope.prototype.$digest = function(){
    var dirty;
    var ttl = 10;
    do{
        dirty = this.$$digestOnce();
        if(dirty && !(ttl--) ){
            throw "10 digest iteration reached";
        }
    }
    while(dirty);
};