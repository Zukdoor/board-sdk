import History from './History'
import uuid from '../helpers/uuid'
import {MODE} from '../constants/mode'

const REMOVING = true

/**
 * 白板主类
 * @constructor
 */
class Board {
  /**
   * 创建白板对象
   * @param {HTMLElement} node 插入白板的节点
   * @param {object} [options = {}] 选项
   * @property {boolean} [options.interactive = true] 白板是否可交互
   * @property {boolean} [options.fullSelection = true] 框选白板元素的判断方法
   * @param {array} [plugins = []] 需要使用的插件
   * @param {object} [key = {}] 用于鉴权的口令
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
    this._setDefaults()
    this._setListeners()
  }

  /**
   * 为画板设置默认属性值，只在构造时调用
   */
  _setDefaults() {
    this.setBackground()
    this._setShapeProperties()
    this.mode = MODE.DRAWING
    this.point = new fabric.Point(0, 0)
    this.absolutePoint = new fabric.Point(0, 0)
    this.isCreatingShape = false
    this.isDragging = false
    this.isRegularShape = false
  }

  /**
   * 为形状设置默认属性值，只在构造时调用
   */
  _setShapeProperties() {
    this.shapeProperties = {}
    this.setStrokeColor()
    this.setStrokeWidth()
    this.setFillColor()
  }

  /**
   * 为画板设置各种事件的监听，只在构造时调用
   */
  _setListeners() {
    const canvas = this.layerDraw

    canvas.on('object:added', options => {
      this._handleObjectAdded(options)
    })

    canvas.on('object:modified', options => {
      this._handleObjectModified(options)
    })

    canvas.on('mouse:down', options => {
      this._handleMouseDown(options)
    })

    canvas.on('mouse:move', options => {
      this._handleMouseMove(options)
    })

    canvas.on('mouse:up', options => {
      this._handleMouseUp(options)
    })

    canvas.on('mouse:wheel', options => {
      this._handleMouseWheel(options)
    })
  }

  /**
   * 处理ObjectAdded事件
   * @param {object} options
   */
  _handleObjectAdded(options) {
    if (
      this.history.objects.find(object => {
        return object._id === options.target._id
      }) !== undefined
    )
      return
    options.target._id = uuid()
    this.history.addObject(options.target)
  }

  /**
   * 处理ObjectModified事件
   * @param {object} options
   */
  _handleObjectModified(options) {
    this.history.addOperation(options.target)
  }

  /**
   * 处理MouseDown事件
   * @param {object} options
   */
  _handleMouseDown(options) {
    if (this.mode < MODE.PANNING) return
    this.absolutePoint = new fabric.Point(options.e.x, options.e.y)
    this.point = this.getRelativePoint(this.absolutePoint)
    if (this.mode === MODE.PANNING) {
      this.isDragging = true
      return
    }
    this.isCreatingShape = true
    this.layerDraw._objects.push(null)
  }

  /**
   * 处理MouseMove事件
   * @param {object} options
   */
  _handleMouseMove(options) {
    if (!this.isCreatingShape && !this.isDragging) return
    const from = this.point
    const absoluteTo = new fabric.Point(options.e.x, options.e.y)
    const to = this.getRelativePoint(absoluteTo)
    switch (this.mode) {
      case MODE.PANNING:
        const absoluteFrom = this.absolutePoint
        if (this.isDragging) {
          this.layerDraw.viewportTransform[4] += absoluteTo.x - absoluteFrom.x
          this.layerDraw.viewportTransform[5] += absoluteTo.y - absoluteFrom.y
          this.layerDraw.requestRenderAll()
          this.absolutePoint = absoluteTo
        }
        break
      case MODE.LINE:
        const line = this.createLine(from, to)
        this._replaceLastObject(line)
        break
      case MODE.RECT:
        const rect = this.createRect(from, to)
        this._replaceLastObject(rect)
        break
      case MODE.SQUARE:
        const square = this.createRect(from, to)
        this._replaceLastObject(square)
        break
      case MODE.ELLIPSE:
        const ellipse = this.createEllipse(from, to)
        this._replaceLastObject(ellipse)
        break
      case MODE.CIRCLE:
        const circle = this.createEllipse(from, to)
        this._replaceLastObject(circle)
        break
    }
  }

