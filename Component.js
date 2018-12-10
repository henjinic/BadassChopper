/*
    Component.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.12.10
*/
class Component {

    constructor(vertices, indices) {
        this.vertices = new Float32Array(vertices); // can be vertices' positions or texture coordinates
        this.indices = new Uint32Array(indices);
        this.dynamicMatrix = new Matrix4();
        this.staticMatrix = new Matrix4();
        this.parent = null;
    }

    get modelMatrix() {
        return new Matrix4(this.accumulatedDynamicMatrix).concat(this.staticMatrix);
    }

    get accumulatedDynamicMatrix() {
        if (this.parent) {
            return new Matrix4(this.parent.accumulatedDynamicMatrix).concat(this.dynamicMatrix)
        } else {
            return this.dynamicMatrix;
        }
    }

    addChild(child) {
        child.parent = this;
    }

    moveY(distance) {
        this.dynamicMatrix.translate(0.0, distance, 0.0);
    }

    moveZ(distance) {
        this.dynamicMatrix.translate(0.0, 0.0, distance);
    }

    rotateZ(angle) {
        this.dynamicMatrix.rotate(angle, 0.0, 0.0, 1.0);
    }

    scale(x, y, z) {
        this.dynamicMatrix.scale(x, y, z);
    }

    fix() {
        this.staticMatrix.set(this.dynamicMatrix);
        this.dynamicMatrix = new Matrix4();
    }
}


class ColoredComponent extends Component {

    constructor(vertices, colors, indices) {
        super(vertices, indices);
        this.colors = new Float32Array(colors);
    }
}


class TexturedComponent extends Component {

    constructor(vertices, indices, image) {
        super(vertices, indices);
        this.image = new Image();
        this.image.crossOrigin = 'anonymous';
        this.image.src = image;
        this.isLoaded = false;
    }
}


class TerrainComponent extends Component {

    constructor(texCoord, indices, image) {
        super(texCoord, indices);
        this.image = new Image();
        this.image.crossOrigin = 'anonymous';
        this.image.src = image;
        this.isLoaded = false;
    }
}
