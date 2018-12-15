/*
    BadassChopperSimulation.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.12.10
*/
function main() {
    let simulator = new ChopperSimulator(document.getElementById('webgl'));

    simulator.drawAll();
    simulator.keypressOn();
    simulator.rotorOn();
};


class ChopperSimulator {

    constructor(canvas) {
        this.W = canvas.width;
        this.H = canvas.height;
        this.renderer = new Renderer(canvas);
        this.ground = new Terrain('https://raw.githubusercontent.com/henjinic/BadassChopper/master/img/yorkville.jpg');
        this.chopper = new Chopper();
        this.bullets = [];
        this._init();
    }

    _init() {
        this.renderer.load(this.ground.component);
        this.renderer.load(this.chopper.body);
        this.renderer.load(this.chopper.rotor1);
        this.renderer.load(this.chopper.rotor2);
        this.chopper.up(1.0);
    }

    drawAll() {
        this.renderer.clear();
        this.renderer.render(this.ground.component);
        this.renderer.render(this.chopper.body);
        this.renderer.render(this.chopper.rotor1);
        this.renderer.render(this.chopper.rotor2);
        for (let bullet of this.bullets) {
            this.renderer.render(bullet.component);
        }

        // this._drawLeftViewport();
        // this._drawRightViewport();
    }

    _drawLeftViewport() {
        this.renderer.setViewport(0, 0, this.W, this.H);
        this.renderer.setDefaultView();
        this.renderer.render(this.ground.component);
        this.renderer.render(this.chopper.body);
        this.renderer.render(this.chopper.rotor1);
        this.renderer.render(this.chopper.rotor2);
    }

    _drawRightViewport() {
        this.renderer.setViewport(this.W, 0, this.W, this.H);
        let src = Component.moveAlong(this.chopper.body, [0.0, 0.0, 0.0]);
        let dest = src.slice();
        dest[2] -= 1.0;
        let up = Component.moveAlong(this.chopper.body, [0.0, 1.0, 0.0]);
        for (let i = 0; i < 3; i++)
            up[i] -= src[i];
        this.renderer.view(src, dest, up);
        this.renderer.render(this.ground.component);
    }

    keypressOn() {
        let self = this;
        document.onkeydown = function(event) {
            switch (event.key) {
                case 'ArrowLeft':  event.shiftKey ? self.renderer.rotateView(-5.0, Renderer.Z_AXIS) : self.chopper.clockwise(10.0);       break;
                case 'ArrowRight': event.shiftKey ? self.renderer.rotateView(5.0, Renderer.Z_AXIS) : self.chopper.counterclockwise(10.0); break;
                case 'ArrowUp':    event.shiftKey ? self.renderer.rotateView(-5.0, self.renderer.horizAxis) : self.chopper.forward(0.05); break;
                case 'ArrowDown':  event.shiftKey ? self.renderer.rotateView(5.0, self.renderer.horizAxis) : self.chopper.backward(0.05); break;
                case 'A': case 'a': self.chopper.up(0.05);        break;
                case 'Z': case 'z': self.chopper.down(0.05);      break;
                case '=': case '+': self.renderer.zoomView(0.2);  break;
                case '-': case '_': self.renderer.zoomView(-0.2); break;
                case ' ': self._shootGlowingBullet();             break;
            }
            self.drawAll();
        };
    }

    _shootGlowingBullet() {
        if (this.bullets.length < 5) {
            let bullet = new Bullet(this.chopper.body.position);
            let velocity = this.chopper.body.direction.slice();
            velocity[2] += 1.0;
            velocity = velocity.map(x => x * 3.0);

            this.renderer.load(bullet.component);
            this.bullets.push(bullet);
            this.renderer.addPointLight(bullet.light);
            bullet.shoot(velocity);
        }
    }

    keypressOff() {
        document.onkeydown = null;
    }

    rotorOn() {
        let self = this;
        this.iterator = new Iterator(1.0, 200.0, function(amount) { // 200 degrees per 1 sec
            self.chopper.rotor1.rotateZ(amount);
            self.chopper.rotor2.rotateZ(amount);
            self.drawAll();
        });
        this.iterator.start();
    }
}


