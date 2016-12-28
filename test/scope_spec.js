/**
 * Created by kiwi on 08/12/2016.
 */

/* jshint globalstrict: true */
/* global Scope: false*/

'use strict';

describe("Scope",function(){
    it("can be constructed and used as an object",function(){

        var scope = new Scope();
        scope.property = 1;

        expect(scope.property).toBe(1);
    });

    describe("digest",function(){

        var scope;

        beforeEach(function(){
            scope = new Scope();
        });

        it("call listener function of a watch on $digest call",function(){
            var watcherFn = function(){ return 'something as value'; };
            var listenerFn = jasmine.createSpy();
            scope.$watch(watcherFn,listenerFn);

            scope.$digest();

            expect(listenerFn).toHaveBeenCalled();

        });

        it("call the watch function with the scope as an argument",function(){
            var watcherFn = jasmine.createSpy();
            var listenerFn = function(){};

            scope.$watch(watcherFn,listenerFn);

            scope.$digest();

            expect(watcherFn).toHaveBeenCalledWith(scope);
        });

        it("call the listener function when the watched value changes",function(){
            scope.a = 'hello';
            var counter = 0;

            scope.$watch(
                function(scope){
                    return scope.a;
                },
                function(newValue, oldValue, scope){
                    counter++;
                }
            );

            expect(counter).toBe(0);

            scope.$digest();
            expect(counter).toBe(1);

            scope.$digest();
            expect(counter).toBe(1);

            scope.a+= ' world';
            expect(counter).toBe(1);

            scope.$digest();
            expect(counter).toBe(2);

        });

        it("call listener when watch value is undefined",function(){
            var counter = 0;

            scope.$watch(
                function(){
                    return scope.someValue;
                },
                function(newValue,oldValue,scope){
                    counter++;
                }
            );

            scope.$digest();
            expect(counter).toBe(1);

        });

        it("calls listener with new value as old value the first time ",function(){
            scope.someValue = "tanzania";
            var oldValueGiven;

            scope.$watch(
                function(scope){
                    return scope.someValue;
                },
                function(newValue, oldValue, scope){
                    oldValueGiven = oldValue;
                }
            );

            scope.$digest();
            expect(oldValueGiven).toBe(scope.someValue);
        });

        it("may have watchers that omit the listener function",function(){
            var watchFn = jasmine.createSpy().and.returnValue(123);
            scope.$watch(watchFn);

            scope.$digest();

            expect(watchFn).toHaveBeenCalled();
        });

        it("trigger chained watchers in the same digest",function(){
            scope.name = 'Jane';

            scope.$watch(
                function(scope){
                    return scope.nameUpper;
                },
                function(newValue,oldValue,scope){
                    if(newValue){
                        scope.initial = newValue.substring(0,1) + '.';
                    }
                }
            );

            scope.$watch(
                function(scope){
                    return scope.name;
                },
                function(newValue,oldValue,scope){
                    if(newValue){
                        scope.nameUpper =  newValue.toUpperCase();
                    }
                }
            );

            scope.$digest();
            expect(scope.initial).toBe('J.');

            scope.name = 'Bob';

            scope.$digest();
            expect(scope.initial).toBe('B.');

        });

        it("give up on the watches after 10 iterations",function(){
            scope.counterA = 0;
            scope.counterB = 0;

            scope.$watch(
                function(scope){
                    return scope.counterA;
                },
                function(newValue,oldValue,scope){
                    scope.counterB++;
                }
            );

            scope.$watch(
                function(scope){
                    return scope.counterB;
                },
                function(newValue,oldValue,scope){
                    scope.counterA++;
                }
            );

            expect((function(){ scope.$digest(); })).toThrow();

        });

        it('ends the digest when the last watch is clean',function(){
            scope.array = _.range(100);
            var watchExecutions = 0;

            _.times(100,function(i){
                scope.$watch(
                    function(scope){
                        watchExecutions++;
                        return scope.array[i];
                    },
                    function(newValue,oldValue,scope){}
                );
            });

            scope.$digest();
            expect(watchExecutions).toBe(200);

            scope.array[0] = "hello world";

            scope.$digest();
            expect(watchExecutions).toBe(301);
        });

        it("does not end digest so that new watches are not run",function(){
            scope.someValue = "hello !";
            scope.counter = 0;

            scope.$watch(
                function(scope){return scope.someValue;},
                function(newValue,oldValue,scope){

                    scope.$watch(
                        function(scope){return scope.someValue;},
                        function(newValue,oldValue,scope){
                            scope.counter++;
                        }
                    );

                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("compares based on values if enabled",function(){
            scope.data = {
                name: "boston"
            };
            scope.counter = 0;

            scope.$watch(
                function(scope){return scope.data;},
                function(){scope.counter++;},
                true
            );

            scope.$digest();
            expect(scope.counter).toBe(1);


            scope.data.lastname = "nia";
            scope.$digest();
            expect(scope.counter).toBe(2);

        });

        it("correctly handles NaNs",function(){
            scope.value = NaN;
            scope.counter = 0;

            scope.$watch(
                function(scope){return scope.value;},
                function(newValue,oldValue,scope){ scope.counter++;}
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);

        });

        it("execute $eval callback and returns it's value",function(){
            scope.value = 11;

            var value = scope.$eval(function(scope){
                return scope.value;
            })

            expect(value).toBe(scope.value);
        });

        it("passe the second argument of $eval to callback",function(){
            scope.test = 55;
            var value = scope.$eval(function(scope,arg){
                return scope.test + arg;
            },2);
            expect(value).toBe(57);
        });

        it("execute $apply callback and starts the digest",function(){
            scope.aValue = 15;
            scope.counter = 0;

            scope.$watch(
                function(scope){ return scope.aValue; },
                function(newValue,oldValue,scope){ scope.counter++; }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$apply(function(scope){
                scope.aValue = 16;
            });

            expect(scope.counter).toBe(2);
        });


        it("execute $evalAsync function later in the same cycle",function(){
            scope.message = "hello";
            scope.asyncEvaluated = false;
            scope.asyncEvaluatedImmediately = false;

            scope.$watch(
                function(scope){ return scope.message; },
                function(newValue,oldValue,scope){

                    scope.$evalAsync(function(scope){
                        scope.asyncEvaluated = true;
                    });

                    scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
                }
            );

            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
            expect(scope.asyncEvaluatedImmediately).toBe(false);
        });



    });


});