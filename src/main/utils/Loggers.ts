import * as winston from 'winston'

const MAIN_ENABLE_LOGGING = !!import.meta.env.MAIN_VITE_MAIN_LOGGING
const WORKER_ENABLE_LOGGING = !!import.meta.env.MAIN_VITE_WORKER_LOGGING

export function createWorkerLogger(
  threadId: number,
  workerName = 'AI WORKER',
  backgroundOffset = 4,
) {
  // hello
  return winston.createLogger({
    silent: WORKER_ENABLE_LOGGING,
    format: winston.format.combine(
      winston.format.colorize({
        all: true,
        colors: {
          info: 'white',
          error: 'red',
        },
      }),
      winston.format.printf(({message, level}) => {
        return `\x1b[${
          41 + backgroundOffset // 41 == red | 41 + 4(default) = 45 == 'magenta'
        }m\x1b[37m[${workerName} ${threadId}]\x1b[0m  ${
          ' ' ?? level
        } ${message} `
      }),
    ),
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      verbose: 4,
      debug: 5,
    },
    defaultMeta: {service: 'AI_WORKER'},
    transports: [new winston.transports.Console()],
  })
}

export const SHELF_LOGGER = winston.createLogger({
  silent: MAIN_ENABLE_LOGGING,
  format: winston.format.combine(
    winston.format.colorize({
      all: true,
      colors: {
        info: 'white',
        error: 'red',
      },
    }),
    winston.format.printf(({message, level}) => {
      return `\x1b[44m\x1b[37m[SHELF]\x1b[0m ${level} ${message} `
    }),
  ),
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
  },
  defaultMeta: {service: 'SHELF'},
  transports: [new winston.transports.Console()],
})
