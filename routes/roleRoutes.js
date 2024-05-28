const Router = require('express')
const router = new Router()

const roleController = require('../controllers/roleController')

router.post('/', roleController.create)
router.get('/', roleController.getAll)
router.get('/:id', roleController.getOne)
router.put('/', roleController.update)
router.delete('/:id', roleController.delete)

module.exports = router