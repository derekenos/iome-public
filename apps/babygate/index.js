
import Animator from "../../lib/animator.js"
import Client from "../../lib/client.js"
import Element from "../../lib/element.js"
import InputWatchdog from "../../lib/input_watchdog.js"
import { Audio, TUNING } from "../../lib/audio.js"
import { Map, validateMapData } from "../../lib/ascii_map.js"
import { RollingAverager } from "../../lib/math.js"


async function loadSongs () {
  // Load the songs from a JSON file and return a <name> -> <song> map.
  const songs = await(await fetch("songs.json")).json()
  let nameSongMap = {}
  songs.forEach(song => {
    nameSongMap[song.name] = song
  })
  return nameSongMap
}


const rgbToRgba = (r, g, b) => `rgba(${r}, ${g}, ${b})`
const MAP_SYMBOL_CTX_PROP_MAP = {
  " ": {
    strokeStyle: rgbToRgba(0, 0, 0),
  },
  "S": {
    strokeStyle: rgbToRgba(200, 200, 255),
    lineCap: "butt"
  },
  "P": {
    strokeStyle: rgbToRgba(255, 255, 255),
    lineCap: "round"
  },
  "G": {
    strokeStyle: rgbToRgba(255, 255, 0),
    lineCap: "butt"
  }
}

const parseRGBAString = s => /rgba\((\d+),\s(\d+),\s(\d+)\)/.exec(s).slice(1)
const generateRGBKey = rgb => rgb.join('-')
let RGBA_MAP_SYMBOL_MAP = {}
for (let [k, v] of Object.entries(MAP_SYMBOL_CTX_PROP_MAP)) {
  const rgb = parseRGBAString(MAP_SYMBOL_CTX_PROP_MAP[k].strokeStyle)
  RGBA_MAP_SYMBOL_MAP[generateRGBKey(rgb)] = k
}
const getSymbolForRGB = rgb => RGBA_MAP_SYMBOL_MAP[generateRGBKey(rgb)]

const MAPS = [
  ['G',
   'P',
   'P',
   'P',
   'P',
   'P',
   'P',
   'P',
   'S',
  ],

  ['    G    ',
   '    P    ',
   '    P    ',
   '   P     ',
   '  P      ',
   ' P       ',
   'P        ',
   ' P       ',
   '  P      ',
   '   P     ',
   '    P    ',
   '    P    ',
   '    S    ',
  ],

  ['      G      ',
   '      P      ',
   '      P      ',
   '       P     ',
   '    P   P    ',
   '   P P  P    ',
   '  P   PP     ',
   '  P          ',
   ' P           ',
   '  PPPP       ',
   '      P      ',
   '      P      ',
   '      S      ',
  ],

  ['      G        ',
   '      P        ',
   '      PPPPPPP  ',
   '             P ',
   '  PPPPPPPPP  P ',
   ' P         P P ',
   ' P    PP   P P ',
   '  PPPP  P  P P ',
   '        P  P P ',
   '   PPPPP  P  P ',
   '  P        PP  ',
   '   PPPPPPP     ',
   '          P    ',
   '          P    ',
   '        PP     ',
   '       P       ',
   '       P       ',
   '       S       ',
  ]
]

// Validate the map data.
MAPS.forEach(validateMapData)


