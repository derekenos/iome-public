
export function RollingAverager (size) {
  let arr = new Array(size)
  let numVals = 0
  let i = 0

  function push (v) {
    arr[i] = v
    i = i === size - 1 ? 0 : i + 1
    if (numVals < size) {
      numVals += 1
    }
  }

  function calc () {
    if (numVals === 0) {
      return 0
    }
    return arr.reduce((acc, v) => (v || 0) + acc, 0) / numVals
  }

  return {
    push,
    calc,
  }
}
