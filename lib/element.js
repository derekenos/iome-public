
export default function Element (tagNameOrDOMString, wrapperTag='div') {
    /* Helper to return a new Element for a given tag name or DOM string.
     */
    if (!tagNameOrDOMString.startsWith('<'))
      return document.createElement(tagNameOrDOMString)
    const wrapper = document.createElement(wrapperTag)
    wrapper.innerHTML = tagNameOrDOMString
    let el = wrapper.firstChild
    if (el.nodeName === "#text") {
      throw `Element creation failed. Maybe ${wrapperTag} is not a valid parent for: ${tagNameOrDOMString}`
    }
    wrapper.removeChild(el)
    return el
}
