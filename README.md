# threeJs-scene
A class to create a scene for three Js

## Example
```js
import Scene from './Scene'
import * as THREE from 'three';

const homeScene = new Scene([
    {
        path: "/assets/models/drone.gltf", //TODO
        scale: 0.5,
        shadow: true,
        rotation: {
            x: 15,
            y: 180,
            z: 0
        }
    }
])

const renderer = homeScene.renderer
const camera = homeScene.camera

renderer.setClearColor( 0x000000, 0 );

homeScene.addBloom(0.25, 0.25, 0.25)
homeScene.addSMAA()
homeScene.addLight(0, 10, 0, 5)
homeScene.addHDRI('/assets/hdri/the_sky_is_on_fire_2k.hdr', true)

let mouse = {x: 0, y: 0};
const mouseRotationFaktor = -0.05 //Damit wenn ich nach recht gehe auch nach rechts dreht

let oldAnimate = homeScene.animate

homeScene.animate = () => {
    oldAnimate()

    if (camera) {
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, mouse.x * Math.PI * mouseRotationFaktor, 0.05);
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, mouse.y * Math.PI * mouseRotationFaktor, 0.05);
    }
}

window.addEventListener('mousemove', event => {
    mouse = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
    };
})

window.addEventListener('touchmove', event => {
    event.preventDefault(); // Verhindere das Scrollen der Seite bei Touch-Bewegungen
    const touch = event.touches[0]; // Erfasse die Position des ersten Fingers

    mouse = {
        x: (touch.clientX / window.innerWidth) * 2 - 1,
        y: (touch.clientY / window.innerHeight) * 2 - 1,
    };
}, { passive: false });

homeScene.animate()
```

## Loading Bar example (tailwind)
```html
<div class="fixed top-0 left-0 w-screen h-screen backdrop-blur z-50 flex justify-center items-center" id="progressWrapper">
    <div class="w-1/2 bg-white h-10 overflow-hidden rounded-full">
        <div
                id="progress"
                class="h-full bg-purple-800 p-0.5 text-center text-xs font-medium leading-none text-white flex justify-center items-center"
                style="width: 0"
        >
            0%
        </div>
    </div>
</div>
```
