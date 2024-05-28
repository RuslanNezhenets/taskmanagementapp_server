const Router = require('express')
const router = new Router()

const accessController = require('../controllers/accessController')

router.get('/', accessController.getAll)

module.exports = router