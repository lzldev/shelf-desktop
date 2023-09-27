import { createWorkerLogger } from '../../utils/Loggers'

type AsyncFunc = (...any: any[]) => Promise<any>

export class AsyncQueue {
  private queue: AsyncFunc[] = []
  private running = 0
  private concurrent: number
  private Logger = createWorkerLogger(0, 'ASYNC QUEUE', 0)
  private clean = true
  public onClear: Function

  public getRunning() {
    return this.running
  }

  private defaultClear() {
    this.Logger.info('Queue Clean')
  }

  constructor(concurrent: number, onClear?: Function) {
    this.concurrent = concurrent
    this.onClear = onClear ?? this.defaultClear
  }
  private checkCap() {
    return this.running >= this.concurrent
  }
  private addRunning() {
    return this.running++
  }
  private decreaseRunning() {
    return this.running--
  }

  private moveQueue() {
    if (this.checkCap()) {
      return
    }

    const job = this.queue.shift()

    if (!this.clean && this.running === 0) {
      this.clean = true
      this.onClear()
    }
    if (!job) {
      return
    }

    this.internalEnqueue(job)
  }
  private async internalEnqueue(job: AsyncFunc) {
    this.addRunning()

    return job().then((passThrough) => {
      this.Logger.info(`JOB DONE | REMAINING = ${this.queue.length}`)

      this.decreaseRunning()
      this.moveQueue()
      return passThrough
    })
  }

  enqueue(job: AsyncFunc) {
    this.clean = false

    if (this.checkCap()) {
      this.queue.push(job)
      return
    }

    this.internalEnqueue(job)
  }

  onClearOnce(onClear: Function) {
    this.onClear = () => {
      onClear()
      this.onClear = this.defaultClear
    }
  }
}

export class AsyncBatchQueue {
  private queue: AsyncFunc[] = []
  private running = 0
  private concurrent: number
  private Logger = createWorkerLogger(0, 'BATCH QUEUE', 0)
  private clean = true
  private batchTimeout?: NodeJS.Timeout

  public onClear: Function
  public onBatch: Function

  public getRunning() {
    return this.running
  }

  private defaultClear() {
    this.Logger.info('Queue Clean')
  }

  constructor(concurrent: number, onClear?: Function, onBatch?: Function) {
    this.concurrent = concurrent
    this.onClear = onClear ?? this.defaultClear
    this.onBatch = onBatch ?? (async () => { })
  }

  private async internalBatchEnqueue() {
    if (this.running >= this.concurrent) {
      return
    }

    if (this.queue.length === 0) {
      this.Logger.info('BATCH QUEUE CLEAR')
      this.onClear()
      return
    }

    this.Logger.info('BATCH ENQUEUE')

    if (this.batchTimeout) {
      this.Logger.info('BATCH TIMEOUT CLEAN')
      clearTimeout(this.batchTimeout)
    }

    this.running = Math.min(this.concurrent, this.queue.length)

    this.batchTimeout = setTimeout(async () => {
      const batch = this.queue.slice(0, this.running).map((v) => v())

      this.queue = this.queue.slice(this.running)
      this.Logger.info(`BATCH RUNNING | ${batch}`)

      this.running = batch.length

      Promise.allSettled(batch).then(async (res) => {
        this.batchTimeout = undefined
        this.running = 0

        this.Logger.info(`BATCH DONE | ${JSON.stringify(res)}`)

        await this.onBatch()

        this.internalBatchEnqueue()
        return res
      })
    }, 500)
  }

  enqueue(job: AsyncFunc) {
    this.clean = false

    this.queue.push(job)

    this.internalBatchEnqueue()
  }

  onClearOnce(onClear: Function) {
    this.onClear = () => {
      onClear()
      this.onClear = this.defaultClear
    }
  }
}
