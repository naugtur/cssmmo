/* global io */
/* global prompt */
/* global alert */

var socket = io.connect('/game')
var head = document.getElementsByTagName('head')[0]
var body = document.body
var collection = {}

function provide (id, type, afterCreate) {
  var element
  var style

  if (collection[id]) {
    return collection[id]
  } else {
    element = document.createElement(type)
    element.id = id
    element.setAttribute('class', 'default')

    style = document.createElement('style')
    style.id = 'style_' + id
    head.appendChild(style)
    style.type = 'text/css'
    collection[id] = {
      element: element,
      style: style
    }
    afterCreate(element)
    return collection[id]
  }
}

socket.on('bye', function () {
  alert('You got kicked. Let\'s try again.')
  window.location.reload()
})
socket.on('change', function (data) {
  var item = provide(data.id, 'div', function (e) {
    e.innerHTML = data.name
    body.appendChild(e)
  })

  if (item.style.styleSheet) {
    item.style.styleSheet.cssText = data.css
  } else {
    item.style.innerHTML = ''
    item.style.appendChild(document.createTextNode(data.css))
  }
})

var myname = prompt('Who are you?')
socket.emit('name', myname)

var input = document.querySelector('textarea')
var sendTime
input.addEventListener('keypress', sendChangesDebounced)

setInterval(sendChangesDebounced, 20000)

function sendChangesDebounced () {
  clearTimeout(sendTime)
  sendTime = setTimeout(function () {
    var stls = input.value
    socket.emit('push', stls)
  }, 700)
}

var kicks = {}
document.addEventListener('click', function (e) {
  var player = e.target.id
  if (player) {
    kicks[player] = ~~(kicks[player]) + 1
    if (kicks[player] === 3) {
      e.target.style.opacity = 0.3
      socket.emit('kick', player)
    }
  }
})
