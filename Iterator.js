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
        this.isStarted = false;
    }

    start() {
        let self = this;
        let curTime = Date.now();
        let loop = function () {
            let newTime = Date.now();
            let elapsedSecond = (newTime - curTime) / 1000.0;

            curTime = newTime;
            self.behavior(self.amount * elapsedSecond / self.second);
            if (self.isStarted) {
                requestAnimationFrame(loop);
            }
        };
        self.isStarted = true;
        loop();
    }

    stop() {
        this.isStarted = false;
    }
}
