import baseTextureSrc from '../../assets/textures/white_square.jpg'
import alphaTextureSrc from '../../assets/textures/atom_alphamap.jpg'

import vertexShader from './Shaders/Badassium/vertex.glsl'
import fragmentShader from './Shaders/Badassium/fragment.glsl'

class Badassium {
  constructor(options) {
    this.scene = options.scene
    this.group = new THREE.Group()
    this.scene.add(this.group)
    this.textureLoader = options.textureLoader

    this.bind()
    this.init()
  }

  bind() {
    this.createGeometryCenterAttribute =
      this.createGeometryCenterAttribute.bind(this)
  }

  debug() {}

  createGeometryCenterAttribute(r = 4, d = 4) {
    let geometry = new THREE.IcosahedronGeometry(r, d)

    const vectors = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
    ]

    const position = geometry.attributes.position
    const centers = new Float32Array(position.count * 3)

    for (let i = 0, l = position.count; i < l; i++) {
      vectors[i % 3].toArray(centers, i * 3)
    }

    geometry.setAttribute('center', new THREE.BufferAttribute(centers, 3))

    return geometry
  }

  async init() {
    const [baseTexture, alphaTexture] = await Promise.all([
      this.textureLoader.loadAsync(baseTextureSrc),
      this.textureLoader.loadAsync(alphaTextureSrc),
    ])

    const geometry = this.createGeometryCenterAttribute()

    const atomMaterial = new THREE.PointsMaterial({
      size: 0.8,
      color: 0x0567ba,
      map: baseTexture,
      alphaMap: alphaTexture,
      transparent: true,
      depthWrite: false,
    })

    const bondMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
      transparent: true, // this is important for the alpha value to work in the fragment shader
    })

    const spherePoints = new THREE.Points(geometry, atomMaterial)
    const sphereLines = new THREE.Mesh(geometry, bondMaterial)

    this.group.add(spherePoints, sphereLines)
  }

  update() {
    this.group.rotation.y += 0.01
  }
}

export default Badassium
