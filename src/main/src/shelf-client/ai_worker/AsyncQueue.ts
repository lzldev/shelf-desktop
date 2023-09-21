import { createWorkerLogger } from '../../utils/Loggers'

type AsyncFunc = (...any: any[]) => Promise<any>

export class AsyncQueue {
  private queue: AsyncFunc[] = []
  private running: number = 0
  private concurrent: number
  private Logger = createWorkerLogger(0, 'ASYNC QUEUE', 0)
  private clean = true
  public onClear: Function

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

    return job().finally(() => {
      this.Logger.info(`JOB DONE | REMAINING = ${this.queue.length}`)

      this.decreaseRunning()
      this.moveQueue()
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
