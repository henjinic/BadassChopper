/*
    BadassChopperSimulation.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.12.10
*/
function main() {
    let simulator = new ChopperSimulator(document.getElementById('webgl'));

    simulator.keypressOn();
    simulator.rotorOn();

    simulator.start();
};


class ChopperSimulator {

    constructor(canvas) {
        this.W = canvas.width;
        this.H = canvas.height;
        this.rm = new RenderingManager(canvas);
        this.view = new View(0, 0, this.W, this.H);
        this.ground = new Terrain('https://raw.githubusercontent.com/henjinic/BadassChopper/master/img/yorkville.jpg');
        this.chopper = new Chopper();
        this._init();
    }

    _init() {
        this.chopper.up(1.0);
        this.rm.addView(this.view);
        this.rm.addCompo(this.ground.component);
        this.rm.addCompo(this.chopper.body);
        this.rm.addCompo(this.chopper.rotor1);
        this.rm.addCompo(this.chopper.rotor2);
        this.rm.addLight(new DirectionalLight(
            [5.0, -5.0, 5.0],
            new Array(3).fill(0.05),
            new Array(3).fill(0.2),
            new Array(3).fill(0.2)
        ));
    }

    start() {
        let self = this;
        let total = 0.0;
        new Iterator(1.0, 80.0, function(amount) {
            total += amount;
            if (total >= 1.0) {
                self.rm.draw();
                total = 0.0;
            }
        }).start();
    }

    keypressOn() {
        let self = this;
        document.onkeydown = function(event) {
            switch (event.key) {
                case 'ArrowLeft':  event.shiftKey ? self.view.rotateView(-5.0, View.Z_AXIS) : self.chopper.clockwise(10.0);       break;
                case 'ArrowRight': event.shiftKey ? self.view.rotateView(5.0, View.Z_AXIS) : self.chopper.counterclockwise(10.0); break;
                case 'ArrowUp':    event.shiftKey ? self.view.rotateView(-5.0, self.view.horizAxis) : self.chopper.forward(0.05); break;
                case 'ArrowDown':  event.shiftKey ? self.view.rotateView(5.0, self.view.horizAxis) : self.chopper.backward(0.05); break;
                case 'A': case 'a': self.chopper.up(0.05);    break;
                case 'Z': case 'z': self.chopper.down(0.05);  break;
                case '=': case '+': self.view.zoomView(0.2);  break;
                case '-': case '_': self.view.zoomView(-0.2); break;
                case ' ': self._shootGlowingBullet();         break;
            }
        };
    }

    _shootGlowingBullet() {
        if (Bullet.num < 5) {
            let bullet = new Bullet(this.chopper.body.position);
            bullet.compoId = this.rm.addCompo(bullet.component);
            bullet.lightId = this.rm.addLight(bullet.light);

            let velocity = this.chopper.body.direction.slice();
            velocity[2] += 1.0;
            velocity = velocity.map(x => x * 3.0);
            bullet.shoot(velocity, this.rm);
        }
    }

    keypressOff() {
        document.onkeydown = null;
    }

    rotorOn() {
        let self = this;
        this.iterator = new Iterator(1.0, 200.0, function(amount) {
            self.chopper.rotor1.rotateZ(amount);
            self.chopper.rotor2.rotateZ(amount);
        });
        this.iterator.start();
    }
}


class Terrain {

    constructor(path) {
        const SIZE = 256.0;
        const GAP = 1.0 / SIZE;
        let coords = [];
        let indices = [];
        let num = 0;
        let sx, sy;

        for (let col = 0; col < SIZE; col++) {
            for (let row = 0; row < SIZE; row++, num += 4) {
                sx = row / SIZE;
                sy = col / SIZE;
                coords.push(sx, sy, sx, sy + GAP, sx + GAP, sy + GAP, sx + GAP, sy);
                indices.push(num, num + 1, num + 2, num, num + 2, num + 3);
            }
        }
        this.component = new TerrainComponent(coords, indices, path);
    }
}


