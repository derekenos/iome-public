
import Element from "./element.js"
import { RollingAverager } from "./math.js"


export default function InputWatchdog ({timeoutPeriodMs}) {
  timeoutPeriodMs = timeoutPeriodMs || 100
  let lastResetTimestampMs = null
  let resetPeriodRollingAverager = RollingAverager(32)
  let onProblemCallbacks = new Array()
  let onOkCallbacks = new Array()
  let isOk = true
  let t

  const el = Element(`<div style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; background-color: rgba(0, 0, 0, .2); font-size: 48px; font-weight: bold; color: #000;">Controller Problems</div>`)

  function problem () {
    // Clear the isOk flag, add the overlay element into the DOM, and invoke
    // all the onProblem callbacks.
    isOk = false
    document.body.append(el)
    onProblemCallbacks.forEach(f => f())
  }

  function ok (estimatedNumMissedMessages) {
    // Set the isOk flag, remove the overlay element from the DOM, and invoke
    // all the onOk callbacks.
    isOk = true
    el.remove()
    onOkCallbacks.forEach(f => f(estimatedNumMissedMessages))
  }

  function reset () {
    // Reset the watchdog timer.
    const nowMs = Date.now()
    const msSinceLastReset = nowMs - lastResetTimestampMs

    lastResetTimestampMs = nowMs

    if (isOk) {
      // Everything is ok. Include the current time since last reset into the
      // rolling average and retrigger the timer.
      resetPeriodRollingAverager.push(msSinceLastReset)
      clearTimeout(t)
      t = setTimeout(problem, timeoutPeriodMs)
    } else {
      // There was a problem, but now things seem ok.
      // Estimate the number of messages that we missed during the outage based
      // on its duration and the average pre-outage inter-reset period.
      let estimatedNumMissedMessages = 0
      const avgResetPeriodMs = resetPeriodRollingAverager.calc()
      if (avgResetPeriodMs > 0 && msSinceLastReset !== null) {
        estimatedNumMissedMessages = Math.ceil(msSinceLastReset /
                                               avgResetPeriodMs)
      }
      // Signal that things are ok.
      ok(estimatedNumMissedMessages)
    }
  }

  function on (eventName, callback) {
    switch (eventName) {
    case 'problem':
      onProblemCallbacks.push(callback)
      break;
    case 'ok':
      onOkCallbacks.push(callback)
      break;
    default:
      throw `Unsupported event name: ${eventName}`
      break;
    }
  }

  return {
    on,
    reset,
  }
}