  /**
   * 处理MouseUp事件
   * @param {object} options
   */
  _handleMouseUp(options) {
    if (!this.isCreatingShape && !this.isDragging) return
    const from = this.point
    const to = this.getRelativePoint(new fabric.Point(options.e.x, options.e.y))
    switch (this.mode) {
      case MODE.PANNING:
        this.isDragging = false
        this.point.x = 0
        this.point.y = 0
        this.absolutePoint.x = 0
        this.absolutePoint.y = 0
        break
      case MODE.LINE:
        const line = this.createLine(from, to)
        this._popLastObjectAndAdd(line)
        break
      case MODE.RECT:
        const rect = this.createRect(from, to)
        this._popLastObjectAndAdd(rect)
        break
      case MODE.SQUARE:
        const square = this.createRect(from, to)
        this._popLastObjectAndAdd(square)
        break
      case MODE.ELLIPSE:
        const ellipse = this.createEllipse(from, to)
        this._popLastObjectAndAdd(ellipse)
        break
      case MODE.CIRCLE:
        const circle = this.createEllipse(from, to)
        this._popLastObjectAndAdd(circle)
        break
    }
  }

  /**
   * 处理MouseWheel事件
   * @param {object} options
   */
  _handleMouseWheel(options) {
    const canvas = this.layerDraw
    const delta = options.e.deltaY
    let zoom = canvas.getZoom()
    zoom = zoom + delta / 200
    if (zoom > 2) zoom = 2
    if (zoom < 0.5) zoom = 0.5
    canvas.zoomToPoint({x: options.e.offsetX, y: options.e.offsetY}, zoom)
    options.e.preventDefault()
    options.e.stopPropagation()
  }

  /**
   * 替换白板的最后一个对象并渲染，触发object:added事件
   * @param {fabric.Object} object 用于替换的对象
   */
  _popLastObjectAndAdd(object) {
    this.layerDraw._objects.pop()
    this.layerDraw.add(object)
    this.isCreatingShape = false
    this.point.x = 0
    this.point.y = 0
  }

