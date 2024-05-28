function getDeadlineRestrictions(D, t, deadline) {
    const dependencies = getDependencies(D)
    const allChains = []

    for (let task = 0; task < D.length; task++) {
        getAllChains(task, dependencies, new Set(), [], allChains)
    }

    const minDeadlines = getMinDeadlines(allChains, t)

    const maxDeadlines = getMaxDeadlines(allChains, t, deadline)

    for (let i = 0; i < minDeadlines.length; i++) {
        if (maxDeadlines[i] < minDeadlines[i]) {
            maxDeadlines.fill(deadline)
            break
        }
    }

    return [minDeadlines, maxDeadlines]
}

function getDependencies(matrix) {
    const dependencies = new Map()
    matrix.forEach((row, i) => {
        row.forEach((dep, j) => {
            if (dep === 1) {
                if (!dependencies.has(i)) {
                    dependencies.set(i, [])
                }
                dependencies.get(i).push(j)
            }
        })
    })
    return dependencies
}

function getAllChains(task, dependencies, visited, chain, allChains) {
    if (visited.has(task)) return
    visited.add(task)
    chain.push(task)

    if (!dependencies.has(task) || dependencies.get(task).length === 0) {
        allChains.push([...chain])
    } else {
        for (let dep of dependencies.get(task)) {
            getAllChains(dep, dependencies, visited, chain, allChains)
        }
    }

    chain.pop()
    visited.delete(task)
}

function calculateCompletionTimes(chains, times) {
    return chains.map(chain => {
        const totalTime = chain.reduce((acc, task) => acc + times[task], 0)
        return {chain, totalTime}
    })
}

function getMaxCompletionTimes(times) {
    const maxTimes = []

    for (const key in times) {
        if (times.hasOwnProperty(key)) {
            const maxTime = Math.max(...times[key])
            maxTimes.push(maxTime)
        }
    }

    return maxTimes
}

function mergeDeadlines(deadlines) {
    const merged = {}

    deadlines.forEach(obj => {
        for (const [key, value] of Object.entries(obj)) {
            if (!merged[key]) {
                merged[key] = []
            }
            merged[key].push(value)
        }
    })

    return merged
}

function calculateMinDeadlinesArray(mergedDeadlines) {
    const minDeadlines = []

    for (const values of Object.values(mergedDeadlines)) {
        minDeadlines.push(Math.min(...values))
    }

    return minDeadlines
}

function getMinDeadlines(allChains, t) {
    const completionTimes = calculateCompletionTimes(allChains, t)

    const minDeadlineOptions = {}

    completionTimes.forEach(({chain, totalTime}) => {
        if (minDeadlineOptions.hasOwnProperty(chain[0])) {
            minDeadlineOptions[chain[0]].push(totalTime)
        } else minDeadlineOptions[chain[0]] = [totalTime]
    })

    return getMaxCompletionTimes(minDeadlineOptions)
}

function getMaxDeadlines(allChains, t, deadline) {
    const deadlines = []

    allChains.forEach(chain => {
        let d = deadline

        const temp = {}

        chain.forEach((index, i) => {
            if (i !== 0)
                d -= t[chain[i - 1]]
            temp[index] = d
        })

        deadlines.push(temp)
    })

    const mergedDeadlines = mergeDeadlines(deadlines)

    return calculateMinDeadlinesArray(mergedDeadlines)
}

module.exports = {getDeadlineRestrictions}