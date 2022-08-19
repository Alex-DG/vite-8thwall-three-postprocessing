import { ShaderMaterial, AdditiveBlending } from 'three'

import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

class BadassiumMaterial extends ShaderMaterial {
  constructor() {
    super({
      side: THREE.DoubleSide,
      transparent: true, // this is important for the alpha value to work in the fragment shader
      uniforms: {},
      vertexShader,
      fragmentShader,
    })
  }
}

export default BadassiumMaterial
