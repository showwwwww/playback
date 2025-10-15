import { createChannel } from '@/channel';

import type { Meta } from './types';

const channel = createChannel<Meta>('backend');

export default channel;
