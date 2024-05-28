const Router = require('express')
const router = new Router()

const projectController = require('../controllers/projectController')

router.post('/', projectController.create)
router.get('/', projectController.getAll)
router.get('/:id', projectController.getOne)
router.put('/', projectController.update)
router.delete('/:id', projectController.delete)

router.get('/user/:userId', projectController.getByUser)

module.exports = router