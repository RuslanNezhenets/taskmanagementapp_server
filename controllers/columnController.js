const {Column} = require('../models/models')
const ApiError = require('../error/ApiError')
const sequelize = require('../db')
const {Op} = require('sequelize')

class ColumnController {
    async create(req, res, next) {
        try {
            let {projectId, name, status, limit} = req.body
            if (!name) {
                return next(ApiError.badRequest('Заголовок стовпця не може бути порожнім'))
            }
            if (!status) status = name

            const columns = await Column.findAll()
            const maxPosition = columns
                .filter(column => column.projectId === projectId)
                .reduce((max, column) => column.position > max ? column.position : max, 0)

            const position = maxPosition + 1

            const column = await Column.create({projectId, name, status, position, limit})
            return res.json(column)
        } catch (error) {
            return next(ApiError.badRequest('Помилка під час створення стовпця: ' + error.message))
        }
    }

    async getAll(req, res) {
        try {
            const projectId = req.query.projectId
            const whereCondition = projectId ? {projectId: parseInt(projectId)} : {}
            const columns = await Column.findAll({
                where: whereCondition,
                order: [['projectId', 'ASC'], ['position', 'ASC']]
            })

            return res.json(columns)
        } catch (error) {
            return res.status(500).json({error: error.message})
        }
    }

    async getOne(req, res) {
        try {
            const id = req.params.id
            const column = await Column.findByPk(id)
            if (!column) {
                return res.status(404).json({message: 'Стовпець не знайдений'})
            }
            return res.json(column)
        } catch (error) {
            return res.status(500).json({error: error.message})
        }
    }

    async update(req, res, next) {
        try {
            const updates = Array.isArray(req.body) ? req.body : [req.body]

            const results = []
            for (const update of updates) {
                const {id, projectId, name, status, position, limit} = update
                const column = await Column.findByPk(id)
                if (!column) {
                    results.push({id, error: 'Стовпець не знайдений'})
                    continue
                }
                column.projectId = projectId || column.projectId
                column.name = name || column.name
                column.status = status || column.status
                column.position = position || column.position
                column.limit = limit || column.limit
                await column.save()
                results.push(column)
            }

            if (results.length === 1) {
                return res.json(results[0])
            }

            return res.json(results)
        } catch (error) {
            return next(ApiError.badRequest('Помилка при оновленні стовпця: ' + error.message))
        }
    }


    async delete(req, res, next) {
        const transaction = await sequelize.transaction()
        try {
            const id = req.params.id
            const columnToDelete = await Column.findOne({where: {id}})
            if (!columnToDelete) {
                return next(ApiError.badRequest('Стовпець не знайдений'))
            }

            const deletePosition = columnToDelete.position

            await Column.destroy({where: {id: id}, transaction: transaction})

            await Column.update(
                {position: sequelize.literal('position - 1')},
                {where: {position: {[Op.gt]: deletePosition}}, transaction: transaction}
            )

            await transaction.commit();
            return res.json({message: 'Стовпець видалена'})
        } catch (error) {
            await transaction.rollback()
            return next(ApiError.internal('Ошибка при удалении колонки: ' + error.message))
        }
    }

}


module.exports = new ColumnController()