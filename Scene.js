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
    statusObjects = []
    hdriStatus = 100 //if it is not used
    clock = new THREE.Clock();

    animate = () => {
        requestAnimationFrame(this.animate);
        let deltaTime = this.clock.getDelta();

        this.objects.forEach(obj => {
            obj.animations.forEach(animation => {
                animation.mixer.update(deltaTime)
            })
        })

        this.composer.render(this.scene, this.camera);
    }

    constructor(objects = []) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ alpha: true });
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
            this.composer.setSize(window.innerWidth, window.innerHeight)

        })

        window.addEventListener('hdri', event => this.#updateStatus(event, objects.length))

        objects.forEach(async  (obj, key) => {
            this.statusObjects.push(0)
            window.addEventListener('progress_' + key, event => this.#updateStatus(event, objects.length, key))

            const object = await this.#loadObject(obj.path, "progress_" + key, obj.scale, obj.shadow, obj.rotation)
            this.objects.push(object)
            this.scene.add(object.obj)
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
        return bloom
    }

    addSMAA() {
        const smaa = new SMAAPass(this.width, this.height)
        this.composer.addPass(smaa)
        return smaa
    }

    addHDRI(path, show = false) {
        this.hdriStatus = 0
        new RGBELoader()
            .load(path, texture => {
                texture.mapping = THREE.EquirectangularReflectionMapping;

                if (show) {
                    this.scene.background = texture;
                }

                this.scene.environment = texture;
            },xhr => {
                const progress = xhr.loaded / xhr.total * 100;
                const progressEvent = new CustomEvent("hdri", { detail: progress });
                window.dispatchEvent(progressEvent);
            })
        ;
    }

    addLight (x, y, z, intensity = 5) {
        const light = new THREE.DirectionalLight(0xffffff, intensity);
        light.position.set(x, y, z);
        this.scene.add(light);

        return light;
    }

    degToRadiant(degrees) {
        return degrees * Math.PI / 180
    }

    #loadObject(path, progressName, scale = 1, shadows = true, rotation = {}) {
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

                    const animations = []

                    gltf.animations.forEach(animation => {
                        const mixer = new THREE.AnimationMixer(gltf.scene);
                        const action = mixer.clipAction(animation)
                        action.play()

                        animations.push({
                            action: action,
                            mixer: mixer
                        })
                    });


                    object.scale.set(scale, scale, scale);
                    if (rotation !== {}) {
                        object.rotation.set(
                            this.degToRadiant(rotation.x),
                            this.degToRadiant(rotation.y),
                            this.degToRadiant(rotation.z)
                        )
                    }


                    resolve({
                        obj: object,
                        animations: animations
                    });
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

    #updateStatus(event, objCount, key = null) {
        const progress = document.getElementById('progress')

        if (key !== null)
            this.statusObjects[key] = event.detail
        else
            this.hdriStatus = event.detail

        let statusTotal = this.hdriStatus

        this.statusObjects.forEach(stat => {
            statusTotal += stat
        })

        statusTotal /= objCount + 1

        console.log(statusTotal)

        progress.style.width = Math.round(statusTotal) + "%"
        progress.innerHTML = Math.round(statusTotal) + "%"

        if (statusTotal >= 99) {
            document.getElementById('progressWrapper').classList.add('hidden')
        }
    }
}
