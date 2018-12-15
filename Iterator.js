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
        this.reqId = undefined;
    }

    start() {
        let self = this;
        let curTime = Date.now();
        let loop = function () {
            let newTime = Date.now();
            let elapsedSecond = (newTime - curTime) / 1000.0;

            curTime = newTime;
            self.behavior(self.amount * elapsedSecond / self.second);
            self.reqId = requestAnimationFrame(loop);
        };
        loop();
    }

    stop() {
        cancelAnimationFrame(this.reqId);
    }
}
