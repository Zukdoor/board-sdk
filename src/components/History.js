/**
 * 白板历史数据
 * @constructor
 */
class History {
  /**
   * 创建历史数据对象
   */
  constructor() {
    this.objects = []
    this.operations = []
    this.currentOperationNumber = -1
  }

  /**
   * 历史记录是否可以移动
   * @param {number} step 历史记录移动的方向
   * @return {boolean} 可以进行移动，返回true，否则返回false
   */
  canMove(step) {
    return this.currentOperationNumber + step >= -1 && this.currentOperationNumber + step < this.operations.length
  }

  /**
   * 进行历史记录的移动
   * @param {fabric.Canvas} canvas 操作的画布对象
   * @param {number} step 历史记录移动的方向
   */
  move(canvas, step) {
    if (!this.canMove(step)) return
    let currentOperation
    if (step === 1) {
      currentOperation = this.operations[this.currentOperationNumber + step]
    } else if (step === -1) {
      currentOperation = this.operations[this.currentOperationNumber]
    }
    this.currentOperationNumber += step
    currentOperation.forEach(objectId => {
      const object = this.objects.find(object => {
        return object._id === objectId
      })
      const lastObject = object.states[object.currentStateNumber] || null
      const newObject = object.states[object.currentStateNumber + step] || null
      object.currentStateNumber += step

      // 分别处理不同情况
      // [情况一]当前状态为空，此时需要重新插入这一对象
      if (lastObject === null) {
        canvas.add(newObject)
      }

      // [情况二]新状态为空，此时需要删除这一对象
      if (newObject === null) {
        canvas._objects.splice(
          canvas._objects.findIndex(object => {
            return object._id === lastObject._id
          }),
          1,
        )
      }

      // [情况三]当前状态和新状态均不为空，此时需要删除再插入
      if (lastObject !== null && newObject !== null) {
        canvas._objects.splice(
          canvas._objects.findIndex(object => {
            return object._id === lastObject._id
          }),
          1,
        )
        canvas.add(newObject)
      }
    })

    // 触发画布重绘
    canvas.requestRenderAll()
  }

  /**
   * 增加新对象
   * @param {object} object 新增的对象
   */
  addObject(object) {
    this.truncate()
    let initialState
    object.clone(
      cloned => {
        initialState = cloned
      },
      ['_id'],
    )
    this.objects.push({
      states: [initialState],
      currentStateNumber: 0,
      _id: object._id,
    })
    this.operations.push([object._id])
    this.currentOperationNumber++
  }

  /**
   * 修改原有对象
   * @param {object} object 新进行的修改操作
   */
  addOperation(object) {
    this.truncate()

    // 若为单对象操作
    if (!object.hasOwnProperty('_objects')) {
      this.operations.push([object._id])
      const target = this.objects.find(obj => {
        return obj._id === object._id
      })
      let newState
      object.clone(
        cloned => {
          newState = cloned
        },
        ['_id'],
      )
      target.states.push(newState)
      target.currentStateNumber++
    }

    // 否则为多对象操作
    else {
      this.operations.push(
        object._objects.map(obj => {
          return obj._id
        }),
      )
      object._objects.forEach(obj => {
        const target = this.objects.find(ob => {
          return ob._id === obj._id
        })
        let newState
        obj.clone(
          cloned => {
            newState = cloned
          },
          ['_id'],
        )
        target.states.push(newState)
        target.currentStateNumber++
      })
    }
    this.currentOperationNumber++
  }

  /**
   * 将所有状态历史和操作历史数组在当前游标处截断
   */
  truncate() {
    this.objects.forEach(object => {
      object.states = object.states.slice(0, object.currentStateNumber + 1)
    })
    this.operations = this.operations.slice(0, this.currentOperationNumber + 1)
  }
}

export default History
