const {Task, Column, Project} = require('../models/models')
const ApiError = require('../error/ApiError')
const {Sequelize} = require("sequelize")
const sequelize = require('../db')
const {Op} = require('sequelize')
const moment = require("moment-timezone")

class TaskController {
    async create(req, res, next) {
        try {
            let {columnId, title, description, priority, endDate, authorId} = req.body
            if (!title) {
                return next(ApiError.badRequest('Заголовок задачи не може бути порожнім'))
            }
            if (!columnId) {
                return next(ApiError.badRequest('Відсутній статус задачи'))
            }

            if (!description) description = ''
            if (!endDate) endDate = null

            const tasks = await Task.findAll()
            const maxPosition = tasks
                .filter(task => task.columnId === columnId)
                .reduce((max, task) => task.position > max ? task.position : max, 0)

            const position = maxPosition + 1

            const task = await Task.create({columnId, title, description, priority, position, endDate, authorId})
            return res.json(task)
        } catch (error) {
            return next(ApiError.badRequest('Помилка під час створення задачи: ' + error.message))
        }
    }

    async getAll(req, res) {
        try {
            const {projectId, executorId} = req.query

            let options = {
                include: []
            }

            if (projectId) {
                options.include = [{
                    model: Column,
                    as: 'column',
                    required: true,
                    where: {projectId: projectId},
                    include: [{
                        model: Project,
                        required: true,
                        where: {id: projectId}
                    }]
                }]
            }

            if (executorId) {
                options.where = {executorId}
                options.include.push({
                    model: Column,
                    as: 'column',
                    required: true,
                    include: [{
                        model: Project,
                        as: 'project',
                        required: true
                    }]
                })
            }

            const tasks = await Task.findAll(options)

            const tasksWithLocalDates = tasks.map(task => ({
                ...task.toJSON(),
                endDate: task.endDate ? moment(task.endDate).tz("Europe/Kiev").format() : null
            }))

            return res.json(tasksWithLocalDates)
        } catch (error) {
            return res.status(500).json({error: error.message})
        }
    }

    async getOne(req, res) {
        try {
            const id = req.params.id
            const task = await Task.findByPk(id)
            if (!task) {
                return res.status(404).json({message: 'Задача не знайдена'})
            }
            return res.json(task)
        } catch (error) {
            return res.status(500).json({error: error.message})
        }
    }

    async update(req, res, next) {
        try {
            const {
                id,
                roleId,
                columnId,
                title,
                description,
                priority,
                position,
                endDate,
                duration,
                executorId,
                authorId
            } = req.body
            const task = await Task.findByPk(id)
            if (!task) {
                return next(ApiError.badRequest('Задача не знайдена'))
            }

            if (task.columnId !== columnId) {
                await Task.increment('position', {
                    by: -1,
                    where: {
                        columnId: task.columnId,
                        position: {[Sequelize.Op.gt]: task.position}
                    }
                })

                await Task.increment('position', {
                    by: 1,
                    where: {
                        columnId: columnId,
                        position: {[Sequelize.Op.gte]: position}
                    }
                })
            } else if (task.position !== position) {
                if (task.position < position) {
                    await Task.increment('position', {
                        by: -1,
                        where: {
                            columnId: columnId,
                            position: {
                                [Sequelize.Op.gt]: task.position,
                                [Sequelize.Op.lte]: position
                            }
                        }
                    })
                } else {
                    await Task.increment('position', {
                        by: 1,
                        where: {
                            columnId: columnId,
                            position: {
                                [Sequelize.Op.lt]: task.position,
                                [Sequelize.Op.gte]: position
                            }
                        }
                    })
                }
            }

            task.roleId = roleId
            task.columnId = columnId
            task.title = title
            task.description = description
            task.priority = priority
            task.position = position
            task.endDate = endDate
            task.duration = duration
            task.executorId = executorId
            task.authorId = authorId

            await task.save()
            return res.json(task)
        } catch (error) {
            return next(ApiError.badRequest('Помилка під час оновлення задачи: ' + error.message))
        }
    }

    async bulkUpdateTasks(req, res, next) {
        try {
            const tasks = req.body
            const updatedTasks = await Task.bulkCreate(tasks, {
                updateOnDuplicate: ['endDate']
            })
            return res.json(updatedTasks)
        } catch (error) {
            return next(ApiError.badRequest('Помилка під час масового оновлення задач: ' + error.message))
        }
    }


    async delete(req, res, next) {
        const transaction = await sequelize.transaction()
        try {
            const id = req.params.id
            const taskToDelete = await Task.findOne({where: {id}}, {transaction})
            if (!taskToDelete) {
                await transaction.rollback()
                return res.status(404).json({message: 'Задача не знайдена'})
            }

            const deletePosition = taskToDelete.position

            const deleted = await Task.destroy({where: {id}, transaction})
            if (!deleted) {
                await transaction.rollback()
                return res.status(404).json({message: 'Задачу не було видалено'})
            }

            const updatedCount = await Task.update(
                {position: sequelize.literal('position - 1')},
                {where: {position: {[Op.gt]: deletePosition}}, transaction}
            )

            await transaction.commit()
            return res.json({message: 'Задачу видалено', updatedPositions: updatedCount})
        } catch (error) {
            await transaction.rollback()
            return next(ApiError.internal('Помилка при видаленні задачи: ' + error.message))
        }
    }

}


module.exports = new TaskController()