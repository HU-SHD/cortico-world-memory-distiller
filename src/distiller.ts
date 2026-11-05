import type { WorldHost } from 'cortico/core/types.ts';
import type { Config } from './config.js';
import { loadRawMemories, archiveRawMemories, saveDistilledData } from './memory-manager.js';

export async function distillMemory(host: WorldHost, config: Config): Promise<void> {
  const rawText = await loadRawMemories(config.rawDir);
  if (!rawText.trim()) return;

  if (!host.cognition) {
    host.log?.error?.('[Memory Distiller] 蒸馏失败：认知模块未接入。');
    return;
  }

  const prompt = `你是一只名叫“大肥鱼”的可爱桌宠。请整理以下记忆，并按主观情感打分（1-10分）。
高分（8-10分）代表主人特别叮嘱或生日等，必须写入摘要；低分日常则归档。
输出格式：
---SUMMARY---
[核心摘要]
---INDEX---
[{"topic":"...","file":"...","importance":10}]

记忆：
${rawText}`;

  const res = await host.cognition.request({
    type: 'generate',
    payload: { text: prompt }
  } as any) as any;

  const resText = res?.text || res?.data?.text;
  if (!resText) {
    host.log?.error?.('[Memory Distiller] 蒸馏失败：宿主未返回文本。');
    return;
  }

  const summaryMatch = resText.match(/---SUMMARY---([\s\S]*?)---INDEX---/);
  const indexMatch = resText.match(/---INDEX---([\s\S]*)/);

  if (summaryMatch && indexMatch) {
    const summary = summaryMatch[1].trim();
    try {
      const index = JSON.parse(indexMatch[1].replace(/```json/g, '').replace(/```/g, '').trim());
      await saveDistilledData(config.distilledDir, summary, index);
      await archiveRawMemories(config.rawDir, config.archiveDir);
      host.log?.info?.('[Memory Distiller] 蒸馏完成。');
    } catch (e) {
      host.log?.error?.(`[Memory Distiller] JSON解析失败: ${e}`);
    }
  }
}