class Ground {

    constructor(path) {
        this.component = new TexturedComponent([
           -2.0, 2.0, 0.0,
            2.0, 2.0, 0.0,
            2.0,-2.0, 0.0,
           -2.0,-2.0, 0.0
        ], [
            0, 1, 2,
            0, 2, 3
        ],
            path
        );
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
        let color = [];
        this.component = new ColoredComponent([
            0.1, 0.1, 0.1,  -0.1, 0.1, 0.1,  -0.1,-0.1, 0.1,   0.1,-0.1, 0.1,
            0.1, 0.1, 0.1,   0.1,-0.1, 0.1,   0.1,-0.1,-0.1,   0.1, 0.1,-0.1,
            0.1, 0.1, 0.1,   0.1, 0.1,-0.1,  -0.1, 0.1,-0.1,  -0.1, 0.1, 0.1,
           -0.1, 0.1, 0.1,  -0.1, 0.1,-0.1,  -0.1,-0.1,-0.1,  -0.1,-0.1, 0.1,
           -0.1,-0.1,-0.1,   0.1,-0.1,-0.1,   0.1,-0.1, 0.1,  -0.1,-0.1, 0.1,
            0.1,-0.1,-0.1,  -0.1,-0.1,-0.1,  -0.1, 0.1,-0.1,   0.1, 0.1,-0.1
        ], [
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0
        ], [
             0, 1, 2,   0, 2, 3,
             4, 5, 6,   4, 6, 7,
             8, 9,10,   8,10,11,
            12,13,14,  12,14,15,
            16,17,18,  16,18,19,
            20,21,22,  20,22,23
        ]);
        this.component.move(...position);
        this.height = position[2];
        this.light = new PointLight(
            position,
            new Array(3).fill(0.05),
            new Array(3).fill(0.1),
            new Array(3).fill(0.1)
        );
    }

    move(dx, dy, dz) {
        this.component.move(dx, dy, dz);
        this.light.move(dx, dy, dz);
    }

    shoot(velocity) {
        let self = this;
        self.iterator = new Iterator(1.0, 0.05, function(amount) {
            const G = -9.8;
            const STEP_SIZE = 0.01;
            for (let i = 0; i < amount / STEP_SIZE; i++) {
                if (self.height < -1.0) {
                    self.stop();
                }
                self.move(velocity[0] * STEP_SIZE, velocity[1] * STEP_SIZE, velocity[2] * STEP_SIZE);
                // velocity[0] += 0 * STEP_SIZE;
                // velocity[1] += 0 * STEP_SIZE;
                velocity[2] += G * STEP_SIZE;
            }
        });
        self.iterator.start();
    }
}

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
        this.rotor2.rotateZ(-angle); // adjustment
    }

    counterclockwise(angle) {
        this.body.rotateZ(-angle);
        this.rotor1.rotateZ(angle);
        this.rotor2.rotateZ(angle); // adjustment
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
            0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,
            0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, 0.5,
            0.5, 0.7, 1.0,  0.5, 0.7, 1.0,  0.5, 0.7, 1.0,  0.5, 0.7, 1.0,
            0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, 0.5,
            0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,
            0.3, 0.3, 0.3,  0.3, 0.3, 0.3,  0.3, 0.3, 0.3,  0.3, 0.3, 0.3,
            0.5, 0.5, 1.0,  0.5, 0.5, 1.0,  0.5, 0.5, 1.0,  0.5, 0.5, 1.0,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.2, 0.2, 0.2,  0.2, 0.2, 0.2,  0.2, 0.2, 0.2,  0.2, 0.2, 0.2,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6
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
            0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,  0.6, 0.6, 0.6,
            0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0
        ], [
             0, 1, 2,   0, 2, 3,
             4, 5, 6,   4, 6, 7,
             8, 9,10,   8,10,11,
            12,13,14,  12,14,15,
            16,17,18,  16,18,19,
            20,21,22,  20,22,23
        ]);
    }
};
