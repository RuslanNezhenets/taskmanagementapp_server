const {Role} = require('../models/models')
const ApiError = require('../error/ApiError')

class RoleController {
    async create(req, res, next) {
        try {
            const {projectId, name: initialName} = req.body

            let name = initialName

            if (!name) {
                let suffix = 1
                while (true) {
                    name = `Роль${suffix}`
                    const existingRole = await Role.findOne({where: {name, projectId}})
                    if (!existingRole) break
                    suffix++
                }
            } else {
                const existingRole = await Role.findOne({where: {name, projectId}})
                if (existingRole) {
                    return next(ApiError.badRequest('Роль із такою назвою вже існує в цьому проєкті'))
                }
            }

            const role = await Role.create({projectId: projectId, name: name, color: '#8a8aff'})
            return res.json(role)
        } catch (error) {
            return next(ApiError.internal('Помилка під час створення ролі: ' + error.message))
        }
    }

    async getAll(req, res, next) {
        try {
            const {projectId} = req.query

            let options = {}
            if (projectId) options.where = {projectId}

            const roles = await Role.findAll(options)

            return res.json(roles.sort((a, b) => a.id - b.id))
        } catch (error) {
            return next(ApiError.internal('Помилка при отриманні списку проєктів: ' + error.message))
        }
    }


    async getOne(req, res, next) {
        try {
            const {id} = req.params
            const role = await Role.findByPk(id)
            if (!role) {
                return next(ApiError.badRequest('Роль не знайдено'))
            }
            return res.json(role)
        } catch (error) {
            return next(ApiError.internal('Помилка при отриманні ролі: ' + error.message))
        }
    }

    async update(req, res, next) {
        try {
            const {id, name, description, color} = req.body
            if (!name) {
                return next(ApiError.badRequest('Назва ролі обов\'язкова'))
            }
            const role = await Role.findByPk(id)
            if (!role) {
                return next(ApiError.badRequest('Роль не знайдено'))
            }

            role.name = name
            role.description = description
            role.color = color

            await role.save()
            return res.json(role)
        } catch (error) {
            return next(ApiError.internal('Помилка під час оновлення ролі: ' + error.message))
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params
            const deleted = await Role.destroy({where: {id}})
            if (deleted) {
                return res.json({message: 'Роль видалено'})
            } else {
                return next(ApiError.badRequest('Роль не знайдено'))
            }
        } catch (error) {
            return next(ApiError.internal('Помилка під час видалення: ' + error.message))
        }
    }
}

module.exports = new RoleController()
