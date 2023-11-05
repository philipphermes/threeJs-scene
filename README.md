# threeJs-scene
A class to create a scene for three Js

## Example
```js
import Scene from './Scene'

const homeScene = new Scene([
    {
        path: "/assets/models/drone.gltf",
        scale: 0.1,
        shadow: true
    }
])

const scene = homeScene.scene
const renderer = homeScene.renderer
const camera = homeScene.camera
const composer = homeScene.composer

homeScene.addBloom(0.25, 0.25, 0.25)
homeScene.addSMAA()
homeScene.addLight(0, 10, 0, 5)
homeScene.addHDRI('/assets/hdri/kloppenheim_06_puresky_2k.hdr')

homeScene.animate = () => { //You can overwrite the animation method
    requestAnimationFrame(homeScene.animate);

    if (homeScene.objects[0]) {
        homeScene.objects[0].rotation.y += 0.01;
    }

    composer.render(scene, camera);
}

homeScene.animate()
```
## Progressbar example:
```html
<div class="fixed top-0 right-0 w-full bg-neutral-200 dark:bg-neutral-600 h-10" id="progressWrapper">
    <div
            id="progress"
            class="h-full relative bg-blue-500 p-0.5 text-center text-xs font-medium leading-none text-primary-100 flex justify-center items-center"
            style="width: 0"
    >
        0%
    </div>
</div>
```
