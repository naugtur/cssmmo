const os = require('os')
const path = require('path')
const express = require('express')
const app = express()

const port = 8000

const server = require('http').Server(app)
const io = require('socket.io')(server)

app.use('/', express.static(path.join(__dirname, './front')))

server.listen(port, _ => {
  const ifaces = os.networkInterfaces()
  console.log('Ready! Invite everyone to one of these addresses:')
  console.log(` http://localhost:${port}/`)

  Object.keys(ifaces).forEach(ifname => {
    ifaces[ifname].forEach(iface => {
      iface.family !== 'IPv4' || iface.internal !== false || console.log(` http://${iface.address}:${port}/`)
    })
  })
})

const payload = (player, css) => ({
  id: player.id,
  name: player.name,
  css: `#${player.id} { ` + sanitize(css) + `}`
})
const sanitize = (css) => (css.replace(/[@}]/g, ''))

const chat = io.of('/game') // TODO: make this handle multiple rooms
const kicks = {}

var totalConnected = 0
chat.on('connection', socket => {
  totalConnected++

  const player = {
    id: 'p' + Math.random().toFixed(5).substr(2, 5),
    name: ''
  }
  console.log('conn', player.id)

  socket.on('push', css => {
    if (kicks[player.id] > (totalConnected / 2)) {
      console.log('kicked', player.id, player.name)
      socket.emit('bye')
      socket.disconnect(true)
      chat.emit('change', payload(player, 'display: none'))
    } else {
      chat.emit('change', payload(player, css))
    }
  })
  socket.on('kick', id => {
    console.log('kick', id)
    kicks[id] = ~~(kicks[id]) + 1
  })
  socket.on('name', name => {
    if (!name) {
      return
    }
    player.name = name.replace(/[^a-z ]/gi, '')
    console.log('hi  ', player.id, player.name)
    chat.emit('change', payload(player, ''))
  })

  socket.on('disconnect', _ => {
    totalConnected--
    console.log('drop', player.id, player.name)
    chat.emit('change', payload(player, 'display: none'))
  })
})
