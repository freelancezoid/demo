/**
 * Created by kiwi on 08/12/2016.
 */
/* jshint globalstrict: true */
/* global _: false */
'use strict';

function initWatchVal(){}

function Scope(){
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
    this.$$asyncQueue = [];
    this.$$phase = null;
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
    this.$beginPhase('$digest');
    do{
        while(this.$$asyncQueue.length){
            var asyncTask = this.$$asyncQueue.shift();
            asyncTask.scope.$eval(asyncTask.expression);
        }

        dirty = this.$$digestOnce();
        if( (dirty || this.$$asyncQueue.length)  && !(ttl--) ){
            this.$clearPhase();
            throw "10 digest iteration reached";
        }
    }
    while(dirty || this.$$asyncQueue.length);
    this.$clearPhase();
};


Scope.prototype.$$areEqual = function(newValue,oldValue,valueEq){
    if(valueEq){
        return _.isEqual(newValue,oldValue);
    }
    else{

        if( typeof newValue === 'number' &&
            typeof oldValue === 'number' &&
            isNaN(newValue) &&
            isNaN(oldValue) ){
            return true;
        }

        return newValue === oldValue;
    }
};

Scope.prototype.$eval = function(expr,locals){
    return expr(this,locals);
};

Scope.prototype.$apply = function(expression){
    this.$beginPhase('$apply');
    try {
        return this.$eval(expression);
    } finally {
        this.$clearPhase();
        this.$digest();
    }
};

Scope.prototype.$evalAsync = function (expression) {
    var self = this;
    if(!self.$$phase && !self.$$asyncQueue.length){
        setTimeout(function(){
            if(self.$$asyncQueue.length){
                self.$digest();
            }
        },0);
    }
    self.$$asyncQueue.push({scope:self,expression:expression});
};

Scope.prototype.$beginPhase = function(phase){
    if(this.$$phase !== null){
        throw this.$$phase + " is already in progress";
    }
    this.$$phase = phase;
};

Scope.prototype.$clearPhase = function(){
    this.$$phase = null;
};

