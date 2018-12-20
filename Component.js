/*
    Component.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.12.10
*/
class Component {

    constructor(vertices, indices) {
        this.vertices = new Float32Array(vertices); // can be either vertices' positions or texture coordinates
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

    get normalMatrix() {
        return new Matrix4().setInverseOf(this.modelMatrix).transpose();
    }

    get direction() { return this.modelMatrix.multiplyVector3(new Vector3([0.0, 1.0, 0.0])).elements.map((x, i) => x - this.position[i]); }
    get position() { return this.modelMatrix.multiplyVector3(new Vector3([0.0, 0.0, 0.0])).elements; }

    directionTo(x, y, z) {
        return [x - this.position[0], y - this.position[1], z - this.position[2]];
    }

    addChild(child) {
        child.parent = this;
    }

    move(x, y, z) {
        this.dynamicMatrix.translate(x, y, z);
    }

    moveX(distance) {
        this.move(distance, 0.0, 0.0);
    }

    moveY(distance) {
        this.move(0.0, distance, 0.0);
    }

    moveZ(distance) {
        this.move(0.0, 0.0, distance);
    }

    rotate(angle, x, y, z) {
        this.dynamicMatrix.rotate(angle, x, y, z);
    }

    rotateZ(angle) {
        this.rotate(angle, 0.0, 0.0, 1.0);
    }

    scale(x, y, z) {
        this.dynamicMatrix.scale(x, y, z);
    }

    setLocalCoordToWorldCoord() {
        this.staticMatrix.set(this.dynamicMatrix);
        this.dynamicMatrix = new Matrix4();
    }
}


class ColoredComponent extends Component {

    constructor(vertices, colors, indices) {
        super(vertices, indices);

        let normals = [];
        let x1, y1, z1, x2, y2, z2, cx, cy, cz;
        for (let i = 0; i < vertices.length; i += 12) {
            x1 = vertices[i + 3] - vertices[i];
            y1 = vertices[i + 4] - vertices[i + 1];
            z1 = vertices[i + 5] - vertices[i + 2];
            x2 = vertices[i + 6] - vertices[i];
            y2 = vertices[i + 7] - vertices[i + 1];
            z2 = vertices[i + 8] - vertices[i + 2];
            cx = y1 * z2 - z1 * y2;
            cy = z1 * x2 - x1 * z2;
            cz = x1 * y2 - y1 * x2;
            normals.push(cx, cy, cz, cx, cy, cz, cx, cy, cz, cx, cy, cz);
        }

        this.normals = new Float32Array(normals);
        this.colors = new Float32Array(colors);
    }
}


// class TexturedComponent extends Component {

//     constructor(vertices, indices, image) {
//         super(vertices, indices);
//         this.image = new Image();
//         this.image.crossOrigin = 'anonymous';
//         this.image.src = image;
//         this.isLoaded = false;
//     }
// }


class TerrainComponent extends Component {

    constructor(texCoord, indices, image) {
        super(texCoord, indices);
        this.image = new Image();
        this.image.crossOrigin = 'anonymous';
        this.image.src = image;
        this.isLoaded = false;
    }
}
