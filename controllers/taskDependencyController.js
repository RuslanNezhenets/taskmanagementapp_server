const {TaskDependency, Task, Column, Project} = require("../models/models")
const ApiError = require("../error/ApiError")

class TaskDependencyController {
    async create(req, res, next) {
        try {
            const {taskId, dependentTaskId} = req.body
            if (!taskId || !dependentTaskId) {
                return next(ApiError.badRequest('Необхідно вказати ID задачи та залежних завдань'))
            }

            const task = await Task.findByPk(taskId)
            if (!task) {
                return next(ApiError.notFound(`Задача з ID ${taskId} не знайдена`))
            }

            const dependentTask = await Task.findByPk(dependentTaskId)
            if (!dependentTask) {
                return next(ApiError.notFound(`Задача з ID ${dependentTaskId} не знайдена`))
            }

            if (taskId === dependentTaskId) {
                return next(ApiError.badRequest('Задача не може бути залежним саме від себе'))
            }

            const dependency = await TaskDependency.create({taskId, dependentTaskId})
            return res.json(dependency)
        } catch (error) {
            return next(ApiError.internal('Помилка під час створення залежності: ' + error.message))
        }
    }

    async getAll(req, res) {
        try {
            const {projectId} = req.query

            let taskOptions = {}
            if (projectId) {
                taskOptions.include = [{
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

            const tasks = await Task.findAll(taskOptions)

            const taskIds = tasks.map(task => task.id)

            if (!taskIds.length) {
                return res.json([])
            }

            const allDependencies = await TaskDependency.findAll()

            const filteredDependencies = allDependencies.filter(dep =>
                taskIds.includes(dep.taskId) || taskIds.includes(dep.dependentTaskId)
            )

            return res.json(filteredDependencies)
        } catch (error) {
            return res.status(500).json({error: error.message})
        }
    }


    async delete(req, res, next) {
        try {
            const {id} = req.params
            const deleted = await TaskDependency.destroy({where: {id}})
            if (!deleted) {
                return next(ApiError.notFound('Залежність не знайдено'))
            }
            return res.json({message: 'Залежність видалена'})
        } catch (error) {
            return next(ApiError.internal('Помилка при видаленні залежності: ' + error.message))
        }
    }
}

module.exports = new TaskDependencyController()
