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
        var vstrText = document.getElementById('vshader-terrain').text;
        var fstrText = document.getElementById('fshader-terrain').text;
        this.csp = new ColorShaderProgram(this.gl, vscText, fscText);
        this.tsp = new TextureShaderProgram(this.gl, vstText, fstText);
        this.trsp = new TerrainShaderProgram(this.gl, vstrText, fstrText);
        this.viewMatrix = new Matrix4();
        this.eyePoint = [0.0, -3.0, 2.0];
        this.projMatrix = new Matrix4();

        this.light = new DirectionalLight([5.0, -5.0, 5.0], [0.1, 0.1, 0.1], [0.3, 0.3, 0.3], [0.3, 0.3, 0.3]);

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
            this._setColoredVao(component.vao, component.vertices, component.colors, component.normals, component.indices);
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
        } else if (component instanceof TerrainComponent) {
            {
                component.vao = this.gl.createVertexArray();
                this._setTerrainVao(component.vao, component.vertices, component.indices);
                component.image.onload = function() { self._loadImage(component) };
            }
            {   // to show brown plane while loading
                // component.loadingVao = this.gl.createVertexArray();
                // this._setColoredVao(component.loadingVao, component.vertices, new Float32Array([
                //     0.2, 0.3, 0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.1
                // ]), component.indices);
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

    _setColoredVao(vao, vertices, colors, normals, indices) {
        this.gl.bindVertexArray(vao);
        this._setArrayBuffer(vertices, this.csp.loc['a_Position'], 3);
        this._setArrayBuffer(colors, this.csp.loc['a_Color'], 3);
        this._setArrayBuffer(normals, this.csp.loc['a_Normal'], 3);
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

    _setTerrainVao(vao, coords, indices) {
        this.gl.bindVertexArray(vao);
        this._setArrayBuffer(coords, this.trsp.loc['a_TexCoord'], 2);
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
        } else if (component instanceof TerrainComponent) {
            if (component.isLoaded)
                this._renderTerrainComponent(component, component.vao);
            // else
                // this._renderColoredComponent(component, component.loadingVao);
        } else {
            console.log('Error: Renderer.render()');
        }
    }

    _renderColoredComponent(component, vao) {
        this.gl.bindVertexArray(vao);
        this.csp.use();
        this._uniformLights(this.csp);
        this.gl.uniformMatrix4fv(this.csp.loc['u_MvpMatrix'], false, this._modelToMVP(component.modelMatrix).elements);
        this.gl.uniformMatrix4fv(this.csp.loc['u_ModelMatrix'], false, component.modelMatrix.elements);
        this.gl.uniformMatrix4fv(this.csp.loc['u_NormalMatrix'], false, component.normalMatrix.elements);
        this.gl.drawElements(this.gl.TRIANGLES, component.indices.length, this.gl.UNSIGNED_INT, 0);
    }

    _renderTexturedComponent(component, vao) {
        this.gl.bindVertexArray(vao);
        this.tsp.use();
        this.gl.uniformMatrix4fv(this.tsp.loc['u_MvpMatrix'], false, this._modelToMVP(component.modelMatrix).elements);
        this.gl.bindTexture(this.gl.TEXTURE_2D, component.texture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.uniform1i(this.tsp.loc['u_Sampler'], 0);
        this.gl.drawElements(this.gl.TRIANGLES, component.indices.length, this.gl.UNSIGNED_INT, 0);
    }

    _renderTerrainComponent(component, vao) {
        this.gl.bindVertexArray(vao);
        this.trsp.use();
        this._uniformLights(this.trsp);
        this.gl.uniformMatrix4fv(this.trsp.loc['u_MvpMatrix'], false, this._modelToMVP(component.modelMatrix).elements);
        this.gl.uniformMatrix4fv(this.trsp.loc['u_ModelMatrix'], false, component.modelMatrix.elements);
        this.gl.bindTexture(this.gl.TEXTURE_2D, component.texture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.uniform1i(this.trsp.loc['u_Sampler'], 0);
        this.gl.drawElements(this.gl.TRIANGLES, component.indices.length, this.gl.UNSIGNED_INT, 0);
    }

    _uniformLights(program) {
        this.gl.uniform3fv(program.loc['u_LightDirection'], this.light['direction']);
        this.gl.uniform3fv(program.loc['u_AmbientIntensity'], this.light.ambientIntensity);
        this.gl.uniform3fv(program.loc['u_DiffusiveIntensity'], this.light.diffusiveIntensity);
        this.gl.uniform3fv(program.loc['u_SpecularIntensity'], this.light.specularIntensity);
        this.gl.uniform3fv(program.loc['u_EyePosition'], new Float32Array(this.eyePoint));
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
        this.loc = {};
        this._setLocations();
        this._setLightLocations();
    }

    use() {
        this.gl.useProgram(this.program);
    }

    _setLocations() {
        // abstract method
    }

    _setLightLocations() {
        for (var varString of ['u_LightDirection', 'u_AmbientIntensity', 'u_DiffusiveIntensity', 'u_SpecularIntensity', 'u_EyePosition']) {
            this.loc[varString] = this._getLocation(varString);
        }
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
        for (var varString of ['a_Position', 'a_Color', 'a_Normal', 'u_MvpMatrix', 'u_ModelMatrix', 'u_NormalMatrix']) {
            this.loc[varString] = this._getLocation(varString);
        }
    }
}


class TextureShaderProgram extends ShaderProgram {
    _setLocations() {
        for (var varString of ['a_Position', 'a_TexCoord', 'u_MvpMatrix', 'u_Sampler']) {
            this.loc[varString] = this._getLocation(varString);
        }
    }
}


class TerrainShaderProgram extends ShaderProgram {
    _setLocations() {
        for (var varString of ['a_TexCoord', 'u_MvpMatrix', 'u_ModelMatrix', 'u_Sampler']) {
            this.loc[varString] = this._getLocation(varString);
        }
    }
}
