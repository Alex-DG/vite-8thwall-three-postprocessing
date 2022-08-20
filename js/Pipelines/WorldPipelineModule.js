import Badassium from '../Experience/Badassium'
import Dummy from '../Experience/Dummy'

export const initWorldPipelineModule = () => {
  let box
  let badassium

  const init = () => {
    const { scene } = XR8.Threejs.xrScene()

    const textureLoader = new THREE.TextureLoader()

    // box = new Dummy({ scene })
    badassium = new Badassium({ scene, textureLoader })

    console.log('✨', 'World ready')
  }

  const updateWorld = () => {
    // box?.update()
    badassium?.update()
  }

  return {
    name: 'world',

    onStart: () => init(),

    onUpdate: () => updateWorld(),
  }
}
