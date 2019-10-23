
import InputWatchdog from "./input_watchdog.js"


export default function Client ({canvas}) {
  const client = {
    canvas: canvas,
    width: 0,
    height: 0,
    websocket: null,
    inputCallbacks: new Set(),
    inputWatchdog: InputWatchdog(100),
  }

  function resize() {
    const rootNode = document.body.parentNode
    client.width = rootNode.clientWidth
    client.height = rootNode.clientHeight
    canvas.width = client.width
    canvas.height = client.height
  }
  window.addEventListener('resize', resize)
  resize()

  client.initInput = () => {
    client.websocket = new WebSocket(`ws://${window.location.host}/input`)
    client.websocket.onmessage = e => {
      client.inputWatchdog.reset()
      const data = JSON.parse(e.data)
      client.inputCallbacks.forEach(f => f(data))
    }
  }

  return client
}
