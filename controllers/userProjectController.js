const {UserProject, Access} = require('../models/models')
const ApiError = require('../error/ApiError')

class UserProjectController {
    async create(req, res, next) {
        try {
            const {userId, projectId, accessId} = req.body

            const existingAssociation = await UserProject.findOne({
                where: {userId, projectId}
            })

            if (existingAssociation) {
                return next(ApiError.badRequest('Користувач вже додано до цього проєкту'))
            }

            const userProject = await UserProject.create({userId, projectId, accessId})
            const fullUserProject = await UserProject.findOne({
                where: {projectId: userProject.projectId, userId: userProject.userId},
                include: [{
                    model: Access,
                    as: 'access',
                    attributes: ['key', 'description']
                }]
            })

            return res.json(fullUserProject)
        } catch (error) {
            return next(ApiError.internal('Помилка при додаванні користувача до проєкту: ' + error.message))
        }
    }

    async getAll(req, res, next) {
        try {
            const {projectId, userId} = req.query

            const options = {
                where: {},
                include: [{
                    model: Access,
                    as: 'access',
                    attributes: ['key', 'description']
                }]
            }

            if (projectId) options.where.projectId = projectId
            if (userId) options.where.userId = userId

            const projects = await UserProject.findAll(options)
            return res.json(projects)
        } catch (error) {
            return next(ApiError.internal('Помилка при отриманні списку проєктів: ' + error.message))
        }
    }

    async update(req, res, next) {
        try {
            const {projectId, userId, accessId, roleId} = req.body

            const result = await UserProject.update(
                {accessId: accessId, roleId: roleId},
                {
                    where: {
                        projectId: projectId,
                        userId: userId
                    }
                }
            )

            if (result[0] > 0) {
                res.send('Оновлення успішне')
            } else {
                return next(ApiError.internal('Запис не знайдено або дані не змінені'))
            }
        } catch (error) {
            return next(ApiError.internal('Помилка під час оновлення проєкту: ' + error.message))
        }
    }


    async delete(req, res, next) {
        try {
            const {id} = req.params
            const deleted = await UserProject.destroy({where: {id}})
            if (deleted) {
                return res.json({message: 'Доступ до проєкту видалено'})
            } else {
                return next(ApiError.badRequest('Проєкт не знайдено'))
            }
        } catch (error) {
            return next(ApiError.internal('Помилка видалення доступу: ' + error.message))
        }
    }
}

module.exports = new UserProjectController()
