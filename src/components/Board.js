import History from './History'
import uuid from '../helpers/uuid'

const REMOVING = true

/**
 * 白板主类
 * @constructor
 */
class Board {
  /**
   * 创建白板对象
   * @param {HTMLElement} node 插入白板的节点
   * @param {object} options 选项
   * @property {boolean} options.interactive 白板是否可交互
   * @property {boolean} options.fullSelection 框选白板元素的判断方法
   * @param {array} plugins 需要使用的插件
   * @param {object} key 用于鉴权的口令
   */
  constructor(node, options = {}, plugins = [], key = {}) {
    const props = {
      width: node.offsetWidth,
      height: node.offsetHeight,
      preserveObjectStacking: true,
      perPixelTargetFind: true,
      targetFindTolerance: 15,
      selectionFullyContained: options.hasOwnProperty('fullSelection') ? options.fullSelection : true,
      interactive: options.hasOwnProperty('interactive') ? options.interactive : true,
      skipTargetFind: false,
      isDrawingMode: true,
    }
    this.layerDraw = new fabric.Canvas(node, props)
    this.history = new History()
    this.setListeners()
  }

  /**
   * 为画板设置各种事件的监听
   */
  setListeners() {
    const canvas = this.layerDraw

    canvas.on('object:added', options => {
      if (
        this.history.objects.find(object => {
          return object._id === options.target._id
        }) !== undefined
      )
        return
      options.target._id = uuid()
      this.history.addObject(options.target)
    })

    canvas.on('object:modified', options => {
      this.history.addOperation(options.target)
    })
  }

  /**
   * 清除白板内容
   */
  clear() {
    this.layerDraw.clear()
    this.history.clear()
  }

  /**
   * 删除选中的元素
   */
  removeSelection() {
    const canvas = this.layerDraw
    const objects = canvas.getActiveObjects()
    canvas.remove(...objects)
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    const operation = {
      _objects: objects,
    }
    this.history.addOperation(operation, REMOVING)
  }

  /**
   * 获取白板上现有的对象
   * @return {array} 一个数组，包含白板上的全部对象
   */
  getObjects() {
    return this.layerDraw._objects.map(object => {
      return {
        path: object.path,
        pathOffset: object.pathOffset,
        scaleX: object.scaleX,
        scaleY: object.scaleY,
        skewX: object.skewX,
        skewY: object.skewY,
      }
    })
  }

  /**
   * 保存白板内容
   */
  save() {
    localStorage.setItem('canvas', JSON.stringify(this.layerDraw.toJSON()))
  }

  /**
   * 加载保存的白板内容
   */
  load() {
    this.layerDraw.loadFromJSON(JSON.parse(localStorage.getItem('canvas')))
  }

  /**
   * 撤销一步操作
   */
  undo() {
    this.history.move(this.layerDraw, -1)
  }

  /**
   * 是否可以撤销
   * @return {boolean} 还有可以撤销的操作，返回true，否则返回false
   */
  canUndo() {
    return this.history.canMove(this.layerDraw, -1)
  }

  /**
   * 重做一步操作
   */
  redo() {
    this.history.move(this.layerDraw, 1)
  }

  /**
   * 是否可以重做
   * @return {boolean} 还有可以重做的操作，返回true，否则返回false
   */
  canRedo() {
    return this.history.canMove(this.layerDraw, 1)
  }

  /**
   * 导出为图片
   * @param {string} format 导出图片的格式，可以选择jpg或png，默认为png
   * @return {string} 一个字符串，为Base64格式的图片
   */
  export(format = 'png') {
    return this.layerDraw.toDataURL({format: format})
  }

  /**
   * 设置画布背景
   * @param {string} color
   * @example
   * // 可以使用颜色名称
   * board.setBackground('blue')
   * // 可以使用16进制颜色
   * board.setBackground('#0000FF')
   * // 可以使用RGB
   * board.setBackground('rgb(0, 0, 255)')
   * // 可以使用RGBA
   * board.setBackground('rgba(0, 0, 255, 0.3)')
   * // 可以使用HSL
   * board.setBackground('hsl(180, 100%, 50%)')
   */
  setBackground(color) {
    this.layerDraw.backgroundColor = color
    this.layerDraw.requestRenderAll()
  }

  /**
   * 退出画笔模式
   */
  stopDrawing() {
    this.layerDraw.isDrawingMode = false
  }

  /**
   * 进入画笔模式
   */
  startDrawing() {
    this.layerDraw.isDrawingMode = true
  }
}

export default Board
