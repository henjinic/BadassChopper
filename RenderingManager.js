/*
    RenderingManager.js

    Hyeonjin Kim
    2013875008
    Landscape Architecture

    2018.12.16
*/
class RenderingManager {

    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.viewDict = {};
        this.compoDict = {};
        this.lightDict = {};
        this.viewId = 0;
        this.compoId = 0;
        this.lightId = 0;
    }

    addView(view) {
        this.viewDict[this.viewId] = view;
        return this.viewId++;
    }

    addCompo(compo) {
        this.renderer.load(compo);
        this.compoDict[this.compoId] = compo;
        return this.compoId++;
    }

    delCompo(compoId) {
        delete this.compoDict[compoId];
    }

    addLight(light) {
        this.lightDict[this.lightId] = light;
        return this.lightId++;
    }

    delLight(lightId) {
        delete this.lightDict[lightId];
    }

    draw() {
        this.renderer.clear();
        for (let view of Object.values(this.viewDict)) {
            for (let compo of Object.values(this.compoDict)) {
                this.renderer.render(compo, Object.values(this.lightDict), view);
            }
        }
    }
}
