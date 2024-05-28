require('dotenv').config()
const cors = require('cors')
const express = require("express")
const sequelize = require('./db')
const router = require('./routes/index')
const http = require("http")
const WebSocket = require('ws')
const {setWssInstance} = require("./controllers/matlabController")
const ApiError = require("./error/ApiError")

const PORT = process.env.PORT || 5000

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', router)
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        res.status(err.status).json({message: err.message})
    } else {
        res.status(500).json({message: 'Непредвиденная ошибка сервера'})
    }
})

const server = http.createServer(app)
const wss = new WebSocket.Server({server})

setWssInstance(wss)

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        server.listen(PORT, () => console.log(`Сервер запустився на порту ${PORT}`))
    } catch (e) {
        console.log(e)
    }
}

start().then()