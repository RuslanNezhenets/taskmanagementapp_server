const {
    Project,
    UserProject,
    User,
    Access,
    Column
} = require('../models/models')
const ApiError = require('../error/ApiError')
const sequelize = require('../db')

class ProjectController {
    async create(req, res, next) {
        const t = await sequelize.transaction()
        try {
            const {name, description, managerId} = req.body
            if (!name) {
                await t.rollback()
                return next(ApiError.badRequest('Назва проєкту обов\'язкова'))
            }

            if (!managerId) {
                await t.rollback()
                return next(ApiError.badRequest('Не вказаний ідентифікатор автору проєкта - managerId'))
            }

            const manager = await User.findByPk(managerId)
            if (!manager) {
                await t.rollback()
                return next(ApiError.badRequest('Користувача з таким ідентифікатором не існує'))
            }

            const project = await Project.create({name, description, managerId}, {transaction: t})

            const access = await Access.findOne({where: {key: 'admin'}})
            if (!access) {
                await t.rollback()
                return next(ApiError.badRequest('Роль адміністратора не знайдено'))
            }

            await UserProject.create({
                projectId: project.id,
                userId: managerId,
                accessId: access.id
            }, {transaction: t})

            const columns = [
                {name: 'До виконання', status: 'To Do', position: 1, done: false, projectId: project.id},
                {name: 'В роботі', status: 'In progress', position: 2, done: false, projectId: project.id},
                {name: 'Готово', status: 'Done', position: 3, done: true, projectId: project.id}
            ]

            for (const column of columns) {
                await Column.create(column, {transaction: t})
            }

            await t.commit()
            return res.json({project, UserProject})
        } catch (error) {
            await t.rollback()
            return next(ApiError.internal('Помилка під час створення проєкту: ' + error.message))
        }
    }


    async getAll(req, res, next) {
        try {
            const projects = await Project.findAll()
            return res.json(projects)
        } catch (error) {
            return next(ApiError.internal('Помилка при отриманні списку проєктів: ' + error.message))
        }
    }

    async getOne(req, res, next) {
        try {
            const {id} = req.params
            const project = await Project.findByPk(id)
            if (!project) {
                return next(ApiError.badRequest('Проєкт не знайдено'))
            }
            return res.json(project)
        } catch (error) {
            return next(ApiError.internal('Помилка при отриманні проєкту: ' + error.message))
        }
    }

    async getByUser(req, res, next) {
        try {
            const {userId} = req.params

            const userWithProjects = await User.findByPk(userId, {
                include: [{
                    model: Project,
                    as: 'projects',
                    through: {attributes: []},
                }]
            })

            if (!userWithProjects) {
                return next(ApiError.badRequest('Користувач не знайдений'))
            }

            return res.json(userWithProjects.projects)
        } catch (error) {
            return next(ApiError.internal('Помилка при отриманні проєктів користувача: ' + error.message))
        }
    }


    async update(req, res, next) {
        try {
            const { id, ...updateData } = req.body

            if (!updateData.name) {
                return next(ApiError.badRequest('Назва проєкту обов\'язкова'))
            }

            const project = await Project.findByPk(id)
            if (!project) {
                return next(ApiError.badRequest('Проєкт не знайдено'))
            }

            await project.update(updateData)

            return res.json(project)
        } catch (error) {
            return next(ApiError.internal('Помилка під час оновлення проєкту: ' + error.message))
        }
    }


    async delete(req, res, next) {
        try {
            const {id} = req.params
            const project = await Project.findByPk(id)

            if (!project) {
                return next(ApiError.notFound('Проєкт не знайдено'))
            }

            await project.destroy()
            return res.status(200).send('Проєкт та всі пов\'язані дані успішно видалені')
        } catch (error) {
            return next(ApiError.internal('Помилка при видаленні проєкту: ' + error.message))
        }
    }

}

module.exports = new ProjectController()
