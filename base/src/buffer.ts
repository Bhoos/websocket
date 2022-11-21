export enum BufferType {
  RingBuffer = 1,
  FixedSizeQueue = 2
}

export interface Buffer <T> {
  size : number; // Total number of items that can be added to the buffer.
  add(...items : T[]) : void; // Add an item. Maynot be added if there's no space, as per the rules of the buffer.
  clear() : void; // Remove all items from buffer
  forEach(fn:(el:T) => void) :void; // Loop through all existing items. Earlier ones first.
  toArray(): T[]; // Return an array of all existing items with earlier ones in the beginning of array.
}

export function createBuffer<T>(size: number, type : BufferType) {
  if (type === BufferType.RingBuffer)
    return new RingBuffer<T>(size)
  else if (type === BufferType.FixedSizeQueue)
    return new FixedQueueBuffer<T>(size);

  throw new Error('Buffer type ' + type + ' is not defined.');
}

/**
* A buffer with a limit on total number of items. Also known as circular buffer.
* New items are added to the end, and if there is no space the earliest items are deleted.
* So its like the array has its end connected to its beginning like a circle/ring.
* forEach and toArray have earlier item in the beginning.
*/
export class RingBuffer<T> implements Buffer<T> {
  size : number;
  private count : number = 0 ;
  private pointer : number = 0;
  private buffer : T[];
  constructor(size: number) {
    this.size = size;
    this.buffer = Array(size);
  }

  addItem(item : T) : void {
    this.buffer[this.pointer] = item;
    this.pointer = (this.pointer + 1) % this.size;
    this.count = Math.min(this.count + 1 , this.size);
  }

  add(...items : T[]) : void{
    items.forEach(this.addItem.bind(this));
  }

  clear(): void {
    this.count = 0;
    this.pointer = 0;
  }

  forEach(fn : (el : T) => void) {
    let head = this.pointer - this.count;
    if (head < 0) {
      head = this.size + head;
    }
    for (let i=0; i< this.count; i++) {
      fn(this.buffer[head]);
      head = (head + 1) % this.size;
    }
  }

  toArray() {
    let res : T[] = [];
    this.forEach((el) => {
      res.push(el);
    })
    return res;
  }
}

/**
 * A buffer with a limit on total number of items.
 * New items are added to the end, if there is space, otherwise they are dropped.
 * forEach and toArray have earlier item in the beginning.
 */
export class FixedQueueBuffer<T> implements Buffer<T>{
  size : number;
  private count : number = 0 ;
  private buffer : T[];
  constructor(size: number) {
    this.size = size;
    this.buffer = Array(size);
  }

  add(...items : T[]) : void {
    // Add items to buffer (starting from first) until the buffer is full.
    const freeSize = this.size - this.count;
    const len = Math.min(items.length, freeSize);
    for (var i = 0; i < len; i++) {
      this.buffer[this.count] = items[i];
      this.count++;
    }
  }

  clear(): void {
    this.count = 0;
  }

  forEach(fn : (el : T) => void) {
    for (let i=0; i< this.count; i++) {
      fn(this.buffer[i]);
    }
  }

  toArray() {
    return this.buffer.slice(0, this.count);
  }
}
