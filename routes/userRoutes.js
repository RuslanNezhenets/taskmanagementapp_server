const authMiddleware = require('../middleware/authMiddleware')
const Router = require('express')
const router = new Router()
const multer = require('multer')
const upload = multer({dest: 'uploads/'})

const userController = require('../controllers/userController')

router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.get('/auth', authMiddleware, userController.check)
router.get('/', userController.getAll)
router.get('/:id', userController.getOne)
router.get('/project/:id', userController.getByProject)
router.put('/', upload.single('avatar'), userController.update)
router.delete('/:id', userController.delete)

module.exports = router