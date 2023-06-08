import { Worker, isMainThread, parentPort } from 'worker_threads';
import { Observable } from 'rxjs';
import { join } from 'path';
import { existsSync } from 'fs';


export function startPushNewListingsAlertsNotificationsIntervalJob() {
  return new Observable((subscriber) => {
    if (!isMainThread) {
      // must be main thread
      return subscriber.complete();
    }

    let worker_file_path = join(__dirname, 'push-alerts-worker.bundle.js');
    let fileExists = existsSync(worker_file_path);
    if (!fileExists) {
      console.log(`Worker File does not exist, trying parent directory...`);
      worker_file_path = join(__dirname, '../', 'push-alerts-worker.bundle.js');
      fileExists = existsSync(worker_file_path);
      if (!fileExists) {
        console.log(`Worker File does not exist...`);
        return subscriber.complete();
      }
    }

    const worker = new Worker(worker_file_path);
    console.log(`Started push alerts worker:`, );

    worker.on('message', (msg) => {
      console.log(msg);
      subscriber.next(msg);
    });

  });
}