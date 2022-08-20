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
    this.scene.add(this.instance)
  }

  update() {
    if (this.instance) {
      this.instance.rotation.x += 0.01
      this.instance.rotation.y += 0.01
    }
  }
}

export default Dummy
