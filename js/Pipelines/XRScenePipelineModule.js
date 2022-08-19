import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

import { combineShaderFrag, combineShaderVert } from './combinedShader'

const params = {
  exposure: 1,
  strength: 1.5,
  threshold: 0,
  radius: 0,
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
  const scene = new THREE.Scene()
  return scene
}

const setCamera = ({ sizes }) => {
  const aspect = sizes.width / sizes.height
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)

  camera.position.set(0, 2, 10)

  XR8.XrController.updateCameraProjectionMatrix({
    origin: camera.position,
    facing: camera.quaternion,
  })

  return camera
}

const setRenderer = ({ canvas, sizes, GLctx }) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: GLctx,
    alpha: true,
    antialias: true,
  })

  renderer.debug.checkShaderErrors = false // speeds up loading new materials
  renderer.autoClear = false
  renderer.autoClearDepth = false
  renderer.setClearColor(0xffffff, 0)
  renderer.toneMapping = THREE.ReinhardToneMapping
  renderer.toneMappingExposure = params.exposure

  return renderer
}

/**
 * Define an 8th Wall XR Camera Pipeline Module that adds a cube to a threejs scene on startup.
 */

export const initXRScenePipelineModule = () => {
  let engaged = false

  // Scene setup
  let scene
  let camera
  let renderer
  let sizes

  let xrSceneData

  // Post processing setup
  let cameraTexture
  let sceneTarget
  let bloomComposer
  let copyPass
  let bloomPass
  let composer
  let combinePass

  const cameraTextureCopyPosition = new THREE.Vector2(0, 0)
  const combineShader = {
    uniforms: {
      cameraTexture: { value: undefined },
      tDiffuse: { value: null },
      useAdditiveBlend: { value: false },
    },
    fragmentShader: combineShaderFrag,
    vertexShader: combineShaderVert,
  }

  ////////////////////////////////////////////////////////////////////////////////

  const xrScene = () => xrSceneData

  const initXrScene = ({ canvas, canvasWidth, canvasHeight, GLctx }) => {
    if (engaged) return

    // Sizes
    sizes = setSizes({ canvasWidth, canvasHeight })
    // Scene
    scene = setScene()
    // Camera
    camera = setCamera({ sizes })
    scene.add(camera)
    // Renderer.
    renderer = setRenderer({ canvas, sizes, GLctx })

    /**
     * POST-PROCESSING
     */
    sceneTarget = new THREE.WebGLRenderTarget(canvasWidth, canvasHeight, {
      generateMipmaps: false,
    })

    // Bloom Composer
    bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false

    // Copy scene into bloom
    copyPass = new TexturePass(sceneTarget.texture)
    bloomComposer.addPass(copyPass)

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvasWidth, canvasHeight),
      2,
      0.2,
      0
    )
    bloomPass.clearColor = new THREE.Color(0xffffff)
    bloomComposer.addPass(bloomPass)

    // Final composer
    composer = new EffectComposer(renderer)
    composer.addPass(copyPass)

    // Combine scene and camerafeed pass
    combinePass = new ShaderPass(combineShader)
    combinePass.clear = false
    combinePass.renderToScreen = true
    composer.addPass(combinePass)

    // XR Scene Data
    xrSceneData = { scene, camera, renderer }
    window.xrSceneData = xrSceneData
    window.XR8.Threejs.xrScene = xrScene

    // Prevent scroll/pinch gestures on canvas
    canvas.addEventListener('touchmove', (event) => {
      event.preventDefault()
    })

    // Ready ✨
    engaged = true
    console.log('🤖', 'XR Scene ready')
  }

  // This is a workaround for https://bugs.webkit.org/show_bug.cgi?id=237230
  // Once the fix is released, we can add `&& parseFloat(device.osVersion) < 15.x`
  const device = XR8.XrDevice.deviceEstimate()
  const needsPrerenderFinish =
    device.os === 'iOS' && parseFloat(device.osVersion) >= 15.4

  return {
    name: 'init',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    onStart: (args) => initXrScene(args), // Add objects set the starting camera position.

    onDetach: () => {
      engaged = false
    },
    onUpdate: ({ processCpuResult }) => {
      const realitySource =
        processCpuResult.reality || processCpuResult.facecontroller

      if (!realitySource) return

      const { rotation, position, intrinsics } = realitySource

      for (let i = 0; i < 16; i++) {
        camera.projectionMatrix.elements[i] = intrinsics[i]
      }

      // Fix for broken raycasting in r103 and higher. Related to:
      //   https://github.com/mrdoob/three.js/pull/15996
      // Note: camera.projectionMatrixInverse wasn't introduced until r96 so check before setting
      // the inverse
      if (camera.projectionMatrixInverse) {
        if (camera.projectionMatrixInverse.invert) {
          // THREE 123 preferred version
          camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
        } else {
          // Backwards compatible version
          camera.projectionMatrixInverse.getInverse(camera.projectionMatrix)
        }
      }

      if (rotation) camera.setRotationFromQuaternion(rotation)

      if (position) camera.position.set(position.x, position.y, position.z)
    },
    onCanvasSizeChange: ({
      canvasWidth,
      canvasHeight,
      videoWidth,
      videoHeight,
    }) => {
      if (!engaged) return

      setSizes({ canvasWidth, canvasHeight })

      cameraTexture = new THREE.DataTexture(
        new Uint8Array(canvasWidth * canvasHeight * 3),
        canvasWidth,
        canvasHeight,
        THREE.RGBAFormat
      )

      renderer.setSize(canvasWidth, canvasHeight)
      const pixelRatio = THREE.MathUtils.clamp(window.devicePixelRatio, 1, 2)
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

      // Working:
      // renderer.clearDepth()

      // if (needsPrerenderFinish) {
      //   renderer.getContext().finish()
      //   // renderer.getContext().flush()
      // }

      // renderer.render(scene, camera)
    },
    xrScene: () => xrScene,
  }
}
