import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import client from '@/msg/client';
import React from 'react';

import Store from './store';

import '@/styles/build.css';

import type { hostname } from 'os';

function Item({
  id,
  label,
  value,
  action,
}: {
  id: string;
  label: string;
  value: number;
  action: (value: number) => void;
}) {
  const [val, setVal] = React.useState([value]);
  console.log('val', val, value);
  return (
    <div className="flex items-center space-x-2 h-8">
      <Tooltip>
        <TooltipTrigger>
          <Label htmlFor={id} className="max-w-16 truncate block">
            {label}
          </Label>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs truncate">
          {label}
        </TooltipContent>
      </Tooltip>
      <Slider
        id={id}
        className="flex-1"
        max={4}
        step={0.5}
        value={val}
        onValueChange={(value) => {
          setVal(value);
          action(value[0]);
        }}
      />
    </div>
  );
}

function setupPlaybackRate(hostname: string, URI: string) {
  const record = Store.instance.getRecord(hostname, URI);
  const data = Store.instance.getStoreData(hostname);
  if (record) {
    client.request('changePlayback', {
      playbackRate: record.playbackRate,
    });
  } else if (data) {
    client.request('changePlayback', {
      playbackRate: data?.default || 1,
    });
  } else {
    Store.instance.setStoreData(hostname, { name: hostname, default: 1 });
  }
}

function IndexPopup() {
  const [website, setWebsite] = React.useState({ hostname: '', href: '' });
  React.useEffect(() => {
    client.request('getURI').then(({ href, hostname }) => {
      setWebsite({ hostname: hostname, href });
      setupPlaybackRate(hostname, href);
    });
  }, []);
  const data = React.useMemo(
    () => Store.instance.getStoreData(website.hostname),
    [website],
  );
  console.log(data);
  return (
    <Card className="w-xs gap-3">
      <CardHeader>
        <CardTitle className="text-3xl">Playback</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion
          type="single"
          collapsible
          className="w-full"
          defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-2xl">
              {data?.name || website.hostname}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <ScrollArea className="h-96 w-full">
                <Item
                  id="root"
                  label="Default"
                  value={data?.default || 1}
                  action={(value) => {
                    const record = Store.instance.getRecord(
                      website.hostname,
                      website.href,
                    );
                    if (!record) {
                      client.request('changePlayback', {
                        playbackRate: value,
                      });
                    }
                    Store.instance.updateStoreData(
                      website.hostname,
                      (record) => {
                        record.default = value;
                        record.name = website.hostname;
                        return record;
                      },
                    );
                  }}
                />
                {Object.entries(data?.children || {}).map(([URI, record]) => (
                  <Item
                    key={URI}
                    id={URI}
                    label={record.name}
                    value={record.playbackRate}
                    action={(value) => {
                      client.request('changePlayback', {
                        playbackRate: value,
                      });
                      Store.instance.updateRecord(
                        website.hostname,
                        URI,
                        (record) => {
                          record.playbackRate = value;
                          return record;
                        },
                      );
                    }}
                  />
                ))}
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default IndexPopup;
