import {createWorkerLogger} from '../../utils/Loggers'

type AsyncFunc = (...any: any[]) => Promise<any>

export class AsyncQueue {
  private queue: AsyncFunc[] = []
  private running: number = 0
  private concurrent: number
  private Logger = createWorkerLogger(0, 'ASYNC QUEUE', 0)
  public onClear: Function
  private clean = true

  constructor(concurrent: number, onClear?: Function) {
    this.concurrent = concurrent
    this.onClear =
      onClear ??
      (() => {
        this.Logger.info('Queue Clean')
      })
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

    if (!job) {
      if (!this.clean && this.running === 0) {
        this.clean = false
        this.onClear()
      }
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
}
