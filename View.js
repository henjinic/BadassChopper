/*
    View.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.12.16
*/
class View {

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.eyePos = [0.0, -3.0, 2.0];
        this.centerPos = [0.0, 0.0, 0.0];
        this.upVec = [0.0, 0.0, 1.0];
        this.viewMatrix = new Matrix4();
        this._updateViewMatrix();
    }

    static get X_AXIS() { return [1.0, 0.0, 0.0]; }
    static get Y_AXIS() { return [0.0, 1.0, 0.0]; }
    static get Z_AXIS() { return [0.0, 0.0, 1.0]; }
    get horizAxis() {
        let mat = new Matrix4().setRotate(90, 0, 0, 1);
        let eyeVec = new Vector3(this.eyePos);
        let rotdVec = mat.multiplyVector3(eyeVec);
        let rotdEye = Array.from(rotdVec.elements);
        rotdEye[2] = 0;
        return rotdEye;
    }

    viewFrom(x, y, z) {
        this.eyePos = [x, y, z];
        this._updateViewMatrix();
    }

    viewTo(x, y, z) {
        this.centerPos = [x, y, z];
        this._updateViewMatrix();
    }

    upDirection(x, y, z) {
        this.upVec(x, y, z);
        this._updateViewMatrix();
    }

    _updateViewMatrix() {
        this.viewMatrix.setLookAt(...this.eyePos, ...this.centerPos, ...this.upVec);
    }

    rotateView(angle, axis) {
        let mat = new Matrix4().setRotate(angle, ...axis);
        let vec = new Vector3(this.eyePos);
        let newVec = mat.multiplyVector3(vec);
        let newEyePos = Array.from(newVec.elements);
        if (!this._isProperEye(newEyePos)) {
            return;
        }

        this.viewFrom(newEyePos);
        this.eyePos = newEyePos;
        this._updateViewMatrix();
    }

    _isProperEye(eyePos) {
        if (eyePos[2] < 0) {
            return false;
        } else if (eyePos[0] * this.eyePos[0] < 0 && eyePos[1] * this.eyePos[1] < 0) { // is it perfect?
            return false;
        } else {
            return true;
        }
    }

    zoomView(diff) {
        let eyeDist = Math.sqrt(this.eyePos.map(x => x * x).reduce((x, y) => x + y, 0));
        let newDist = eyeDist - diff;
        if (newDist < 0.1) {
            return;
        }
        let prop = newDist / eyeDist;
        let newEyePos = this.eyePos.map(x => x * prop);

        this.viewFrom(newEyePos);
        this.eyePos = newEyePos;
        this._updateViewMatrix();
    }
}
