import {
  makeAutoObservable,
  observable,
  reaction,
  type IReactionDisposer,
} from 'mobx';

import client from './msg/client';
import type Store from './store';

export type WebsiteItem = {
  name: string;
  playbackRate: number;
  url: string;
};

export default class ViewModel {
  private static instance: ViewModel;
  currentURL: string;
  currentDomain: string;
  currentName: string;
  currentFavIconUrl: string;
  hostWebsite: WebsiteItem;
  websiteItems: Array<WebsiteItem> = [];
  store: Store;
  private disposers: IReactionDisposer[] = [];

  private constructor(
    hostname: string,
    url: string,
    favIconUrl: string,
    store: Store,
  ) {
    makeAutoObservable(this, {
      store: false,
    });
    const hostWebsite = store.getStoreData(hostname) || {
      default: 1,
      name: hostname,
      children: {},
    };
    this.hostWebsite = observable({
      name: hostWebsite.name,
      playbackRate: hostWebsite.default,
      url: hostname,
    });
    this.currentURL = url;
    this.currentDomain = hostname;
    this.currentName = hostWebsite.name || this.currentDomain;
    this.currentFavIconUrl = favIconUrl;
    this.store = store;
    Object.entries(hostWebsite.children ?? {}).forEach(([url, record]) => {
      this.websiteItems.push({
        name: record.name,
        playbackRate: record.playbackRate,
        url,
      });
    });
    this.setupItemObservers();
  }

  public static getInstance(
    hostname: string,
    url: string,
    favIconUrl: string,
    store: Store,
  ): ViewModel {
    if (!ViewModel.instance) {
      ViewModel.instance = new ViewModel(hostname, url, favIconUrl, store);
    }
    return ViewModel.instance;
  }

  private setupItemObservers() {
    // Watch for array changes (add/remove items)
    this.disposers.push(
      reaction(
        () => this.websiteItems.length,
        (length, prevLength) => {
          if (length > prevLength) {
            // New item added
            const newItem = this.websiteItems[length - 1];
            this.setupItemPropertyWatcher(newItem, length - 1);
            this.store.addRecord(this.currentDomain, newItem.url, {
              name: newItem.name,
              playbackRate: newItem.playbackRate,
            });
          } else if (length < prevLength) {
            this.store.deleteRecord(
              this.currentDomain,
              // Assuming the last item was removed
              this.websiteItems[prevLength - 1]?.url,
            );
          }
        },
      ),
    );

    this.disposers.push(
      reaction(
        () => this.hostWebsite.playbackRate,
        (rate) => {
          if (
            this.store.getRecord(this.currentDomain, this.currentURL) === null
          ) {
            client.request('changePlayback', { playbackRate: rate });
          }
          this.store.updateStoreData(this.currentDomain, (data) => ({
            ...data,
            default: rate,
            children: {},
          }));
        },
      ),
    );

    this.disposers.push(
      reaction(
        () => this.hostWebsite.name,
        (name) => {
          this.store.updateStoreData(this.currentDomain, (data) => ({
            ...data,
            name,
          }));
        },
      ),
    );

    // Watch each item's properties
    this.websiteItems.forEach((item, index) => {
      this.setupItemPropertyWatcher(item, index);
    });
  }

  private setupItemPropertyWatcher(item: WebsiteItem, index: number) {
    // Watch playbackRate changes for this specific item
    this.disposers.push(
      reaction(
        () => item.playbackRate,
        (rate) => {
          if (this.currentURL === item.url) {
            client.request('changePlayback', { playbackRate: rate });
          }
          this.store.updateRecord(this.currentDomain, item.url, (record) => ({
            ...record,
            playbackRate: rate,
          }));
        },
      ),
    );

    this.disposers.push(
      reaction(
        () => item.name,
        (name) => {
          this.store.updateRecord(this.currentDomain, item.url, (record) => ({
            ...record,
            name,
          }));
        },
      ),
    );
  }

  dispose() {
    this.disposers.forEach((disposer) => disposer());
    this.disposers = [];
  }
}
