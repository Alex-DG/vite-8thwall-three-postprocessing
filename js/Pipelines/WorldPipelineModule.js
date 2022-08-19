import Dummy from '../Experience/Dummy'

export const initWorldPipelineModule = () => {
  let box

  const init = () => {
    const { scene } = XR8.Threejs.xrScene()

    box = new Dummy({ scene })

    console.log('✨', 'World ready')
  }

  const updateWorld = () => {
    box?.update()
  }

  return {
    name: 'world',

    onStart: () => init(),

    onUpdate: () => updateWorld(),
  }
}
