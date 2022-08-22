import DebugPane from '../../../Experience/Utils/DebugPane'

export const debugRenderer = (renderer) => {
  const folderName = 'Renderer'
  DebugPane.createFolder(folderName)

  DebugPane.addSlider(
    renderer,
    'toneMappingExposure',
    {
      min: 0,
      max: 4,
      step: 0.001,
      label: 'exposure',
    },
    folderName
  )
}

export const debugBloomPass = (pass) => {
  const folderName = 'Bloom'
  DebugPane.createFolder(folderName)

  DebugPane.addSlider(
    pass,
    'strength',
    {
      min: 0,
      max: 3,
      step: 0.01,
    },
    folderName
  )

  DebugPane.addSlider(
    pass,
    'radius',
    {
      min: 0,
      max: 1,
      step: 0.001,
    },
    folderName
  )

  DebugPane.addSlider(
    pass,
    'threshold',
    {
      min: 0,
      max: 1,
      step: 0.001,
    },
    folderName
  )
}
