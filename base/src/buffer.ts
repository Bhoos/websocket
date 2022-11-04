export enum BufferType {
  RingBuffer = 1,
  FixedSizeQueue = 2
}

export class Buffer<T> {
  size : number;
  type : BufferType;
  private count : number = 0 ;
  private end : number = 0;
  private buffer : T[];
  constructor(size: number, type : BufferType) {
    this.size = size;
    this.type = type;
    this.buffer = Array(size);
  }


  add(...items : T[]) : void{
    if (this.type === BufferType.FixedSizeQueue){
      const len = Math.min(items.length, this.size - this.count);
      for (var i = 0; i < len; i++) {
	this.buffer[this.end] = items[i];
	this.end = this.end + 1;
      }
      this.count += len;
    } else {
      for (var i = 0; i < items.length; i++) {
	this.buffer[this.end] = items[i];
	this.end = (this.end+1) % this.size;
      }
      this.count = Math.min(this.count+items.length, this.size);
    }
  }

  clear(): void {
    this.count =0;
    this.end = 0;
  }

  toArray() {
    let pos = this.end - this.count;
    if (pos < 0) {
      pos = this.size + pos;
    }

    let res : T[] = [];
    for (let i=0; i< this.count; i++) {
      res.push(this.buffer[pos]);
      pos = (pos + 1) % this.size;
    }
    return res;
  }

  forEach(fn : (el : T) => void) {
    let pos = this.end - this.count;
    if (pos < 0) {
      pos = this.size - pos;
    }
    for (let i=0; i< this.count; i++) {
      fn(this.buffer[pos]);
      pos = (pos + 1) % this.size;
    }
  }
}