  /**
   * 替换白板的最后一个对象并渲染，不会触发object:added事件
   * @param {fabric.Object} object 用于替换的对象
   */
  _replaceLastObject(object) {
    this.layerDraw._objects[this.layerDraw._objects.length - 1] = object
    this.layerDraw.requestRenderAll()
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
   * 根据屏幕的绝对坐标计算白板上的相对坐标
   * @param {fabric.Point} abs 绝对坐标
   * @return {fabric.Point} rel 相对坐标
   */
  getRelativePoint(abs) {
    const canvas = this.layerDraw
    const zoom = canvas.getZoom()
    const relX = abs.x / zoom + canvas.vptCoords.tl.x
    const relY = abs.y / zoom + canvas.vptCoords.tl.y
    const rel = new fabric.Point(relX, relY)
    return rel
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
   * @param {string} [color = '#FFFFFF'] 背景颜色
   * @example
   * // 可以使用颜色名称
   * board.setBackground('blue')
   * @example
   * // 可以使用16进制颜色
   * board.setBackground('#0000FF')
   * @example
   * // 可以使用RGB
   * board.setBackground('rgb(0, 0, 255)')
   * // 或者RGBA
   * board.setBackground('rgba(0, 0, 255, 0.3)')
   * @example
   * // 可以使用HSL
   * board.setBackground('hsl(180, 100%, 50%)')
   */
  setBackground(color = '#FFFFFF') {
    this.layerDraw.backgroundColor = color
    this.layerDraw.requestRenderAll()
  }

  /**
   * 设置当前轮廓颜色
   * @param {string} [color = 'black'] 轮廓颜色
   * @example
   * // 参考setBackground()的使用方法
   * board.setStrokeColor('black')
   */
  setStrokeColor(color = 'black') {
    this.shapeProperties.stroke = color
  }

  /**
   * 设置当前填充颜色
   * @param {string} [color = ''] 填充颜色
   * @example
   * // 参考setBackground()的使用方法
   * board.setFillColor('blue')
   */
  setFillColor(color = '') {
    this.shapeProperties.fill = color
  }

  /**
   * 设置当前轮廓粗细
   * @param {integer} [width = 2] 轮廓粗细（为保证绘图效果，建议设置为偶数）
   * @example
   * board.setStrokeWidth(2)
   */
  setStrokeWidth(width = 2) {
    this.shapeProperties.strokeWidth = width
  }

  /**
   * 设置白板的绘制和选择属性
   * @param {boolean} draw 是否可自由绘制
   * @param {boolean} boxSelection 是否可框选
   * @param {boolean} targetSelection 是否可点选
   */
  setDrawAndSelectionProperties(draw, boxSelection, targetSelection) {
    this.layerDraw.isDrawingMode = draw
    this.layerDraw.selection = boxSelection
    this.layerDraw.skipTargetFind = !targetSelection
  }

  /**
   * 进入选择模式
   */
  startSelecting() {
    this.setDrawAndSelectionProperties(false, true, true)
    this.mode = MODE.SELECT
  }

  /**
   * 进入画笔模式
   */
  startDrawing() {
    this.setDrawAndSelectionProperties(true, false, false)
    this.mode = MODE.DRAWING
  }

  /**
   * 进入拖拽模式
   */
  startPanning() {
    this.setDrawAndSelectionProperties(false, false, false)
    this.mode = MODE.PANNING
  }

  /**
   * 进入图形绘制模式
   * @param {integer} mode 绘制模式
   */
  drawShape(mode) {
    this.setDrawAndSelectionProperties(false, false, false)
    this.mode = mode
  }

  /**
   * 绘制规则图形，在RECT|ELLIPSE模式下生效
   */
  drawRegularShape() {
    this.isRegularShape = true
  }

  /**
   * 绘制一般图形
   */
  drawNormalShape() {
    this.isRegularShape = false
  }

  /**
   * 进入线段绘制模式
   */
  drawLine() {
    this.drawNormalShape()
    this.drawShape(MODE.LINE)
  }

  /**
   * 进入矩形绘制模式
   */
  drawRect() {
    this.drawNormalShape()
    this.drawShape(MODE.RECT)
  }

  /**
   * 进入椭圆绘制模式
   */
  drawEllipse() {
    this.drawNormalShape()
    this.drawShape(MODE.ELLIPSE)
  }

  /**
   * 进入圆形绘制模式
   */
  drawCircle() {
    this.drawRegularShape()
    this.drawShape(MODE.CIRCLE)
  }

  /**
   * 进入正方形绘制模式
   */
  drawSquare() {
    this.drawRegularShape()
    this.drawShape(MODE.SQUARE)
  }

  /**
   * 创建线段
   * @param {fabric.Point} from 起始点
   * @param {fabric.Point} to 目标点
   * @return {object} 创建的线段
   */
  createLine(from, to) {
    const line = new fabric.Line([from.x, from.y, to.x, to.y], {
      ...this.shapeProperties,
    })
    return line
  }

  /**
   * 创建矩形
   * @param {fabric.Point} from 起始点
   * @param {fabric.Point} to 目标点
   * @return {object} 创建的矩形
   */
  createRect(from, to) {
    const rect = new fabric.Rect({
      top: Math.min(from.y, to.y),
      left: Math.min(from.x, to.x),
      width: Math.abs(from.x - to.x),
      height: this.isRegularShape ? Math.abs(from.x - to.x) : Math.abs(from.y - to.y),
      ...this.shapeProperties,
    })
    return rect
  }

  /**
   * 创建椭圆
   * @param {fabric.Point} from 起始点
   * @param {fabric.Point} to 目标点
   * @return {object} 创建的椭圆
   */
  createEllipse(from, to) {
    const ellipse = new fabric.Ellipse({
      top: Math.min(from.y, to.y),
      left: Math.min(from.x, to.x),
      rx: Math.abs(from.x - to.x) / 2,
      ry: this.isRegularShape ? Math.abs(from.x - to.x) / 2 : Math.abs(from.y - to.y) / 2,
      ...this.shapeProperties,
    })
    return ellipse
  }

  /**
   * 插入图片
   * @param {string} url 图片的URL地址
   * @param {funtion} callback 回调函数
   */
  insertImage(url, callback) {
    fabric.Image.fromURL(
      url,
      imgObj => {
        this.layerDraw.add(imgObj)
        callback
      },
      {crossOrigin: 'anonymous'},
    )
  }
}

export default Board
