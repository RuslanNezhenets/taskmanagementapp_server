const Router = require('express')
const router = new Router()

const taskController = require('../controllers/taskController')

router.post('/', taskController.create)
router.get('/', taskController.getAll)
router.get('/:id', taskController.getOne)
router.put('/', taskController.update)
router.put('/bulk', taskController.bulkUpdateTasks)
router.delete('/:id', taskController.delete)

module.exports = router