import * as winston from 'winston'

export function createWorkerLogger(
  threadId: number,
  workerName = 'AI WORKER',
  backgroundOffset = 4,
) {
  return winston.createLogger({
    // silent: true,
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
