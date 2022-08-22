import { Pane } from 'tweakpane'

class DebugPane_ {
  constructor() {
    this.pane = new Pane()
    this.folders = []
  }

  createFolder(folderName, expanded = true) {
    try {
      const doesExist = this.folders.some(({ name }) => name === folderName)
      console.log({ doesExist, folderName, pane: this.pane })
      if (!doesExist) {
        const newFolder = this.pane.addFolder({
          title: folderName,
          expanded,
        })

        this.folders.push({
          name: folderName,
          folder: newFolder,
        })
      }
    } catch (error) {
      console.error('createFolder', { error })
    }
  }

  addSlider(obj, name, params, folderName) {
    try {
      let f
      if (folderName) f = this.folders.find(({ name }) => name === folderName)

      console.log({ f, folders: this.folders })

      if (f) {
        f.folder.addInput(obj, name, params)
      } else {
        this.pane.addInput(obj, name, params)
      }
    } catch (error) {
      console.error('addSlider', { error })
    }
  }

  addColorPicker(obj, name, params, callback) {
    this.pane.addInput(obj, name, params).on('change', ({ value }) => {
      callback(value)
    })
  }
}

const DebugPane = new DebugPane_()
export default DebugPane
