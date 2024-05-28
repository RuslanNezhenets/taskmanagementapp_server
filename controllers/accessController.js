const {Access} = require('../models/models')
const ApiError = require('../error/ApiError')

class AccessController {
    async getAll(req, res, next) {
        try {
            const accesses = await Access.findAll()
            return res.json(accesses)
        } catch (error) {
            return next(ApiError.internal('Помилка при отриманні списку рівнів доступу: ' + error.message))
        }
    }
}

module.exports = new AccessController()
