import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import Badassium from '../Experience/Badassium'
import Dummy from '../Experience/Dummy'
import Face from '../Experience/Face'

export const initWorldPipelineModule = () => {
  let box
  let badassium
  let face

  const init = () => {
    const { scene, camera } = XR8.Threejs.xrScene()

    const textureLoader = new THREE.TextureLoader()
    const gltfLoader = new GLTFLoader()

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0, 2, 1)
    scene.add(directionalLight)

    // box = new Dummy({ scene })
    badassium = new Badassium({ scene, textureLoader })
    face = new Face({ scene, gltfLoader, camera })

    console.log('✨', 'World ready')
  }

  const updateWorld = () => {
    box?.update()
    badassium?.update()
    face?.update()
  }

  // Places content over image target
  const showTarget = ({ detail }) => {
    // box?.show({ detail })
    badassium?.show({ detail })
    face?.show({ detail })
  }

  // Hides the image frame when the target is no longer detected.
  const hideTarget = ({ detail }) => {
    badassium?.hide()
    face?.hide()
  }

  return {
    name: 'world',

    onStart: () => init(),

    onUpdate: () => updateWorld(),

    // Listeners are called right after the processing stage that fired them. This guarantees that
    // updates can be applied at an appropriate synchronized point in the rendering cycle.
    listeners: [
      { event: 'reality.imagefound', process: showTarget },
      { event: 'reality.imageupdated', process: showTarget },
      { event: 'reality.imagelost', process: hideTarget },
    ],
  }
}
