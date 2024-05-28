const Router = require('express')
const router = new Router()

const userProjectController = require('../controllers/userProjectController')

router.post('/', userProjectController.create)
router.get('/', userProjectController.getAll)
router.put('/', userProjectController.update)
router.delete('/:id', userProjectController.delete)

module.exports = router