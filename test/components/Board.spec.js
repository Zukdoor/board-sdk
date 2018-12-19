import jsdom from 'jsdom'
import chai from 'chai'
import Board from '../../src/components/Board'
import {MODE} from '../../src/constants/mode'
chai.should()

// Configure JSDOM
const {JSDOM} = jsdom
const dom = new JSDOM(
  `
  <html>
    <body>
      <div>
        <canvas id="test" width="800" height="600"></canvas>
      </div>
      <script>
      </script>
    </body>
  </html>
  `,
  {
    url: 'https://example.org/',
    pretendToBeVisual: true,
  },
)

// Configure global variables
global.window = dom.window
global.document = window.document
global.HTMLElement = window.HTMLElement
global.Element = window.Element
global.localStorage = window.localStorage

const {fabric} = require('../../lib/fabric.min')
global.fabric = fabric

// Test constants
const base64 =
  'data:image/png;base64,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'

// Start tests
describe('Board', () => {
  const canvas = document.getElementById('test')
  const board = new Board(canvas)

  beforeEach(() => {
    board.layerDraw.add(
      new fabric.Line([50, 100, 200, 200], {
        left: 170,
        top: 150,
        stroke: 'red',
      }),
    )
  })

  afterEach(() => {
    board.clear()
    board.startDrawing()
  })

  it('can be cleared', () => {
    board.clear()
    board.layerDraw._objects.length.should.equal(0)
    board.canUndo().should.equal(false)
    board.canRedo().should.equal(false)
  })

  it('can be saved and then loaded', () => {
    board.save()
    board.clear()
    board.layerDraw._objects.length.should.equal(0)
    board.load()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(170)
  })

  it('can get objects', () => {
    board.getObjects().length.should.equal(1)
  })

  it('can export to png', () => {
    board.export().should.equal(base64)
  })

  it('can undo and redo object creation', () => {
    board.undo()
    board.getObjects().length.should.equal(0)
    board.redo()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(170)
  })

  it('can undo and redo object removal', () => {
    const sel = new fabric.ActiveSelection(board.layerDraw.getObjects(), {
      canvas: board.layerDraw,
    })
    board.layerDraw.setActiveObject(sel)
    board.removeSelection()
    board.getObjects().length.should.equal(0)
    board.undo()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(170)
    board.redo()
    board.getObjects().length.should.equal(0)
  })

  it('can undo and redo single object modification', () => {
    board.layerDraw._objects[0].left += 50
    board.layerDraw._objects[0].setCoords()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(220)
    board.layerDraw.fire('object:modified', {target: board.layerDraw._objects[0]})
    board.undo()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(170)
    board.redo()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(220)
  })

  it('can undo and redo multi-objects modification', () => {
    board.layerDraw.add(
      new fabric.Line([50, 100, 200, 200], {
        left: 370,
        top: 350,
        stroke: 'red',
      }),
    )

    const sel = new fabric.ActiveSelection(board.layerDraw.getObjects(), {
      canvas: board.layerDraw,
    })

    sel.left += 50
    board.layerDraw._objects[0].setCoords()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(-175.5)
    board.layerDraw.fire('object:modified', {target: sel})
    board.undo()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(170)
    board.redo()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(-175.5)
  })

  it('can start drawing', () => {
    board.startDrawing()
    board.layerDraw.isDrawingMode.should.equal(true)
    board.layerDraw.selection.should.equal(false)
    board.layerDraw.skipTargetFind.should.equal(true)
  })

  it('can start selecting', () => {
    board.startSelecting()
    board.layerDraw.isDrawingMode.should.equal(false)
    board.layerDraw.selection.should.equal(true)
    board.layerDraw.skipTargetFind.should.equal(false)
  })

  it('can start panning', () => {
    board.startPanning()
    board.mode.should.equal(MODE.PANNING)
    board.layerDraw.selection.should.equal(false)
    board.layerDraw.skipTargetFind.should.equal(true)

    board.layerDraw.fire('mouse:down', {
      e: {x: 100, y: 100},
    })
    board.isDragging.should.equal(true)

    board.layerDraw.fire('mouse:move', {
      e: {x: 200, y: 200},
    })
    board.layerDraw.viewportTransform[4].should.equal(100)
    board.layerDraw.viewportTransform[5].should.equal(100)

    board.layerDraw.fire('mouse:move', {
      e: {x: 100, y: 100},
    })
    board.layerDraw.viewportTransform[4].should.equal(0)
    board.layerDraw.viewportTransform[5].should.equal(0)

    board.layerDraw.fire('mouse:up', {
      e: {x: 300, y: 300},
    })
    board.isDragging.should.equal(false)
  })

  it('can zoom', () => {
    const zoomEvent = deltaY => {
      board.layerDraw.fire('mouse:wheel', {
        e: {
          offsetX: 0,
          offsetY: 0,
          deltaY: deltaY,
          preventDefault: () => {},
          stopPropagation: () => {},
        },
      })
    }

    zoomEvent(200)
    board.layerDraw.getZoom().should.equal(2)

    zoomEvent(-300)
    board.layerDraw.getZoom().should.equal(0.5)

    zoomEvent(100)
    board.layerDraw.getZoom().should.equal(1)
  })

  it('can handle mouse events in SELECT mode', () => {
    board.mode = MODE.SELECT
    board.layerDraw.fire('mouse:down', {
      e: {x: 100, y: 100},
    })

    board.layerDraw.fire('mouse:move', {
      e: {x: 200, y: 200},
    })

    board.layerDraw.fire('mouse:up', {
      e: {x: 300, y: 300},
    })

    board.getObjects().length.should.equal(1)
  })

  it('can draw a line', () => {
    board.drawLine()
    board.mode.should.equal(MODE.LINE)
    board.layerDraw.isDrawingMode.should.equal(false)

    // mousemove before mousedown should have no effects
    board.layerDraw.fire('mouse:move', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(0)
    board.point.y.should.equal(0)

    // handle mousedown
    board.layerDraw.fire('mouse:down', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(100)
    board.point.y.should.equal(100)

    // handle mousemove after mousedown is fired
    board.layerDraw.fire('mouse:move', {
      e: {x: 200, y: 200},
    })

    board.layerDraw._objects[1].x1.should.equal(100)
    board.layerDraw._objects[1].y1.should.equal(100)
    board.layerDraw._objects[1].x2.should.equal(200)
    board.layerDraw._objects[1].y2.should.equal(200)

    // handle mouseup
    board.layerDraw.fire('mouse:up', {
      e: {x: 300, y: 300},
    })

    board.layerDraw._objects[1].x1.should.equal(100)
    board.layerDraw._objects[1].y1.should.equal(100)
    board.layerDraw._objects[1].x2.should.equal(300)
    board.layerDraw._objects[1].y2.should.equal(300)
    board.point.x.should.equal(0)
    board.point.y.should.equal(0)
  })

  it('can draw a rectangle', () => {
    board.drawRect()
    board.mode.should.equal(MODE.RECT)
    board.layerDraw.isDrawingMode.should.equal(false)

    // mousemove before mousedown should have no effects
    board.layerDraw.fire('mouse:move', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(0)
    board.point.y.should.equal(0)

    // handle mousedown
    board.layerDraw.fire('mouse:down', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(100)
    board.point.y.should.equal(100)

    // handle mousemove after mousedown is fired
    board.layerDraw.fire('mouse:move', {
      e: {x: 200, y: 150},
    })

    board.layerDraw._objects[1].left.should.equal(100)
    board.layerDraw._objects[1].top.should.equal(100)
    board.layerDraw._objects[1].width.should.equal(100)
    board.layerDraw._objects[1].height.should.equal(50)

    // handle mouseup
    board.layerDraw.fire('mouse:up', {
      e: {x: 300, y: 250},
    })

    board.layerDraw._objects[1].left.should.equal(100)
    board.layerDraw._objects[1].top.should.equal(100)
    board.layerDraw._objects[1].width.should.equal(200)
    board.layerDraw._objects[1].height.should.equal(150)
    board.point.x.should.equal(0)
    board.point.y.should.equal(0)
  })

  it('can draw a square', () => {
    board.drawSquare()
    board.mode.should.equal(MODE.SQUARE)
    board.isRegularShape.should.equal(true)
    board.layerDraw.isDrawingMode.should.equal(false)

    // mousemove before mousedown should have no effects
    board.layerDraw.fire('mouse:move', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(0)
    board.point.y.should.equal(0)

    // handle mousedown
    board.layerDraw.fire('mouse:down', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(100)
    board.point.y.should.equal(100)

    // handle mousemove after mousedown is fired
    board.layerDraw.fire('mouse:move', {
      e: {x: 200, y: 150},
    })

    board.layerDraw._objects[1].left.should.equal(100)
    board.layerDraw._objects[1].top.should.equal(100)
    board.layerDraw._objects[1].width.should.equal(100)
    board.layerDraw._objects[1].height.should.equal(100)

    // handle mouseup
    board.layerDraw.fire('mouse:up', {
      e: {x: 300, y: 250},
    })

    board.layerDraw._objects[1].left.should.equal(100)
    board.layerDraw._objects[1].top.should.equal(100)
    board.layerDraw._objects[1].width.should.equal(200)
    board.layerDraw._objects[1].height.should.equal(200)
    board.point.x.should.equal(0)
    board.point.y.should.equal(0)
  })

  it('can draw an ellipse', () => {
    board.drawEllipse()
    board.mode.should.equal(MODE.ELLIPSE)
    board.layerDraw.isDrawingMode.should.equal(false)

    // mousemove before mousedown should have no effects
    board.layerDraw.fire('mouse:move', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(0)
    board.point.y.should.equal(0)

    // handle mousedown
    board.layerDraw.fire('mouse:down', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(100)
    board.point.y.should.equal(100)

    // handle mousemove after mousedown is fired
    board.layerDraw.fire('mouse:move', {
      e: {x: 200, y: 150},
    })

    board.layerDraw._objects[1].left.should.equal(100)
    board.layerDraw._objects[1].top.should.equal(100)
    board.layerDraw._objects[1].rx.should.equal(50)
    board.layerDraw._objects[1].ry.should.equal(25)

    // handle mouseup
    board.layerDraw.fire('mouse:up', {
      e: {x: 300, y: 250},
    })

    board.layerDraw._objects[1].left.should.equal(100)
    board.layerDraw._objects[1].top.should.equal(100)
    board.layerDraw._objects[1].rx.should.equal(100)
    board.layerDraw._objects[1].ry.should.equal(75)
    board.point.x.should.equal(0)
    board.point.y.should.equal(0)
  })

  it('can draw a circle', () => {
    board.drawCircle()
    board.mode.should.equal(MODE.CIRCLE)
    board.isRegularShape.should.equal(true)
    board.layerDraw.isDrawingMode.should.equal(false)

    // mousemove before mousedown should have no effects
    board.layerDraw.fire('mouse:move', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(0)
    board.point.y.should.equal(0)

    // handle mousedown
    board.layerDraw.fire('mouse:down', {
      e: {x: 100, y: 100},
    })

    board.point.x.should.equal(100)
    board.point.y.should.equal(100)

    // handle mousemove after mousedown is fired
    board.layerDraw.fire('mouse:move', {
      e: {x: 200, y: 150},
    })

    board.layerDraw._objects[1].left.should.equal(100)
    board.layerDraw._objects[1].top.should.equal(100)
    board.layerDraw._objects[1].rx.should.equal(50)
    board.layerDraw._objects[1].ry.should.equal(50)

    // handle mouseup
    board.layerDraw.fire('mouse:up', {
      e: {x: 300, y: 250},
    })

    board.layerDraw._objects[1].left.should.equal(100)
    board.layerDraw._objects[1].top.should.equal(100)
    board.layerDraw._objects[1].rx.should.equal(100)
    board.layerDraw._objects[1].ry.should.equal(100)
    board.point.x.should.equal(0)
    board.point.y.should.equal(0)
  })
})
