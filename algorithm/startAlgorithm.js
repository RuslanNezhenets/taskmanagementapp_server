const util = require('util')
const exec = util.promisify(require('child_process').exec)
const path = require('path')
require('dotenv').config()

async function runMatlabScript(variables) {
    Object.entries(variables).forEach(([key, value]) => {
        if (typeof value === 'number') {
            variables[key] = value.toString()
        } else if (Array.isArray(value)) {
            if (value.length > 0 && Array.isArray(value[0])) {
                variables[key] = `[${value.map(row => row.join(', ')).join('; ')}]`
            } else {
                variables[key] = `[${value.join(', ')}]`
            }
        }
    })

    const variablesString = Object.values(variables).join(', ')

    const command = `${process.env.MATLAB_PATH} -batch "addpath('${path.join(process.cwd(), process.env.MATLAB_SCRIPT_PATH)}'); [~, result, w, fitness]=main(${variablesString}); fprintf('w: [%d]\\n', w); fprintf('result: [%d]\\n', result); fprintf('fitness: [%d]\\n', fitness);"`

    try {
        const {stdout, stderr} = await exec(command, {encoding: 'utf8'})
        if (stderr) {
            console.error(`Помилка MATLAB: ${stderr}`)
            return null
        }

        console.log(stdout)

        const lines = stdout.split('\n').filter(line => line.trim() !== '')
        const w = lines.filter(l => l.includes('w:')).map(extractNumber)
        const result = lines.filter(l => l.includes('result:')).map(extractNumber)
        const fitness = lines.filter(l => l.includes('fitness:')).map(extractNumber)[0]

        function extractNumber(s) {
            const match = s.match(/\[(\d+)\]/)
            return match ? parseInt(match[1]) : null
        }

        return [{result: result, w: w}, fitness]
    } catch (error) {
        console.error(`Помилка виконання: ${error}`)
        return null
    }
}

module.exports = {runMatlabScript}