function Baby (client) {
  const ctx = client.canvas.getContext("2d")

  function draw () {
    const {crawling, failing, crawlAnim, failAnim} = client.params.baby
    const headDiameter = Math.min(client.width, client.height) / 25
    const centerX = client.width / 2
    const headY = client.height / 2 - headDiameter

    if (crawling) {
      crawlAnim.step()
    } else if (failing) {
      client.params.baby.failing = !failAnim.step()
    }

    ctx.fillStyle = "#000"
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 4

    // Left Leg
    ctx.beginPath()
    ctx.ellipse(
      centerX - headDiameter,
      headY + headDiameter * crawlAnim.linearInterpolate(4, 3) + failAnim.linearInterpolate(0, client.height / 2),
      headDiameter / 2,
      headDiameter * 1.2,
      0,
      0,
      2 * Math.PI
    )
    ctx.stroke()
    ctx.fill()

    // Right Leg
    ctx.beginPath()
    ctx.ellipse(
      centerX + headDiameter + failAnim.linearInterpolate(0, client.width / 2),
      headY + headDiameter * crawlAnim.linearInterpolate(3, 4),
      headDiameter / 2,
      headDiameter * 1.2,
      0,
      0,
      2 * Math.PI
    )
    ctx.stroke()
    ctx.fill()

    // Left Arm
    ctx.beginPath()
    ctx.ellipse(
      centerX - headDiameter - failAnim.linearInterpolate(0, client.width / 2),
      headY + headDiameter + crawlAnim.linearInterpolate(0, 10),
      headDiameter / 2,
      headDiameter * 1.2,
      100,
      0,
      2 * Math.PI
    )
    ctx.stroke()
    ctx.fill()

    // Right Arm
    ctx.beginPath()
    ctx.ellipse(
      centerX + headDiameter,
      headY + headDiameter + crawlAnim.linearInterpolate(10, 0) - failAnim.linearInterpolate(0, client.height / 2 + headDiameter * 3),
      headDiameter / 2,
      headDiameter * 1.2,
      -100,
      0,
      2 * Math.PI
    )
    ctx.stroke()
    ctx.fill()

    // Body
    ctx.beginPath()
    ctx.ellipse(
      centerX,
      headY + headDiameter * 2.4,
      headDiameter * 1.2 * failAnim.linearInterpolate(1, 0),
      headDiameter * 1.5 * failAnim.linearInterpolate(1, 0),
      0,
      0,
      2 * Math.PI
    )
    ctx.stroke()
    ctx.fill()

    // Head
    ctx.beginPath()
    ctx.arc(
      centerX + crawlAnim.linearInterpolate(2, -2),
      headY,
      headDiameter * failAnim.linearInterpolate(1, 0),
      0,
      2 * Math.PI
    )
    ctx.stroke()
    ctx.fill()

    const hitPoints = [
      [centerX, headY - headDiameter - 2],
      [centerX - headDiameter * 1.7, headY],
      [centerX + headDiameter * 1.7, headY],
      [centerX - headDiameter * 1.8, headY + headDiameter],
      [centerX + headDiameter * 1.8, headY + headDiameter],
      [centerX - headDiameter * 1.6, headY + headDiameter * 3],
      [centerX + headDiameter * 1.6, headY + headDiameter * 3],
      //[centerX - headDiameter * 1.6, headY + headDiameter * 4.5],
      //[centerX + headDiameter * 1.6, headY + headDiameter * 4.5],
    ]

    // Display hit points
    // ctx.fillStyle = "#f00"
    // for (let [x, y] of hitPoints) {
    //   ctx.beginPath()
    //   ctx.arc(
    //     x,
    //     y,
    //     5,
    //     0,
    //     2 * Math.PI
    //   )
    //   ctx.fill()
    // }
    // ctx.fillStyle = "#000"
    return hitPoints
  }

  return {draw}
}


