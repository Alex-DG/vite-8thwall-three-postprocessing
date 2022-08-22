import { ShaderMaterial, AdditiveBlending, ShaderChunk, Color } from 'three'

const vertexShader = `
uniform float uPower;
varying float vIntensity;
${ShaderChunk.skinning_pars_vertex}
void main() {
  vec3 vNormal = normalize(normalMatrix * normal);
  
  mat4 modelViewProjectionMatrix = projectionMatrix * modelViewMatrix;
  ${ShaderChunk.beginnormal_vertex}
  ${ShaderChunk.skinbase_vertex}
  ${ShaderChunk.skinnormal_vertex}

  vec3 transformed = vec3(position);

  ${ShaderChunk.skinning_vertex}

  gl_Position = modelViewProjectionMatrix * vec4(transformed, 1.0);
  vIntensity = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), uPower);
}
`

const fragmentShader = `
uniform vec3 uGlowColor;
uniform float uOpacity;
varying float vIntensity;
void main()
{
    vec3 glow = uGlowColor * vIntensity;
    gl_FragColor = vec4( glow, uOpacity );
}
`

class XRayMaterial extends ShaderMaterial {
  constructor() {
    super({
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      wireframe: true,
      uniforms: {
        uPower: { value: 3.0 },
        uOpacity: { value: 1.0 },
        uGlowColor: { value: new Color(0x84ccff) },
      },
      vertexShader,
      fragmentShader,
    })
  }
}

export default XRayMaterial
