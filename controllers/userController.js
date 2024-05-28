const {User, UserProject} = require('../models/models')
const ApiError = require('../error/ApiError')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const multer = require('multer')
const upload = multer({dest: 'uploads/'})
const fs = require('fs').promises

const generateJwt = (id, email, username) => {
    return jwt.sign(
        {id, email, username},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}

class UserController {
    async registration(req, res, next) {
        const {email, password} = req.body
        if (!email || !password) {
            return next(ApiError.badRequest('Необхідно вказати email та пароль'))
        }

        const candidate = await User.findOne({where: {email}})
        if (candidate) {
            return next(ApiError.badRequest('Користувач із таким email вже існує'))
        }

        const lastUser = await User.findOne({
            order: [['id', 'DESC']]
        })

        const newUserId = lastUser ? lastUser.id + 1 : 1
        const username = `user${newUserId}`

        const hashPassword = await bcrypt.hash(password, 5)
        const user = await User.create({email, passwordHash: hashPassword, username})
        const token = generateJwt(user.id, user.email, user.username)

        return res.json({token})
    }


    async login(req, res, next) {
        const {email, password} = req.body
        if (!email || !password) {
            return next(ApiError.badRequest('Некоректний email або пароль'))
        }

        const user = await User.findOne({where: {email}})
        if (!user) {
            return next(ApiError.badRequest('Користувач не знайдений'))
        }

        let comparePassword = await bcrypt.compareSync(password, user.passwordHash)
        if (!comparePassword) {
            return next(ApiError.badRequest('Вказано неправильний пароль'))
        }
        const token = generateJwt(user.id, user.email)
        return res.json({token})
    }

    async check(req, res, next) {
        try {
            const user = await User.findOne({where: {id: req.user.id}})
            if (!user) {
                return next(ApiError.badRequest('Користувач не знайдений'))
            }
            const token = generateJwt(user.id, user.email, user.username)
            return res.json({token})
        } catch (error) {
            return next(ApiError.internal('Помилка під час перевірки користувача: ' + error.message))
        }
    }

    async getAll(req, res, next) {
        try {
            const {id, email} = req.query
            let where = {}

            if (id) {
                where.id = id
            }
            if (email) {
                where.email = email
            }

            const users = await User.findAll({
                where: where,
                attributes: {exclude: ['passwordHash']}
            })

            if (!users.length)
                return next(ApiError.badRequest('Користувач не знайдений'))

            res.json(users)
        } catch (error) {
            res.status(500).json({error: error.message})
        }
    }


    async getOne(req, res) {
        const userId = req.params.id
        try {
            const user = await User.findByPk(userId, {
                attributes: {exclude: ['passwordHash']}
            })
            if (user) {
                res.json(user)
            } else {
                res.status(404).json({error: 'Користувач не знайдений'})
            }
        } catch (error) {
            res.status(500).json({error: error.message})
        }
    }

    async getByProject(req, res) {
        const id = req.params.id
        try {
            const userProjects = await UserProject.findAll({
                where: {projectId: id},
                attributes: ['userId', 'roleId']
            })

            const userIds = userProjects.map(userProject => userProject.userId);

            const users = await User.findAll({
                where: {id: userIds},
                attributes: {exclude: ['passwordHash']}
            })

            const usersWithRole = users.map(user => {
                const userProject = userProjects.find(up => up.userId === user.id);
                return {
                    ...user.toJSON(),
                    roleId: userProject ? userProject.roleId : null
                }
            })

            res.json(usersWithRole)
        } catch (error) {
            res.status(500).json({error: error.message})
        }
    }


    async update(req, res, next) {
        const {id, email, password} = req.body
        const avatar = req.file

        if (avatar) {
            req.body.avatar = await fs.readFile(avatar.path)
            req.body.avatarMimeType = avatar.mimetype
        }

        if (password) {
            req.body.passwordHash = await bcrypt.hash(password, 5)
        }
        delete req.body.password

        if (email) {
            const candidate = await User.findOne({where: {email}})
            if (candidate && candidate.id.toString() !== id) {
                return next(ApiError.badRequest('Користувач із таким email вже існує'))
            }
        }

        const [updatedCount, updatedUsers] = await User.update(req.body, {
            where: {id: id},
            returning: true,
        })

        if (updatedCount > 0) {
            const updatedUser = updatedUsers[0].get({plain: true})
            delete updatedUser.passwordHash
            res.json(updatedUser)
        } else {
            res.status(404).json({error: 'Користувач не знайдений'})
        }
    }


    async delete(req, res) {
        const userId = req.params.id

        const deleted = await User.destroy({
            where: {id: userId},
        })

        if (deleted) {
            res.json({message: 'Користувача видалено'})
        } else {
            res.status(404).json({error: 'Користувач не знайдений'})
        }
    }
}

module.exports = new UserController()
