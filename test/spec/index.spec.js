'use strict'

process.env.EXPORTER_CHECK_INTERVAL_MILLIS = 100

const http = require('http')
const { expect } = require('chai')

let i = 0
const wResolvedPath = require.resolve('../../lib/w')
delete require.cache[wResolvedPath]

let returnTwoPips = false
let returnOnePip3 = false
require.cache[wResolvedPath] = {
    id: wResolvedPath,
    file: wResolvedPath,
    loaded: true,
    exports: () => {
        i++

        if (returnTwoPips) {
            return Promise.resolve(`23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
            USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
            pip       pts/0    192.168.2.107    23:50    1.00s  0.15s  0.01s w
            pip       pts/0    192.168.2.107    23:50    1.00s  0.15s  0.01s w
            `)
        } else if (returnOnePip3) {
            return Promise.resolve(`23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
            USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
            pip3       pts/0    192.168.2.107    23:50    1.00s  0.15s  0.01s w
            `)
        } else {
            return Promise.resolve(`23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
            USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
            pip       pts/0    192.168.2.107    23:50    1.00s  0.15s  0.01s w
            `)
        }
    }
}

const index = require('../../lib/index')

describe('WhatActiveUsersExporter', () => {

    after(() => {
        return index()
    })

    it('update the active users metric', () => {
        returnTwoPips = true
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                http.get('http://localhost:9839/metrics', (response) => {
                    if (response.statusCode !== 200) {
                        reject(response.statusCode)
                        return
                    }
                    const responseData = []
                    response.on('data', (data) => {
                        responseData.push(data.toString('ascii'))
                    })
                    response.on('end', () => {
                        const body = responseData.join()
                        expect(body).to.contain('user_sessions_currently_active{user="pip"} 2')
                        resolve()
                    })
                })
            }, 500)
        })
    })

    it('removes metric value for inactive sessions', () => {
        returnTwoPips = false
        returnOnePip3 = true
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                http.get('http://localhost:9839/metrics', (response) => {
                    if (response.statusCode !== 200) {
                        reject(response.statusCode)
                        return
                    }
                    const responseData = []
                    response.on('data', (data) => {
                        responseData.push(data.toString('ascii'))
                    })
                    response.on('end', () => {
                        const body = responseData.join()
                        expect(body).to.contain('user_sessions_currently_active{user="pip"} 0')
                        resolve()
                    })
                })
            }, 500)
        })
    })

    it('add another metric for a new session', () => {
        returnTwoPips = false
        returnOnePip3 = true
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                http.get('http://localhost:9839/metrics', (response) => {
                    if (response.statusCode !== 200) {
                        reject(response.statusCode)
                        return
                    }
                    const responseData = []
                    response.on('data', (data) => {
                        responseData.push(data.toString('ascii'))
                    })
                    response.on('end', () => {
                        const body = responseData.join()
                        expect(body).to.contain('user_sessions_currently_active{user="pip"} 0')
                        expect(body).to.contain('user_sessions_currently_active{user="pip3"} 1')
                        resolve()
                    })
                })
            }, 500)
        })
    })
})