import * as THREE from 'three'

/**
 * Dummy cube
 */
class Dummy {
  constructor(options) {
    this.scene = options.scene
    this.init()
  }

  init() {
    this.instance = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial({ wireframe: false })
    )
    // this.instance.visible = false
    this.scene.add(this.instance)
  }

  show({ detail }) {
    if (detail.name === 'sphere_target' && !this.instance.visible) {
      this.instance.position.copy(detail.position)
      this.instance.quaternion.copy(detail.rotation)

      const scale = detail.scale
      this.instance.scale.set(scale, scale, scale)
      this.instance.visible = true
    }
  }

  hide() {
    this.instance.visible = false
  }

  update() {
    if (this.instance) {
      this.instance.rotation.x += 0.01
      this.instance.rotation.z += 0.01
    }
  }
}

export default Dummy
