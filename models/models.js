const sequelize = require('../db')
const {DataTypes} = require('sequelize')

const User = sequelize.define('user', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    position: {
        type: DataTypes.STRING,
        allowNull: true
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    organization: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatar: {
        type: DataTypes.BLOB,
        allowNull: true,
    },
    avatarMimeType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dateCreated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false
})

const Column = sequelize.define('task_board_column', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'projects',
            key: 'id',
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    done: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    limit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    }
}, {
    timestamps: false
})

const Task = sequelize.define('task', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'roles',
            key: 'id',
        }
    },
    columnId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'task_board_columns',
            key: 'id',
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    executorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        }
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        }
    },
}, {
    timestamps: true
})

const Role = sequelize.define('role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'projects',
            key: 'id',
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
})


const Project = sequelize.define('project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    managerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        }
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    timestamps: true
})

const Access = sequelize.define('access_level', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: false,
    hooks: {
        afterSync: async (options) => {
            await Access.bulkCreate([
                {key: 'admin', description: 'Адміністратор'},
                {key: 'user', description: 'Користувач'}
            ], {ignoreDuplicates: true});
        }
    }
})

const UserProject = sequelize.define('user_project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    projectId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'projects',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    roleId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'roles',
            key: 'id'
        }
    },
    accessId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'access_levels',
            key: 'id'
        }
    }
}, {
    timestamps: true
})

const TaskDependency = sequelize.define('task_dependency', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
}, {
    timestamps: false
})

// Зв'язок між ролями та проєктами
Project.hasMany(Role, {onDelete: 'CASCADE'})
Role.belongsTo(Project, {onDelete: 'CASCADE'})

// Зв'язок між ролями та задачами
Role.hasMany(Task, {onDelete: 'CASCADE'})
Task.belongsTo(Role, {onDelete: 'CASCADE'})

//Зв'язок між стовпцями та задачами
Column.hasMany(Task, {foreignKey: 'columnId', onDelete: 'CASCADE'})
Task.belongsTo(Column, {foreignKey: 'columnId', as: 'column', onDelete: 'CASCADE'})

// Зв'язок між виконавцем та задачею
User.hasMany(Task, {as: 'AssignedTasks', foreignKey: 'executorId', onDelete: 'CASCADE'})
Task.belongsTo(User, {foreignKey: 'executorId', onDelete: 'CASCADE'})

// Зв'язок між автором та задачею
User.hasMany(Task, {as: 'AuthoredTasks', foreignKey: 'authorId', onDelete: 'CASCADE'})
Task.belongsTo(User, {foreignKey: 'authorId', onDelete: 'CASCADE'})

// Зв'язок між стовпцями та проєктами
Project.hasMany(Column, {foreignKey: 'projectId', onDelete: 'CASCADE'})
Column.belongsTo(Project, {foreignKey: 'projectId', onDelete: 'CASCADE'})

// Зв'язок між проєктами та призначенням користувачів до проєкту
Project.hasMany(UserProject, {foreignKey: 'projectId', onDelete: 'CASCADE'})
UserProject.belongsTo(Project, {foreignKey: 'projectId', onDelete: 'CASCADE'})

// Зв'язок між користувачами та UserProject
User.belongsToMany(Project, {through: {model: UserProject, unique: false}, onDelete: 'CASCADE'})
Project.belongsToMany(User, {through: {model: UserProject, unique: false}, onDelete: 'CASCADE'})

// Зв'язок між UserProject та користувачем
UserProject.belongsTo(User, {foreignKey: 'userId', onDelete: 'CASCADE'})
User.hasMany(UserProject, {foreignKey: 'userId', onDelete: 'CASCADE'})

// Зв'язок між UserProject та рівнями доступу
Access.hasMany(UserProject, {foreignKey: 'accessId', onDelete: 'CASCADE'})
UserProject.belongsTo(Access, {foreignKey: 'accessId', as: 'access', onDelete: 'CASCADE'})

Task.belongsToMany(Task, {
    through: TaskDependency,
    as: 'DependentTasks',
    foreignKey: 'taskId',
    otherKey: 'dependentTaskId',
    onDelete: 'CASCADE'
})

Task.belongsToMany(Task, {
    through: TaskDependency,
    as: 'DependencyTasks',
    foreignKey: 'dependentTaskId',
    otherKey: 'taskId',
    onDelete: 'CASCADE'
})

module.exports = {
    User,
    Task,
    Column,
    Role,
    Project,
    UserProject,
    TaskDependency,
    Access
}