class Bullet {

    constructor(position) {
        this.component = new ColoredComponent([
            0.1, 0.1, 0.1,  -0.1, 0.1, 0.1,  -0.1,-0.1, 0.1,   0.1,-0.1, 0.1,
            0.1, 0.1, 0.1,   0.1,-0.1, 0.1,   0.1,-0.1,-0.1,   0.1, 0.1,-0.1,
            0.1, 0.1, 0.1,   0.1, 0.1,-0.1,  -0.1, 0.1,-0.1,  -0.1, 0.1, 0.1,
           -0.1, 0.1, 0.1,  -0.1, 0.1,-0.1,  -0.1,-0.1,-0.1,  -0.1,-0.1, 0.1,
           -0.1,-0.1,-0.1,   0.1,-0.1,-0.1,   0.1,-0.1, 0.1,  -0.1,-0.1, 0.1,
            0.1,-0.1,-0.1,  -0.1,-0.1,-0.1,  -0.1, 0.1,-0.1,   0.1, 0.1,-0.1
        ], [
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0
        ], [
             0, 1, 2,   0, 2, 3,
             4, 5, 6,   4, 6, 7,
             8, 9,10,   8,10,11,
            12,13,14,  12,14,15,
            16,17,18,  16,18,19,
            20,21,22,  20,22,23
        ]);
        this.component.scale(0.2, 0.2, 0.2);
        this.component.setLocalCoordToWorldCoord();
        this.component.move(...position);
        this.light = new PointLight(
            position,
            new Array(3).fill(0.0),
            new Array(3).fill(0.3),
            new Array(3).fill(0.1)
        );
        Bullet.num += 1;
    }

    move(dx, dy, dz) {
        this.component.move(dx, dy, dz);
        this.light.move(dx, dy, dz);
    }

    shoot(velocity, rm) {
        let self = this;
        const G = -9.8;
        const STEP_SIZE = 0.02;
        let total = 0.0;
        let iterator = new Iterator(1.0, 1.0, function(amount) {
            total += amount;
            if (total >= STEP_SIZE) {
                self.move(velocity[0] * STEP_SIZE, velocity[1] * STEP_SIZE, velocity[2] * STEP_SIZE);
                if (self.component.position[2] < 0.0) {
                    iterator.stop();
                    rm.delCompo(self.compoId);
                    rm.delLight(self.lightId);
                    Bullet.num -= 1;
                }
                // velocity[0] += 0 * STEP_SIZE;
                // velocity[1] += 0 * STEP_SIZE;
                velocity[2] += G * STEP_SIZE;
                total = 0.0;
            }
        });
        iterator.start();
    }
}
Bullet.num = 0; // static member variable


class Chopper {

    constructor() {
        this.body = this._createBody();
        this.rotor1 = this._createRotor();
        this.rotor2 = this._createRotor();
        this.height = 0.0;

        this.body.scale(0.7, 0.8, 0.5);
        this.rotor1.scale(3.0, 0.1, 0.1);
        this.rotor2.scale(0.1, 3.0, 0.1);
        this.rotor1.moveZ(0.6);
        this.rotor2.moveZ(0.6);

        this.body.setLocalCoordToWorldCoord();
        this.rotor1.setLocalCoordToWorldCoord();
        this.rotor2.setLocalCoordToWorldCoord();

        this.body.addChild(this.rotor1);
        this.body.addChild(this.rotor2);
    }

    forward(distance) {
        this.body.moveY(distance);
    }

    backward(distance) {
        this.body.moveY(-distance);
    }

    clockwise(angle) {
        this.body.rotateZ(angle);
        this.rotor1.rotateZ(-angle);
        this.rotor2.rotateZ(-angle);
    }

    counterclockwise(angle) {
        this.body.rotateZ(-angle);
        this.rotor1.rotateZ(angle);
        this.rotor2.rotateZ(angle);
    }

