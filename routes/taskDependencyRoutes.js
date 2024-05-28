const Router = require('express')
const router = new Router()

const taskDependencyController = require('../controllers/taskDependencyController')

router.post('/', taskDependencyController.create)
router.get('/', taskDependencyController.getAll)
router.delete('/:id', taskDependencyController.delete)

module.exports = router