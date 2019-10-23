/*
 * Functions for validating and parsing ASCII map data.
 *
 * Here's an example of a straight path from start "S" to goal "G":
 *
 *   const MAP = [
 *     'G',
 *     'P',
 *     'P',
 *     'S',
 *   ]
 *
 * Note that:
 *   - Rows must be odd in length so that there's a center column
 *   - Each row must be the same length
 *   - There's no limit on the length or number of rows
 *   - The bottom row must have a single, central "S"-type entry point.
 */


export function validateMapData (mapData) {
  // Check that row lengths are as expected.
  let rowLengths = Array.from(new Set(mapData.map(s => s.length)))
  if (rowLengths.length === 0) {
    throw "Zero rows"
  }
  if (rowLengths.length !== 1) {
    throw `Multiple row lengths: ${rowLengths}`
  }
  if (rowLengths[0] % 2 === 0) {
    throw `Row length must be odd but is: ${rowLengths[0]}`
  }

  // Check that the bottom row comprises a single, central entry point.
  const lastRow = mapData[mapData.length - 1]
  const expectedLastRow = "S"
      .padStart(Math.ceil(lastRow.length / 2), " ")
      .padEnd(lastRow.length, " ")

  if (lastRow !== expectedLastRow) {
    throw "Last row must comprise a single, central entry point"
  }
}


function PathFinder (mapData) {
  /*
   * Return a generator that identifies and yields the row/col coordinates
   * and symbol for the path defined in an ASCII map object. It does this
   * by finding the next nearest, not-yet-visited neighboring symbol within
   * a 3 x 3 grid with the most recently visited point at the center, e.g.:
   *
   *   0 0 0
   *   0 1 0
   *   0 0 0
   *
   * Where "1" is the most recently visited point and "0" is a neighboring
   * cell.
   *
   * For each identified neighboring symbol, this function yields:
   *
   *   [ <row>, <col>, <symbol> ]
   *
   */
  // Reverse the map data to move from bottom to top.
  mapData = Array.from(mapData).reverse()

  const numRows = mapData.length
  const numCols = mapData[0].length
  const maxRowIndex = numRows - 1
  const maxColIndex = numCols - 1

  // Define a bit map array and helper interface functions to keep track
  // of which positions we've already visited.
  const visitedCoordinateBitmap = new Array(numRows)
  visitedCoordinateBitmap.fill(0)
  const markVisited = (row, col) => visitedCoordinateBitmap[row] |= 1 << col
  const wasVisited = (row, col) => (visitedCoordinateBitmap[row] & 1 << col) !== 0

  function* nearestNeighborFinder (row, col) {
    while (true) {
      // Calculate the corners of the 3x3 grid around the specified (row, col).
      const minRow = Math.max(row - 1, 0)
      const maxRow = Math.min(row + 1, maxRowIndex)
      const minCol = Math.max(col - 1, 0)
      const maxCol = Math.min(col + 1, maxColIndex)
      // Starting at the bottom-left corner of the grid, iterate through each col
      // and row collecting the coordinates of all of the clostest non-whitespace
      // symbols that are not current (row, col) and hasn't already been visited.
      let minDistance = undefined
      let coords = []
      for (let r = minRow; r <= maxRow; r += 1) {
        for (let c = minCol; c <= maxCol; c += 1) {
          if (mapData[r][c] !== " " && !(r === row && c === col)
              && !wasVisited(r, c)) {
            // Found a non-whitespace symbol that is not the current (row, col)
            // and hasn't already been visited.
            // Calculate a simple offset distance between this point and (row, col).
            const distance = Math.abs(row - r) + Math.abs(col - c)
            if (minDistance === undefined || distance < minDistance) {
              // This is the first one we've found or it's closer than the previously
              // found symbols, so set minDistance to this distance and reinit coords to
              // this single point.
              minDistance = distance
              coords = [[r, c]]
            } else if (distance === minDistance) {
              // This symbol is as close as the others we've found, so add it to the list.
              coords.push([r, c])
            }
          }
        }
      }
      if (coords.length === 0) {
        // If no eligible neighbors were found, terminate the generator with a return.
        return
      } else if (coords.length === 1) {
        // A single eligible neighbor was found so mark it visited and yield it.
        [row, col] = coords[0]
        markVisited(row, col)
        yield [row, col, mapData[row][col]]
      } else {
        // For now, consider multiple eligible neighbors to be an error.
        throw `Multiple active neighbors found for row ${row}, col ${col}`
      }
    }
  }

  // Start looking for neighbors below the column where "S" appears in the bottom row.
  return nearestNeighborFinder(-1, mapData[0].indexOf("S"))
}


export function Map (ctx, map_symbol_ctx_prop_map) {

  function draw (mapData, {originX, originY, offsetX, offsetY, rotation, cellSize, scale}) {
    const scaledCellSize = cellSize * scale
    const data_width = mapData[0].length
    const rowToY = row => -scaledCellSize * row
    const colToX = col => -(data_width / 2 - col) * scaledCellSize + scaledCellSize / 2

    ctx.save()
    ctx.lineJoin = "round"
    ctx.lineWidth = scaledCellSize
    ctx.translate(originX, originY)
    // Specify rotation degrees in radians.
    ctx.rotate(rotation * Math.PI / 180)
    ctx.translate(offsetX, offsetY)

    ctx.beginPath()
    let lastX, lastY, lastSymbol
    for (let [row, col, symbol] of PathFinder(mapData)) {
      const x = colToX(col)
      const y = rowToY(row)
      if (symbol !== lastSymbol) {
        ctx.stroke()
        ctx.closePath()
        // Update the context with symbol-specific properties.
        for (let [k, v] of Object.entries(map_symbol_ctx_prop_map[symbol])) {
          ctx[k] = v
        }
        ctx.beginPath()
        if (lastX !== undefined) {
          ctx.moveTo(lastX, lastY)
        }
        lastSymbol = symbol
      }
      ctx.lineTo(x, y)
      lastX = x
      lastY = y
    }

    ctx.stroke()
    ctx.restore()
  }

  return {draw}
}
