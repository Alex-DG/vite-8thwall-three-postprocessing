import modelSrc from '../../assets/models/face.glb'
import Dummy from './Dummy'
import XRayMaterial from './Shaders/XRay'
import DebugPane from './Utils/DebugPane'

class Face {
  constructor(options) {
    this.scene = options.scene
    this.camera = options.camera
    this.gltfLoader = options.gltfLoader

    this.group = new THREE.Group()
    this.scene.add(this.group)

    this.xRayMaterial = new XRayMaterial()

    this.eyes = []

    this.bind()
    this.init()
  }

  bind() {}

  debug() {
    const params = {
      color: '0x84ccff',
    }
    const onColorChange = (value) => {
      this.xRayMaterial.uniforms.uGlowColor.value = new THREE.Color(value)
    }

    const folderName = 'Face'
    DebugPane.createFolder(folderName, false)

    DebugPane.addSlider(
      this.xRayMaterial.uniforms.uPower,
      'value',
      {
        min: -10,
        max: 10,
        step: 0.001,
        label: 'power',
      },
      folderName
    )

    DebugPane.addSlider(
      this.xRayMaterial.uniforms.uOpacity,
      'value',
      {
        min: 0,
        max: 1,
        step: 0.001,
        label: 'opacity',
      },
      folderName
    )

    DebugPane.addColorPicker(
      params,
      'color',
      {
        label: 'glow',
      },
      onColorChange,
      folderName
    )
  }

  async init() {
    const model = await this.gltfLoader.loadAsync(modelSrc)
    this.instance = model.scene

    this.instance.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.material = this.xRayMaterial

        if (child.name.toLowerCase().includes('eye')) {
          child.visible = false
        }
      }
    })

    this.box1 = new Dummy({ scene: model.scene })
    this.box1.instance.scale.set(0.05, 0.05, 0.05)
    this.box1.instance.position.x = -0.15
    this.box1.instance.position.y = 0.15

    this.box2 = new Dummy({ scene: model.scene })
    this.box2.instance.scale.set(0.075, 0.075, 0.075)
    this.box2.instance.position.x = 0.17
    this.box2.instance.position.y = -0.2

    this.group.add(this.instance)
    this.hide()
    this.debug()
  }

  show({ detail }) {
    if (detail.name === 'sphere_target') {
      this.group.position.copy(detail.position)
      this.group.quaternion.copy(detail.rotation)

      const scale = detail.scale * 4
      this.group.scale.set(scale, scale, scale)
      this.group.visible = true
    }
  }

  hide() {
    this.group.visible = false
  }

  update() {
    if (this.instance) {
      const time = performance.now() * 0.001
      this.instance.position.y =
        Math.sin(this.instance.position.y + time) * -0.025
      this.instance.rotation.y = Math.sin(Math.PI + time) * 0.11

      // this.eyes.forEach((eye) => {
      //   eye.lookAt(this.camera.position)
      // })

      this.box1.update()
      this.box2.update()
    }
  }
}

export default Face
