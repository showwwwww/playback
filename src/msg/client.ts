import { createChannel } from '@/channel';

import type { Meta } from './types';

const channel = createChannel<Meta>('client');

export default channel;
