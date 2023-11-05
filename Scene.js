import * as THREE from 'three';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js'
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js"
import {SMAAPass} from "three/addons/postprocessing/SMAAPass.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader";

export default class Scene {
    scene
    camera
    renderer
    composer
    width = window.innerWidth
    height = window.innerHeight
    objects = []

    animate = () => {
        requestAnimationFrame(this.animate);
        this.composer.render(this.scene, this.camera);
    }

    constructor(objects = []) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const renderScene = new RenderPass(this.scene, this.camera)
        this.composer = new EffectComposer(this.renderer)
        this.composer.addPass(renderScene)

        document.body.appendChild(this.renderer.domElement);


        window.addEventListener('resize', () => {
            this.width = window.innerWidth
            this.height = window.innerHeight

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height);
        })

        const progress = document.getElementById('progress')

        const status = [];

        objects.forEach((obj, key) => {
            status.push(0)

            window.addEventListener('progress_' + key, event => {
                status[key] = event.detail

                let statusTotal = 0

                status.forEach(stat => {
                    statusTotal += stat
                })

                statusTotal /= objects.length

                progress.style.width = Math.round(statusTotal) + "%"
                progress.innerHTML = Math.round(statusTotal) + "%"

                if (statusTotal >= 99) {
                    document.getElementById('progressWrapper').classList.add('hidden')
                }
            });
        })

        objects.forEach(async  (obj, key) => {
            const object = await this.#loadObject(obj.path, "progress_" + key, obj.scale, obj.shadow)
            this.objects.push(object)
            this.scene.add(object)
        })
    }

    addBloom(strength = 0.25, radius = 0.25, threshold = 0.25) {
        const bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height),
            strength,
            radius,
            threshold
        )

        this.composer.addPass(bloom)

        window.addEventListener('resize', () => {
            bloom.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
        })

        return bloom
    }

    addSMAA() {
        const smaa = new SMAAPass(this.width, this.height)
        this.composer.addPass(smaa)

        window.addEventListener('resize', () => {
            smaa.setSize(window.innerWidth, window.innerHeight)
        })

        return smaa
    }

    addHDRI(path, show = false) {
        new RGBELoader()
            .load(path, texture => {
                texture.mapping = THREE.EquirectangularReflectionMapping;

                if (show) {
                    this.scene.background = texture;
                }

                this.scene.environment = texture;
            });
    }

    addLight (x, y, z, intensity = 5) {
        const light = new THREE.DirectionalLight(0xffffff, intensity);
        light.position.set(x, y, z);
        this.scene.add(light);

        return light;
    }

    #loadObject(path, progressName, scale = 1, shadows = true) {
        const loader = new GLTFLoader();

        return new Promise((resolve, reject) => {
            loader.load(
                path,
                gltf => {
                    const object = gltf.scene;

                    if (shadows) {
                        object.castShadow = true;
                        object.receiveShadow = true;
                    }

                    object.scale.set(scale, scale, scale);
                    resolve(object);
                },
                xhr => {
                    const progress = xhr.loaded / xhr.total * 100;
                    const progressEvent = new CustomEvent(progressName, { detail: progress });
                    window.dispatchEvent(progressEvent);
                },
                error => {
                    console.error('An error happened', error);
                    reject(error);
                }
            );
        });
    }
}
