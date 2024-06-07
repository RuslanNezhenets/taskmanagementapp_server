const {Project} = require("../models/models")
const taskController = require('../controllers/taskController')
const taskDependencyController = require('../controllers/taskDependencyController')
const roleController = require('../controllers/roleController')
const userProjectController = require('../controllers/userProjectController')
const {getDeadlineRestrictions} = require("./generateConstraints")

async function generateData(projectId, useAvailable = true) {
    const project = await Project.findByPk(projectId)

    const tasks = await getTasks(projectId)
    const availableRoles = await getAvailableRoles(projectId, tasks)

    const tasksWithNullDuration = findElementsAtNullPositions(tasks.map(task => task.duration), tasks)
    if (tasksWithNullDuration.length) {
        const taskIds = tasksWithNullDuration.map(task => task.id)
        const error = new Error('У наступних завдань не встановлена тривалість')
        error.body = {type: 'task', ids: taskIds}
        throw error
    }

    const tasksWithNullRole = findElementsAtNullPositions(tasks.map(task => task.roleId), tasks)
    if (tasksWithNullRole.length) {
        const taskIds = tasksWithNullRole.map(task => task.id)
        const error = new Error('У наступних завдань не встановлена роль')
        error.body = {type: 'task', ids: taskIds}
        throw error
    }

    const roleIdsWithZeroUsers = findKeyWithZeroValue(availableRoles)
    if (roleIdsWithZeroUsers.length) {
        const error = new Error('Не призначено співробітників на наступні ролі')
        error.body = {type: 'role', ids: roleIdsWithZeroUsers.map(roleId => parseInt(roleId))}
        throw error
    }

    if(!useAvailable && !project.deadline) {
        throw new Error('Не вказаний крайній термін виконання проєкту')
    }

    const variables = {
        taskDependencies: await getDependenciesArray(projectId, tasks),
        t: tasks.map(task => task.duration),
        r: tasks.map(task => task.roleId).map(person => Object.keys(availableRoles).indexOf(person.toString()) + 1),
        const_w: useAvailable ? Object.values(availableRoles) : [],
    }

    variables.s = project.startDate ? getDays(new Date(project.startDate).getTime()) : getDays(new Date().getTime())

    const sum_t = variables.t.reduce((accumulator, currentValue) => accumulator + currentValue, 0)

    let [lb, ub] = getDeadlineRestrictions(
        variables.taskDependencies,
        variables.t,
        useAvailable ? sum_t : getDays(new Date(project.deadline).getTime()) - variables.s
    )

    for (let i = 0; i < lb.length; i++) {
        if (lb[i] > ub[i]) {
            console.log(`Элемент ${lb[i]} в первом массиве больше элемента ${ub[i]} во втором массиве на позиции ${i}`)
            const error = new Error('Не можливо встигнути виконати проєкт в термін.\n' +
                'Мінімум один з ланцюжків задач не можливо встигнути виконати до кінця проєкту')
            error.body = {type: 'other'}
            throw error
        }
    }

    variables.lb = lb
    variables.ub = ub

    variables.tasks = tasks
    variables.availableRoles = availableRoles

    return variables
}

const findElementsAtNullPositions = (firstArray, secondArray) =>
    firstArray.reduce((acc, val, index) => {
        if (val === null) acc.push(secondArray[index])
        return acc
    }, [])

const findKeyWithZeroValue = obj => Object.keys(obj).filter(key => obj[key] === 0)

const getDays = (date) => {
    return Math.floor(date / (1000 * 3600 * 24))
}

const getDependenciesArray = async (projectId, tasks) => {
    const taskDependencies = Array.from({length: tasks.length}, () => Array(tasks.length).fill(0))

    const dependencies = await getDependencies(projectId)

    dependencies.forEach(dependency => {
        const col = tasks.map(task => task.id).indexOf(dependency.taskId)
        const row = tasks.map(task => task.id).indexOf(dependency.dependentTaskId)
        taskDependencies[row][col] = 1
    })

    return taskDependencies
}

const getAvailableRoles = async (projectId, tasks) => {
    const roles = await getRoles(projectId)
    const userProjects = await getUserProjects(projectId)

    const availableRoles = {}
    roles.map(role => role.id)
        .filter(roleId => tasks.some(task => task.roleId === roleId))
        .forEach(roleId => {
            availableRoles[roleId] = userProjects.filter(up => up.roleId === roleId).length
        })

    return availableRoles
}

const getTasks = async (projectId) => {
    const req = {query: {projectId}}
    const res = {
        json: data => data,
        status: function (statusCode) {
            this.statusCode = statusCode
            return this
        }
    }

    return await taskController.getAll(req, res)
}

const getDependencies = async (projectId) => {
    const req = {query: {projectId}}
    const res = {
        json: data => data,
        status: function (statusCode) {
            this.statusCode = statusCode
            return this
        }
    }

    return await taskDependencyController.getAll(req, res)
}

const getRoles = async (projectId) => {
    const req = {query: {projectId}}
    const res = {
        json: data => data,
        status: function (statusCode) {
            this.statusCode = statusCode
            return this
        }
    }

    return await roleController.getAll(req, res)
}

const getUserProjects = async (projectId) => {
    const req = {query: {projectId}}
    const res = {
        json: data => data,
        status: function (statusCode) {
            this.statusCode = statusCode
            return this
        }
    }

    return await userProjectController.getAll(req, res)
}

module.exports = {generateData}