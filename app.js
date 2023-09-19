const express = require('express')

const app = express()
const port = 3001
const http = require('http')
const server = http.createServer(app)

const { dataLog } = require('./controller/setTanam')

const cors = require('cors');

const { router: routerWorker } = require('./controller/app.js');
const { Server } = require('socket.io')

const corsOptions = {
  origin: ["http://localhost:3001/", "https://smart-agriculture-indol.vercel.app/"],
  // methods: ["GET", "POST"],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json({ extended: true, limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))
app.use(express.static('public'))

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3001/", "https://smart-agriculture-indol.vercel.app/"],
    methods: ["GET", "POST"]
  }
})

app.get('/', (req, res) => {
  res.json({
    msg: 'selamat datang di API',
  })
})

app.use('/worker', routerWorker)
app.use('/datalog', require('./routes/getAllLog'))
app.use('/send', require('./routes/sendRMQ'))


//connection Socket IO
const dataToClient = (client, data) => {
  client.emit('dataUpdate', data)
}

io.on('connection', (socket) => {
  console.log('User Connected')
  socket.on("send_message", async (data) => {
    try {
      const { IDUSER } = data
      const value = await dataLog({ IDUSER })
      dataToClient(socket, value)
    } catch (error) {
      console.error('ERROR TERJADI SAAT DAPATKAN DATA', error)
    }
  })
})

server.listen(port, () => {
  console.log('SERVER RUNNING IN PORT : ' + port)
})
