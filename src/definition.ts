import { MemoryDistillerWorld } from './world.js';
import { DEFAULT_CONFIG } from './config.js';

export default {
  id: 'memory-distiller',
  label: '记忆蒸馏',
  create() {
    return new MemoryDistillerWorld();
  },
  // 将工具声明放在 describe 字段中
  describe: {
    tools: [
      {
        name: 'recall_archive_memory',
        label: 'act',
        description: '当核心记忆不足时，绝不要说忘了。请调用此工具去潜意识中搜索。',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
      }
    ],
    events: [],
  },
  config: {
    default: DEFAULT_CONFIG,
  },
};