    up(distance) {
        this.body.moveZ(distance);
        this.height += distance;
    }

    down(distance) {
        if (this.height > 0.1) {
            this.body.moveZ(-distance);
            this.height -= distance;
        }
    }

    _createBody() {
        return new ColoredComponent([
            0.1,  0.1, 0.1,  -0.1,  0.1, 0.1,  -0.1, -0.1, 0.1,   0.1, -0.1, 0.1,
            0.1,  0.1, 0.1,   0.1, -0.1, 0.1,   0.1, -0.1,-0.1,   0.1,  0.3,-0.1,
            0.1,  0.1, 0.1,   0.1,  0.3,-0.1,  -0.1,  0.3,-0.1,  -0.1,  0.1, 0.1,
           -0.1,  0.1, 0.1,  -0.1,  0.3,-0.1,  -0.1, -0.1,-0.1,  -0.1, -0.1, 0.1,
            0.1, -0.1,-0.1,  -0.1, -0.1,-0.1,  -0.1,  0.3,-0.1,   0.1,  0.3,-0.1,
           -0.02,-0.5,-0.02,  0.02,-0.5,-0.02,  0.02,-0.5, 0.02, -0.02,-0.5, 0.02,
           -0.02,-0.5, 0.02,  0.02,-0.5, 0.02,  0.1, -0.1, 0.1,  -0.1, -0.1, 0.1,
            0.02,-0.5, 0.02,  0.02,-0.5,-0.02,  0.1, -0.1,-0.1,   0.1, -0.1, 0.1,
            0.02,-0.5,-0.02, -0.02,-0.5,-0.02, -0.1, -0.1,-0.1,   0.1, -0.1,-0.1,
           -0.02,-0.5,-0.02, -0.02,-0.5, 0.02, -0.1, -0.1, 0.1,  -0.1, -0.1,-0.1
        ], [
            0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4,
            0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4,
            0.5, 0.7, 1.0,  0.5, 0.7, 1.0,  0.5, 0.7, 1.0,  0.5, 0.7, 1.0,
            0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4,
            0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4,
            0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4,
            0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4,
            0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4,
            0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4,
            0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4, 0.0, 0.25, 0.4
        ], [
             0, 1, 2,   0, 2, 3,
             4, 5, 6,   4, 6, 7,
             8, 9,10,   8,10,11,
            12,13,14,  12,14,15,
            16,17,18,  16,18,19,
            20,21,22,  20,22,23,
            24,25,26,  24,26,27,
            28,29,30,  28,30,31,
            32,33,34,  32,34,35,
            36,37,38,  36,38,39
        ]);
    }

    _createRotor() {
        return new ColoredComponent([
            0.1, 0.1, 0.1,  -0.1, 0.1, 0.1,  -0.1,-0.1, 0.1,   0.1,-0.1, 0.1,
            0.1, 0.1, 0.1,   0.1,-0.1, 0.1,   0.1,-0.1,-0.1,   0.1, 0.1,-0.1,
            0.1, 0.1, 0.1,   0.1, 0.1,-0.1,  -0.1, 0.1,-0.1,  -0.1, 0.1, 0.1,
           -0.1, 0.1, 0.1,  -0.1, 0.1,-0.1,  -0.1,-0.1,-0.1,  -0.1,-0.1, 0.1,
           -0.1,-0.1,-0.1,   0.1,-0.1,-0.1,   0.1,-0.1, 0.1,  -0.1,-0.1, 0.1,
            0.1,-0.1,-0.1,  -0.1,-0.1,-0.1,  -0.1, 0.1,-0.1,   0.1, 0.1,-0.1
        ], [
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6
        ], [
             0, 1, 2,   0, 2, 3,
             4, 5, 6,   4, 6, 7,
             8, 9,10,   8,10,11,
            12,13,14,  12,14,15,
            16,17,18,  16,18,19,
            20,21,22,  20,22,23
        ]);
    }
}
