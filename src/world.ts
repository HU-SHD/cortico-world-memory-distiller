import type { WorldHost } from 'cortico/core/types.ts';
import { Config, DEFAULT_CONFIG } from './config.js';
import { distillMemory } from './distiller.js';
import { searchArchive } from './memory-manager.js';

export class MemoryDistillerWorld {
  id = 'memory-distiller';
  private timer?: ReturnType<typeof setInterval>;

  async start(host: WorldHost): Promise<void> {
    const config = { ...DEFAULT_CONFIG, ...(host as any).config };

    // 1. 移除这里的 host.tools.register 代码

    // 2. 注册定时蒸馏任务
    this.timer = setInterval(() => {
      distillMemory(host, config).catch(err => host.log?.error?.(String(err)));
    }, config.intervalDays * 86400000);

    host.log?.info?.('[Memory Distiller] 已启动，潜意识检索工具已就绪。');
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
  }

  // 3. 新增 tool 方法，作为工具的执行入口
  async tool(host: WorldHost, name: string, args: any): Promise<any> {
    if (name === 'recall_archive_memory') {
      const config = { ...DEFAULT_CONFIG, ...(host as any).config };
      const content = await searchArchive(host, config.archiveDir, args.query, config.ragThreshold);
      return { success: true, content };
    }
    throw new Error(`Unknown tool: ${name}`);
  }

  // 注入环境提示词变量
  envPromptVars(): Record<string, string> {
    return {
      memoryBehavior: '核心记忆不足时禁止直接回答“我忘了”，必须先调用 recall_archive_memory 进行检索。',
    };
  }
}