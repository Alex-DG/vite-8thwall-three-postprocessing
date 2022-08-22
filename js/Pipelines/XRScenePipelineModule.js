import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Vector2,
  MathUtils,
  DataTexture,
  RGBFormat,
  Color,
  WebGLRenderTarget,
  ReinhardToneMapping,
} from 'three'

import { UnrealBloomPass } from './Config/Postprocessing/AlphaUnrealBloomPass.js'

import {
  combineShaderFrag,
  combineShaderVert,
} from './Config/Shaders/CombinedShader.js'
import { debugBloomPass, debugRenderer } from './Config/Debug/index.js'

// Unreal Bloom Configuration
const params = {
  exposure: 1,
  strength: 2,
  threshold: 0,
  radius: 0.2,
}

/**
 * Scene setters
 */
const setSizes = ({ canvasWidth, canvasHeight }) => {
  const sizes = {
    width: canvasWidth,
    height: canvasHeight,
  }
  return sizes
}

const setScene = () => {
  const scene = new Scene()
  return scene
}

const setCamera = ({ sizes }) => {
  const aspect = sizes.width / sizes.height
  const camera = new PerspectiveCamera(75, aspect, 0.1, 1000)

  camera.position.set(0, 3, 0)

  XR8.XrController.updateCameraProjectionMatrix({
    origin: camera.position,
    facing: camera.quaternion,
  })

  return camera
}

const setRenderer = ({ canvas, GLctx }) => {
  const renderer = new WebGLRenderer({
    canvas,
    context: GLctx,
    alpha: true,
    antialias: true,
  })
  renderer.debug.checkShaderErrors = false // speeds up loading new materials
  renderer.autoClear = false
  renderer.autoClearDepth = false
  renderer.setClearColor(0xffffff, 0)
  renderer.toneMapping = ReinhardToneMapping
  renderer.toneMappingExposure = params.exposure
  // renderer.setSize(canvasWidth, canvasHeight)
  debugRenderer(renderer)

  return renderer
}

const setPostprocessing = ({ renderer, combineShader, sizes }) => {
  const sceneTarget = new WebGLRenderTarget(sizes.width, sizes.height, {
    generateMipmaps: false,
  })

  // Bloom Composer
  const bloomComposer = new EffectComposer(renderer)
  bloomComposer.renderToScreen = false

  // Copy scene into bloom
  const copyPass = new TexturePass(sceneTarget.texture)
  bloomComposer.addPass(copyPass)

  // Bloom Pass
  const bloomPass = new UnrealBloomPass(
    new Vector2(sizes.width, sizes.height),
    1.5,
    0.4,
    0.85
  )
  bloomPass.clearColor = new Color(0xffffff)
  bloomPass.threshold = params.threshold
  bloomPass.strength = params.strength
  bloomPass.radius = params.radius

  debugBloomPass(bloomPass)
  bloomComposer.addPass(bloomPass)

  // Final composer
  const composer = new EffectComposer(renderer)
  composer.addPass(copyPass)

  // Combine scene and camerafeed pass
  const combinePass = new ShaderPass(combineShader)
  combinePass.clear = false
  combinePass.renderToScreen = true
  composer.addPass(combinePass)

  return {
    bloomComposer,
    composer,
    combinePass,
    bloomPass,
    sceneTarget,
    copyPass,
    sceneTarget,
  }
}

