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
        let vscText = document.getElementById('vshader-colored').text;
        let fscText = document.getElementById('fshader-colored').text;
        let vstText = document.getElementById('vshader-textured').text;
        let fstText = document.getElementById('fshader-textured').text;
        let vstrText = document.getElementById('vshader-terrain').text;
        let fstrText = document.getElementById('fshader-terrain').text;
        this.csp = new ColorShaderProgram(this.gl, vscText, fscText);
        this.tsp = new TextureShaderProgram(this.gl, vstText, fstText);
        this.trsp = new TerrainShaderProgram(this.gl, vstrText, fstrText);
        this.projMatrix = new Matrix4();
        this._init();
    }

    _init() {
        //this.setDefaultView();
        this.projMatrix.setPerspective(90, 1.0, 0.01, 100.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.clear();
    }

    addComponent(component) {

    }

    load(component) {
        let self = this;
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

    render(component, lights, view) {
        if (component instanceof ColoredComponent) {
            this._renderColoredComponent(component, component.vao, lights, view);
        } else if (component instanceof TexturedComponent) {
            if (component.isLoaded)
                this._renderTexturedComponent(component, component.vao, lights, view);
            else
                this._renderColoredComponent(component, component.loadingVao, lights, view);
        } else if (component instanceof TerrainComponent) {
            if (component.isLoaded)
                this._renderTerrainComponent(component, component.vao, lights, view);
            // else
                // this._renderColoredComponent(component, component.loadingVao, lights, view);
        } else {
            console.log('Error: Renderer.render()');
        }
    }

    _renderColoredComponent(component, vao, lights, view) {
        this.gl.bindVertexArray(vao);
        this.csp.use();
        this._uniformLights(this.csp, lights, view);
        this.gl.uniformMatrix4fv(this.csp.loc['u_MvpMatrix'], false, this._getMvpMatrix(component, view).elements);
        this.gl.uniformMatrix4fv(this.csp.loc['u_ModelMatrix'], false, component.modelMatrix.elements);
        this.gl.uniformMatrix4fv(this.csp.loc['u_NormalMatrix'], false, component.normalMatrix.elements);
        this.gl.drawElements(this.gl.TRIANGLES, component.indices.length, this.gl.UNSIGNED_INT, 0);
    }

    _renderTexturedComponent(component, vao, lights, view) {
        this.gl.bindVertexArray(vao);
        this.tsp.use();
        this.gl.uniformMatrix4fv(this.tsp.loc['u_MvpMatrix'], false, this._getMvpMatrix(component, view).elements);
        this.gl.bindTexture(this.gl.TEXTURE_2D, component.texture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.uniform1i(this.tsp.loc['u_Sampler'], 0);
        this.gl.drawElements(this.gl.TRIANGLES, component.indices.length, this.gl.UNSIGNED_INT, 0);
    }

    _renderTerrainComponent(component, vao, lights, view) {
        this.gl.bindVertexArray(vao);
        this.trsp.use();
        this._uniformLights(this.trsp, lights, view);
        this.gl.uniformMatrix4fv(this.trsp.loc['u_MvpMatrix'], false, this._getMvpMatrix(component, view).elements);
        this.gl.uniformMatrix4fv(this.trsp.loc['u_ModelMatrix'], false, component.modelMatrix.elements);
        this.gl.bindTexture(this.gl.TEXTURE_2D, component.texture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.uniform1i(this.trsp.loc['u_Sampler'], 0);
        this.gl.drawElements(this.gl.TRIANGLES, component.indices.length, this.gl.UNSIGNED_INT, 0);
    }

    _uniformLights(program, lights, view) {
        let dLightNum = 0;
        let pLightNum = 0;
        for (let light of lights) {
            if (light instanceof DirectionalLight) {
                this.gl.uniform3fv(program.loc['u_DLight[' + dLightNum + '].direction'], light.direction);
                this.gl.uniform3fv(program.loc['u_DLight[' + dLightNum + '].ambient'], light.ambientIntensity);
                this.gl.uniform3fv(program.loc['u_DLight[' + dLightNum + '].diffusive'], light.diffusiveIntensity);
                this.gl.uniform3fv(program.loc['u_DLight[' + dLightNum + '].specular'], light.specularIntensity);
                dLightNum += 1;
            } else if (light instanceof PointLight) {
                this.gl.uniform3fv(program.loc['u_PLight[' + pLightNum + '].position'], light.position);
                this.gl.uniform3fv(program.loc['u_PLight[' + pLightNum + '].ambient'], light.ambientIntensity);
                this.gl.uniform3fv(program.loc['u_PLight[' + pLightNum + '].diffusive'], light.diffusiveIntensity);
                this.gl.uniform3fv(program.loc['u_PLight[' + pLightNum + '].specular'], light.specularIntensity);
                pLightNum += 1;
            } else {
                console.log('Error: Renderer._uniformLights');
            }
        }
        this.gl.uniform3fv(program.loc['u_EyePosition'], new Float32Array(view.eyePos));
        this.gl.uniform1i(program.loc['u_DLightNum'], dLightNum);
        this.gl.uniform1i(program.loc['u_PLightNum'], pLightNum);
    }

    _getMvpMatrix(component, view) {
        return new Matrix4(this.projMatrix).concat(view.viewMatrix).concat(component.modelMatrix);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);
    }

    setViewport(posX, posY, width, height) {
        this.gl.viewport(posX, posY, width, height);
    }
}