async function start (client) {
  let params = {
    game: {
      currentMapIndex: 0
    }
  }
  client.params = params
  const resetParams = () => {
    params.map = {
      originX: client.width / 2,
      originY: client.height / 2,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      cellSize: Math.min(client.width, client.height) / 3,
      scale: 0.01
    }
    params.baby = {
      crawling: true,
      failing: false,
      velocity: 0,
      crawlAnim: Animator({stepsPerCycle: 32, oneShot: false}),
      failAnim: Animator({stepsPerCycle: 64, oneShot: true}),
    },
    params.controller = {
      initialRotation: undefined,
      rotation: 0
    }
  }
  resetParams()

  client.initInput()

  const ctx = client.canvas.getContext('2d')
  const baby = Baby(client)
  const map = Map(ctx, MAP_SYMBOL_CTX_PROP_MAP)
  const audio = new Audio()
  let paused = false

  function updateAndDrawMap () {
    params.map.rotation = params.controller.rotation
    const rotationRadians = params.controller.rotation * Math.PI / 180
    const velocity = params.baby.velocity
    params.map.offsetX += velocity * Math.sin(rotationRadians)
    params.map.offsetY += velocity * Math.cos(rotationRadians)
    map.draw(MAPS[params.game.currentMapIndex], params.map)
  }

  const inputSmoother = RollingAverager(16)
  function controllerInputHandler (data) {
    const position = data[0]

    // If system button is pressed, redirect to menu.
    if (data[1] & 1) {
      window.location = '/'
    }

    if (params.controller.initialRotation === undefined) {
      params.controller.initialRotation = position
    }
    inputSmoother.push(params.controller.initialRotation - position)
    params.controller.rotation = inputSmoother.calc() / (512 / 3) * 360 % 360
  }

  // Add mouse wheel support.
  document.addEventListener('wheel', e => {
    params.controller.rotation += e.deltaY
  })

  // Add device orientation support.
  window.addEventListener('deviceorientation', e => {
    params.controller.rotation = e.gamma * 5
  })

  client.inputCallbacks.add(controllerInputHandler)
  client.inputWatchdog.on('problem', () => paused = true)
  client.inputWatchdog.on('ok', () => paused = false)

  const clearCanvas = () => {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, client.width, client.height)
  }

  // Load the songs and associate them with specific map numbers.
  const nameSongMap = await loadSongs()
  const MAP_INDEX_SONG_MAP = {
        0: nameSongMap.Ragtime,
        1: nameSongMap.Lullaby,
        2: nameSongMap.Prestige,
        3: nameSongMap.Power,
  }

  const audioFuncs = {
    // Intro audio function.
    intro: () => {
      // Play some discordant low frequency chord.
      for (let freq of [40, 50]) {
        audio.play(
          {frequency: freq + 10 * Math.random(),
           type: 'square',
           duration: 5,
           initialGain: 0.1,
           finalGain: 0.001,
          }
        )
      }
    },
    // Main gameplay music.
    main: () => {
      audio.playSong(MAP_INDEX_SONG_MAP[params.game.currentMapIndex], true)
    },

    // Fail audio function.
    fail: () => {
      audio.stop()
      for (let n = 4; n > 0; n -= 1) {
        audio.play(
          {frequency: Math.random() * 100 + 1000,
           type: 'square',
           duration: .2,
           initialGain: 0.1,
           finalGain: 0.001,
          }
        )
      }
    }
  }

  const sequences = {
    intro: isFirstCall => {
      if (isFirstCall) {
        resetParams(client, params)
        audioFuncs.intro()
      }
      if (params.map.scale >= 1) {
        params.map.scale = 1
        params.map.strokeStyle = "#fff"
        params.baby.velocity = 8
        return sequences.main
      }
      params.map.scale += 0.005
      const x = 255 * params.map.scale
      params.map.strokeStyle = rgbToRgba(x, x, x)
      clearCanvas()
      updateAndDrawMap()
      baby.draw()
      return sequences.intro
    },

    main: isFirstCall => {
      if (!paused) {
        if (isFirstCall) {
          audioFuncs.main()
        }
        clearCanvas()
        updateAndDrawMap()
        const hitPoints = baby.draw()
        for (let [x, y] of hitPoints) {
          const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
          const symbol = getSymbolForRGB([r, g, b])
          // There appears to be some sort of aliases or color blending going on at the
          // border between two colors which, when looked up in the symbol table, will
          // return undefined. So catch that here.
          if (symbol !== undefined && symbol !== "S" && symbol !== "P") {
            return symbol === "G" ? sequences.win : sequences.fail
          }
        }
      }
      return sequences.main
    },

    fail: isFirstCall => {
      if (isFirstCall) {
        audio.stop()
        params.baby.velocity = 0
        params.baby.crawling = false
        params.baby.failing = true
        params.map.strokeStyle = "#f00"
        params.map.failing = true
        audioFuncs.fail()
      }
      clearCanvas()
      updateAndDrawMap()
      baby.draw()
      if (!params.baby.failing) {
        return sequences.intro
      }
      return sequences.fail
    },

    win: firstCall => {
      audio.stop()
      params.game.currentMapIndex += 1
      // TODO - handle index overflow
      return sequences.intro
    }
  }

  let currentSequence = sequences.intro
  let isFirstCall = true
  function draw () {
    const nextSequence = currentSequence(isFirstCall)
    isFirstCall = nextSequence !== currentSequence
    currentSequence = nextSequence
    window.requestAnimationFrame(draw)
  }

  draw()
}

document.addEventListener("DOMContentLoaded", () => {
  const client = Client({canvas: document.getElementById("canvas")})
  window.client = client
  start(client)
})
