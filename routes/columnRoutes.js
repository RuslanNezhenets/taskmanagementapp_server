const Router = require('express')
const router = new Router()

const columnController = require('../controllers/columnController')

router.post('/', columnController.create)
router.get('/', columnController.getAll)
router.get('/:id', columnController.getOne)
router.put('/', columnController.update)
router.delete('/:id', columnController.delete)

module.exports = router