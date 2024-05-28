const Router = require('express')
const router = new Router()

const {MatlabController} = require('../controllers/matlabController')

const matlabController = new MatlabController()

router.get('/check', matlabController.check)
router.post('/start', matlabController.start)
router.get('/result', matlabController.getLastResult)

module.exports = router