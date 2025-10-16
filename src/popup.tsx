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
import { observer } from 'mobx-react-lite';
import React, { Suspense } from 'react';

import Store from './store';

import '@/styles/build.css';

import ViewModel, { type WebsiteItem } from './viewModel';

const Item = observer(function ({
  id,
  record,
}: {
  id: string;
  record: WebsiteItem;
}) {
  return (
    <div className="flex items-center space-x-2 pr-1 h-8">
      <Tooltip>
        <TooltipTrigger>
          <Label htmlFor={id} className="max-w-24 truncate block">
            {record.name}
          </Label>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs truncate">
          {record.name}
        </TooltipContent>
      </Tooltip>
      <Slider
        id={id}
        className="flex-1"
        max={4}
        step={0.5}
        value={[record.playbackRate]}
        onValueChange={(value) => {
          record.playbackRate = value[0];
        }}
      />
    </div>
  );
});

const ViewModelContext = React.createContext<ViewModel>(null);

const useViewModel = () => {
  const context = React.useContext(ViewModelContext);
  if (!context) {
    throw new Error('useViewModel must be used within a ViewModelProvider');
  }
  return context;
};

const Page = observer(function () {
  const website = useViewModel();
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
              {website.currentName}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <ScrollArea className="h-96 w-full">
                <Item
                  id={website.hostWebsite.url}
                  record={website.hostWebsite}
                />
                {website.websiteItems.map((item, index) => (
                  <Item
                    key={`${item.url}-${index}`}
                    id={item.url}
                    record={item}
                  />
                ))}
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
});

const IndexPopup = observer(function () {
  const [uriData, setUriData] = React.useState<{
    href: string;
    hostname: string;
    favIconUrl: string;
  }>(null);
  React.useEffect(() => {
    const fetchUriData = async () => {
      try {
        const uri = await client.request('getURI');
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            const favIconUrl = tabs[0]?.favIconUrl || '';
            setUriData({ ...uri, favIconUrl });
          },
        );
      } catch (error) {
        console.error('Failed to fetch URI:', error);
      }
    };

    fetchUriData();
  }, []);
  if (!uriData) {
    return <div className="p-4">Loading...</div>;
  }
  return (
    <ViewModelContext.Provider
      value={ViewModel.getInstance(
        uriData.hostname,
        uriData.href,
        uriData.favIconUrl,
        Store.instance,
      )}>
      <Page />
    </ViewModelContext.Provider>
  );
});

export default IndexPopup;
