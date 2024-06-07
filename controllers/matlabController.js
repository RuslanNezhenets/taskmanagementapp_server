const {runMatlabScript} = require("../algorithm/startAlgorithm")
const WebSocket = require("ws")
const {generateData} = require("../algorithm/generateData")
const ApiError = require("../error/ApiError")

let wssInstance = null
let isAlgorithmRunning = false
const lastResults = {}

class MatlabController {
    async check(req, res, next) {
        return res.status(200).send({busy: isAlgorithmRunning})
    }

    async start(req, res, next) {
        const {projectId, useAvailable, clientId} = req.body

        if (!projectId) {
            return next(ApiError.badRequest('Не вказаний ідентифікатор проєкту'))
        }

        if (isAlgorithmRunning) {
            return res.status(429).send({message: 'Алгоритм вже запущено, будь ласка, зачекайте.'})
        }

        try {
            const numberOfTrials = 1
            const results = []

            const variables = await generateData(projectId, useAvailable)

            const tasks = variables.tasks
            delete variables.tasks
            const availableRoles = variables.availableRoles
            delete variables.availableRoles
            const s = variables.s
            delete variables.s

            isAlgorithmRunning = true
            res.status(202).send({message: 'Алгоритм запущено, чекайте на результат.', clientId})

            for (let i = 0; i < numberOfTrials; i++) {
                const result = await runMatlabScript(variables)
                results.push(result)
            }

            const bestResult = results.reduce((prev, current) => (prev[1] < current[1] ? prev : current))[0]

            bestResult.result = tasks.map((task, index) => ({
                id: task.id,
                deadline: bestResult.result[index] + s
            }))

            bestResult.w = Object.keys(availableRoles).reduce((acc, key, index) => {
                acc[key] = bestResult.w[index]
                return acc
            }, {})

            const sendData =  {result: bestResult}

            lastResults[clientId] = sendData

            wssInstance.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN && client.clientId === clientId) {
                    client.send(JSON.stringify(sendData))
                }
            })
        } catch (error) {
            console.error('Помилка під час виконання алгоритму:\n', error.message)
            res.status(400).send({message: error.message, body: error.body})
        } finally {
            isAlgorithmRunning = false
        }
    }

    async getLastResult(req, res, next) {
        const {clientId} = req.query
        const result = lastResults[clientId]
        if (result) {
            return res.status(200).send(result)
        } else {
            return res.status(200).send(null)
        }
    }
}

function setWssInstance(wss) {
    wssInstance = wss
    wss.on('connection', function connection(ws) {
        ws.on('message', function message(data) {
            const parsedData = JSON.parse(data)
            if (parsedData.type === 'register') {
                ws.clientId = parsedData.clientId
                console.log('Registered client with ID:', ws.clientId)
            }
        })
    })
}

module.exports = {MatlabController, setWssInstance}
