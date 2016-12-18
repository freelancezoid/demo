/**
 * Created by kiwi on 08/12/2016.
 */
/* jshint globalstrict: true */
'use strict';

function initWatchVal(){}

function Scope(){
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
}

Scope.prototype.$watch = function(watchFn,listenerFn,valueEq){
    var watcher = {
        watchFn:watchFn,
        listenerFn: listenerFn || function(){},
        last: initWatchVal,
        valueEq:!!valueEq
    };
    this.$$watchers.push(watcher);
    this.$$lastDirtyWatch = null;
};

Scope.prototype.$$digestOnce = function(){
    var self = this;
    var newValue, oldValue, dirty;

    _.forEach(this.$$watchers,function(watcher){
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;
        if( !self.$$areEqual(newValue,oldValue,watcher.valueEq) ){
            self.$$lastDirtyWatch = watcher;
            watcher.last = watcher.valueEq ? _.cloneDeep(newValue):newValue ;
            oldValue = (oldValue === initWatchVal) ? newValue : oldValue;
            watcher.listenerFn(newValue, oldValue, self);
            dirty = true;
        }
        else if(watcher === self.$$lastDirtyWatch){
            return false;
        }

    });

    return dirty;
};

Scope.prototype.$digest = function(){
    var dirty;
    var ttl = 10;
    this.$$lastDirtyWatch = null;
    do{
        dirty = this.$$digestOnce();
        if(dirty && !(ttl--) ){
            throw "10 digest iteration reached";
        }
    }
    while(dirty);
};

Scope.prototype.$$areEqual = function(newValue,oldValue,valueEq){
    if(valueEq){
        return _.isEqual(newValue,oldValue);
    }
    else{
        return newValue === oldValue;
    }
}