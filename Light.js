/*
    Light.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.12.12
*/
class Light {

    constructor(ambientIntensity, diffusiveIntensity, specularIntensity) {
        this.ambientIntensity = new Float32Array(ambientIntensity);
        this.diffusiveIntensity = new Float32Array(diffusiveIntensity);
        this.specularIntensity = new Float32Array(specularIntensity);
    }
}


class DirectionalLight extends Light {

    constructor(direction, ambientIntensity, diffusiveIntensity, specularIntensity) {
        super(ambientIntensity, diffusiveIntensity, specularIntensity);
        this.direction = new Float32Array(direction);
    }
}


class PointLight extends Light {

    constructor(position, ambientIntensity, diffusiveIntensity, specularIntensity) {
        super(ambientIntensity, diffusiveIntensity, specularIntensity);
        this.position = new Float32Array(position);
    }
}
