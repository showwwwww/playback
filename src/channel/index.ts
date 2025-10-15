export type ChannelMeta = {
  [event: string]: {
    parameters: unknown;
    response: unknown;
  };
};

type Channel<Meta extends ChannelMeta> = {
  addEventListener: <EventName extends keyof Meta>(
    eventName: EventName,
    listener: (
      data: Meta[EventName]['parameters'],
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: Meta[EventName]['response']) => void,
    ) => void,
  ) => void;
  request: <EventName extends keyof Meta>(
    eventName: EventName,
    data?: Meta[EventName]['parameters'],
  ) => Promise<Meta[EventName]['response']>;
};

export function createChannel<Meta extends ChannelMeta>(
  type: 'client' | 'backend',
): Channel<Meta> {
  const listeners: Map<keyof Meta, Set<Function>> = new Map();

  const addEventListener: Channel<Meta>['addEventListener'] = (
    eventName,
    listener,
  ) => {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName)?.add(listener);
  };

  const request: Channel<Meta>['request'] =
    type === 'client'
      ? async (eventName, data) =>
          new Promise((resolve) => {
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (tabs) {
                chrome.tabs.sendMessage(
                  tabs[0].id,
                  {
                    eventName,
                    data,
                  },
                  function (response) {
                    // This callback receives the response from content script
                    if (chrome.runtime.lastError) {
                      console.error('Error:', chrome.runtime.lastError);
                    } else {
                      resolve(response);
                    }
                  },
                );
              },
            );
          })
      : async (eventName, data) =>
          chrome.runtime.sendMessage({
            eventName,
            data,
          });

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (type !== 'client' || sender.tab?.active) {
        const eventListeners = listeners.get(request.eventName);
        if (eventListeners) {
          eventListeners.forEach((listener) => {
            listener(request.data, sender, sendResponse);
          });
        }
      }
    },
  );

  return {
    addEventListener,
    request,
  };
}
