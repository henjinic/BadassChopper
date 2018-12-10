/*
    Renderer.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.12.10
*/
class Renderer {

    constructor(canvas) {
        this.gl = canvas.getContext('webgl2');
        var vscText = document.getElementById('vshader-colored').text;
        var fscText = document.getElementById('fshader-colored').text;
        var vstText = document.getElementById('vshader-textured').text;
        var fstText = document.getElementById('fshader-textured').text;
        this.csp = new ColorShaderProgram(this.gl, vscText, fscText);
        this.tsp = new TextureShaderProgram(this.gl, vstText, fstText);
        this.viewMatrix = new Matrix4();
        this.eyePoint = [0.0, -3.0, 2.0];
        this.projMatrix = new Matrix4();
        this._init();
    }

    static get X_AXIS() { return [1.0, 0.0, 0.0]; }
    static get Y_AXIS() { return [0.0, 1.0, 0.0]; }
    static get Z_AXIS() { return [0.0, 0.0, 1.0]; }
    get horizAxis() {
        var mat = new Matrix4().setRotate(90, 0, 0, 1);
        var eyeVec = new Vector4(this.eyePoint.concat([1.0]));
        var rotdVec = mat.multiplyVector4(eyeVec);
        var rotdEye = Array.from(rotdVec.elements).slice(0, 3);
        rotdEye[2] = 0;
        return rotdEye;
    }

    _init() {
        this.setDefaultView();
        this.projMatrix.setPerspective(90, 1.0, 0.01, 100.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.clear();
    }

    load(component) {
        var self = this;
        if (component instanceof ColoredComponent) {
            component.vao = this.gl.createVertexArray();
            this._setColoredVao(component.vao, component.vertices, component.colors, component.indices);
        } else if (component instanceof TexturedComponent) {
            {
                component.vao = this.gl.createVertexArray();
                this._setTexturedVao(component.vao, component.vertices, new Float32Array([
                    0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0
                ]), component.indices);
                component.image.onload = function() { self._loadImage(component) };
            }
            {   // to show green plane while loading
                component.loadingVao = this.gl.createVertexArray();
                this._setColoredVao(component.loadingVao, component.vertices, new Float32Array([
                    0.2, 0.3, 0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.1
                ]), component.indices);
            }
        } else {
            console.log('Error: Renderer.load()');
        }
    }

    _loadImage(texturedComponent) {
        texturedComponent.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texturedComponent.texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, texturedComponent.image);
        texturedComponent.isLoaded = true;
    }

    _setColoredVao(vao, vertices, colors, indices) {
        this.gl.bindVertexArray(vao);
        this._setArrayBuffer(vertices, this.csp.loc['a_Position'], 3);
        this._setArrayBuffer(colors, this.csp.loc['a_Color'], 3);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
    }

    _setTexturedVao(vao, vertices, coords, indices) {
        this.gl.bindVertexArray(vao);
        this._setArrayBuffer(vertices, this.tsp.loc['a_Position'], 3);
        this._setArrayBuffer(coords, this.tsp.loc['a_TexCoord'], 2);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
    }

    _setArrayBuffer(data, location, num) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(location, num, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(location);
    }

    render(component) {
        if (component instanceof ColoredComponent) {
            this._renderColoredComponent(component, component.vao);
        } else if (component instanceof TexturedComponent) {
            if (component.isLoaded)
                this._renderTexturedComponent(component, component.vao);
            else
                this._renderColoredComponent(component, component.loadingVao);
        } else {
            console.log('Error: Renderer.render()');
        }
    }

    _renderColoredComponent(component, vao) {
        this.gl.bindVertexArray(vao);
        this.csp.use();
        this.gl.uniformMatrix4fv(this.csp.loc['u_MvpMatrix'], false, this._modelToMVP(component.modelMatrix).elements);
        this.gl.drawElements(this.gl.TRIANGLES, component.indices.length, this.gl.UNSIGNED_BYTE, 0);
    }

    _renderTexturedComponent(component, vao) {
        this.gl.bindVertexArray(vao);
        this.tsp.use();
        this.gl.uniformMatrix4fv(this.tsp.loc['u_MvpMatrix'], false, this._modelToMVP(component.modelMatrix).elements);
        this.gl.bindTexture(this.gl.TEXTURE_2D, component.texture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.uniform1i(this.tsp.loc['u_Sampler'], 0);
        this.gl.drawElements(this.gl.TRIANGLES, component.indices.length, this.gl.UNSIGNED_BYTE, 0);
    }

    _modelToMVP(modelMatrix) {
        return new Matrix4(this.projMatrix).concat(this.viewMatrix).concat(modelMatrix);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);
    }

    view(src, dest, up) {
        this.viewMatrix.setLookAt(...src, ...dest, ...up);
    }

    viewFrom(point) {
        this.viewMatrix.setLookAt(...point, 0, 0, 0, 0, 0, 1);
    }

    setDefaultView() {
        this.viewMatrix.setLookAt(0, -3, 2, 0, 0, 0, 0, 0, 1);
    }

    rotateView(angle, axis) {
        var mat = new Matrix4().setRotate(angle, ...axis);
        var vec = new Vector4(this.eyePoint.concat([1.0]));
        var newVec = mat.multiplyVector4(vec);
        var newEyePoint = Array.from(newVec.elements).slice(0, 3);
        if (!this._isProperEye(newEyePoint)) {
            return;
        }

        this.viewFrom(newEyePoint);
        this.eyePoint = newEyePoint;
    }

    zoomView(diff) {
        var eyeDist = Math.sqrt(this.eyePoint.map(x => x * x).reduce((x, y) => x + y, 0));
        var newDist = eyeDist - diff;
        if (newDist < 0.1) {
            return;
        }
        var prop = newDist / eyeDist;
        var newEyePoint = this.eyePoint.map(x => x * prop);

        this.viewFrom(newEyePoint);
        this.eyePoint = newEyePoint;
    }

    _isProperEye(eyePoint) {
        if (eyePoint[2] < 0) {
            return false;
        } else if (eyePoint[0] * this.eyePoint[0] < 0 && eyePoint[1] * this.eyePoint[1] < 0) { // is it perfect?
            return false;
        } else {
            return true;
        }
    }

    setViewport(posX, posY, width, height) {
        this.gl.viewport(posX, posY, width, height);
    }
}


class ShaderProgram {
    constructor(gl, vshader, fshader) {
        this.gl = gl;
        initShaders(this.gl, vshader, fshader);
        this.program = this.gl.program;
        this._setLocations();
    }

    use() {
        this.gl.useProgram(this.program);
    }

    _setLocations() {
        // abstract method
    }

    _getLocation(varString) {
        if (varString[0] == 'a') {
            return this.gl.getAttribLocation(this.program, varString);
        } else if (varString[0] == 'u') {
            return this.gl.getUniformLocation(this.program, varString);
        } else {
            console.log('Error: ShaderProgram._getLocation');
        }
    }
}


class ColorShaderProgram extends ShaderProgram {
    _setLocations() {
        this.loc = {};
        for (var varString of ['a_Position', 'a_Color', 'u_MvpMatrix']) {
            this.loc[varString] = this._getLocation(varString);
        }
    }
}


class TextureShaderProgram extends ShaderProgram {
    _setLocations() {
        this.loc = {};
        for (var varString of ['a_Position', 'a_TexCoord', 'u_MvpMatrix', 'u_Sampler']) {
            this.loc[varString] = this._getLocation(varString);
        }
    }
}
