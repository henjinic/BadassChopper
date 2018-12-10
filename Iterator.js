/*
    Iterator.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.11.26
*/
class Iterator {

    constructor(second, amount, behavior) {
        this.second = second;
        this.amount = amount;
        this.behavior = behavior;
    }

    start() {
        var second = this.second;
        var amount = this.amount;
        var behavior = this.behavior;
        var curTime = Date.now();

        var loop = function () {
            var newTime = Date.now();
            var elapsedSecond = (newTime - curTime) / 1000.0;

            curTime = newTime;
            behavior(amount * elapsedSecond / second);
            requestAnimationFrame(loop);
        };
        loop();
    }

    stop() {
        // for later use
    }
}
