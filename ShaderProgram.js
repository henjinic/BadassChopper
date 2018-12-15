/*
    ShaderProgram.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.12.16
*/
class ShaderProgram {
    constructor(gl, vshader, fshader) {
        this.gl = gl;
        initShaders(this.gl, vshader, fshader);
        this.program = this.gl.program;
        this.loc = {};
        this._setLocations();
        this._setLightLocations(1, 5); // defined at shader's MACRO
    }

    use() {
        this.gl.useProgram(this.program);
    }

    _setLocations() {
        // abstract method
    }

    _setLightLocations(dLightNum, pLightNum) {

        let locStrings = [];
        locStrings.push('u_EyePosition', 'u_DLightNum', 'u_PLightNum');
        for (let i = 0; i < dLightNum; i++) {
            locStrings.push('u_DLight[' + i + '].direction');
            locStrings.push('u_DLight[' + i + '].ambient');
            locStrings.push('u_DLight[' + i + '].diffusive');
            locStrings.push('u_DLight[' + i + '].specular');
        }
        for (let i = 0; i < pLightNum; i++) {
            locStrings.push('u_PLight[' + i + '].position');
            locStrings.push('u_PLight[' + i + '].ambient');
            locStrings.push('u_PLight[' + i + '].diffusive');
            locStrings.push('u_PLight[' + i + '].specular');
        }
        for (let locString of locStrings) {
            this.loc[locString] = this._getLocation(locString);
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
        for (let varString of ['a_Position', 'a_Color', 'a_Normal', 'u_MvpMatrix', 'u_ModelMatrix', 'u_NormalMatrix']) {
            this.loc[varString] = this._getLocation(varString);
        }
    }
}


class TextureShaderProgram extends ShaderProgram {
    _setLocations() {
        for (let varString of ['a_Position', 'a_TexCoord', 'u_MvpMatrix', 'u_Sampler']) {
            this.loc[varString] = this._getLocation(varString);
        }
    }
}


class TerrainShaderProgram extends ShaderProgram {
    _setLocations() {
        for (let varString of ['a_TexCoord', 'u_MvpMatrix', 'u_ModelMatrix', 'u_Sampler']) {
            this.loc[varString] = this._getLocation(varString);
        }
    }
}

