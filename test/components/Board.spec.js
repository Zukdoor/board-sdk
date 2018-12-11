import jsdom from 'jsdom'
import chai from 'chai'
import Board from '../../src/components/Board'
chai.should()

// Configure JSDOM
const {JSDOM} = jsdom
const dom = new JSDOM(`<!DOCTYPE html><body><div><canvas id="test" width="800" height="600"></canvas></div></body>`, {
  url: 'https://example.org/',
  pretendToBeVisual: true,
})

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
  })

  it('can draw a line', () => {
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(170)
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
    board.layerDraw.trigger('object:modified', {target: board.layerDraw._objects[0]})
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

    // board.layerDraw.discardActiveObject()
    sel.left += 50
    board.layerDraw._objects[0].setCoords()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(-175.5)
    board.layerDraw.trigger('object:modified', {target: sel})
    board.undo()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(170)
    board.redo()
    board.layerDraw._objects[0].aCoords.tl.x.should.equal(-175.5)
  })

  it('can set background color', () => {
    board.setBackground('blue')
    board.layerDraw.backgroundColor.should.equal('blue')
  })
})
