type Record = {
  name?: string;
  playbackRate: number;
};

type URIData = {
  [URI: string]: Record;
};

export type StoreData = { name: string; default: number; children?: URIData };

export default class Store {
  private constructor() {}
  static instance: Store = new Store();
  getRecord(hostname: string, URI: string): Record | null {
    const data = localStorage.getItem(hostname);
    return (JSON.parse(data) as URIData)?.[URI] || null;
  }

  addRecord(hostname: string, URI: string, record: Record) {
    const data = localStorage.getItem(hostname);
    const URIData = (JSON.parse(data) as URIData) ?? null;
    URIData[URI] = record;
    localStorage.setItem(hostname, JSON.stringify(URIData));
  }

  deleteRecord(hostname: string, URI: string) {
    const data = localStorage.getItem(hostname);
    const URIData = (JSON.parse(data) as URIData) ?? null;
    if (URIData) {
      delete URIData[URI];
      localStorage.setItem(hostname, JSON.stringify(URIData));
    }
  }

  updateRecord(
    hostname: string,
    URI: string,
    updater: (record: Record) => Record,
  ) {
    const data = this.getRecord(hostname, URI) || { playbackRate: 1 };
    const newData = updater(data);
    this.addRecord(hostname, URI, newData);
  }

  getStoreData(hostname: string): StoreData | null {
    const data = localStorage.getItem(hostname);
    return (JSON.parse(data) as StoreData) || null;
  }

  setStoreData(hostname: string, data: StoreData) {
    localStorage.setItem(hostname, JSON.stringify(data));
  }

  updateStoreData(hostname: string, updater: (data: StoreData) => StoreData) {
    const data = this.getStoreData(hostname) || { name: hostname, default: 1 };
    const newData = updater(data);
    this.setStoreData(hostname, newData);
  }
}