export const initXRScenePipelineModule = () => {
  let isSetup = false
  let xrSceneData = null
  let cameraTexture = null

  const cameraTextureCopyPosition = new Vector2(0, 0)
  const combineShader = {
    uniforms: {
      cameraTexture: { value: undefined },
      tDiffuse: { value: null },
      useAdditiveBlend: { value: false },
    },
    fragmentShader: combineShaderFrag,
    vertexShader: combineShaderVert,
  }

  const xrScene = () => xrSceneData

  const initXrScene = ({ canvas, canvasWidth, canvasHeight, GLctx }) => {
    if (isSetup) return

    isSetup = true

    // Sizes
    const sizes = setSizes({ canvasWidth, canvasHeight })

    // Scene
    const scene = setScene()

    // Camera
    const camera = setCamera({ sizes })
    scene.add(camera)

    // Renderer.
    const renderer = setRenderer({ canvas, sizes, GLctx })

    // Post processing

    const {
      combinePass,
      bloomPass,
      sceneTarget,
      copyPass,
      bloomComposer,
      composer,
    } = setPostprocessing({ renderer, combineShader, sizes })

    // XR Scene Data
    xrSceneData = {
      scene,
      camera,
      renderer,
      bloomComposer,
      composer,
      combinePass,
      bloomPass,
      sceneTarget,
      copyPass,
      sceneTarget,
    }

    window.XR8.Threejs.xrScene = xrScene
  }

  return {
    name: 'customthreejs',
    onStart: (args) => initXrScene(args),
    onDetach: () => {
      isSetup = false
    },
    onUpdate: ({ processCpuResult }) => {
      const realitySource =
        processCpuResult.reality || processCpuResult.facecontroller

      if (!realitySource) {
        return
      }

      const { rotation, position, intrinsics } = realitySource
      const { camera } = xrSceneData

      for (let i = 0; i < 16; i++) {
        camera.projectionMatrix.elements[i] = intrinsics[i]
      }

      // Fix for broken raycasting in r103 and higher. Related to:
      //   https://github.com/mrdoob/three.js/pull/15996
      // Note: camera.projectionMatrixInverse wasn't introduced until r96 so check before setting
      // the inverse
      if (camera.projectionMatrixInverse) {
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
      }

      if (rotation) {
        camera.setRotationFromQuaternion(rotation)
      }
      if (position) {
        camera.position.set(position.x, position.y, position.z)
      }
    },
    onCanvasSizeChange: ({
      canvasWidth,
      canvasHeight,
      videoWidth,
      videoHeight,
    }) => {
      if (!isSetup) {
        return
      }
      const {
        renderer,
        bloomComposer,
        composer,
        combinePass,
        bloomPass,
        copyPass,
        sceneTarget,
      } = xrSceneData

      cameraTexture = new DataTexture(
        new Uint8Array(canvasWidth * canvasHeight * 3),
        canvasWidth,
        canvasHeight,
        RGBFormat
      )

      renderer.setSize(canvasWidth, canvasHeight)
      const pixelRatio = MathUtils.clamp(window.devicePixelRatio, 1, 2)
      renderer.pixelRatio = pixelRatio

      // Update render pass sizes
      bloomComposer.setSize(canvasWidth * pixelRatio, canvasHeight * pixelRatio)
      bloomComposer.passes.forEach((pass) => {
        if (pass.setSize) {
          pass.setSize(canvasWidth * pixelRatio, canvasHeight * pixelRatio)
        }
      })
      composer.setSize(canvasWidth * pixelRatio, canvasHeight * pixelRatio)
      composer.passes.forEach((pass) => {
        if (pass.setSize) {
          pass.setSize(canvasWidth * pixelRatio, canvasHeight * pixelRatio)
        }
      })
      if (bloomPass && combinePass && sceneTarget && copyPass) {
        combinePass.uniforms.cameraTexture = { value: cameraTexture }
        combinePass.uniforms.bloomTexture = {
          value: bloomPass.renderTargetsHorizontal[0],
        }
        sceneTarget.setSize(canvasWidth * pixelRatio, canvasHeight * pixelRatio)
        copyPass.uniforms.tDiffuse = { value: sceneTarget.texture }
      }
    },
    onRender: () => {
      const { camera, scene, renderer, sceneTarget, bloomComposer, composer } =
        xrSceneData

      if (cameraTexture) {
        renderer.copyFramebufferToTexture(
          cameraTextureCopyPosition,
          cameraTexture
        )
      }
      if (sceneTarget) {
        renderer.setRenderTarget(sceneTarget)
      }
      renderer.clear()
      renderer.clearDepth()
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)

      bloomComposer.render()
      composer.render()
    },

    // Get a handle to the xr scene, camera, renderer, and composers
    xrScene,
  }
}
