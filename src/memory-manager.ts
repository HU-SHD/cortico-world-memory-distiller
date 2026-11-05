import fs from 'node:fs/promises';
import path from 'node:path';
import type { WorldHost } from 'cortico/core/types.ts';

export async function loadRawMemories(rawDir: string): Promise<string> {
  try {
    await fs.mkdir(rawDir, { recursive: true });
    const files = await fs.readdir(rawDir);
    const parts: string[] = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(rawDir, file), 'utf-8');
        parts.push(`### 文件: ${file}\n${content}`);
      }
    }
    return parts.join('\n\n');
  } catch {
    return '';
  }
}

export async function archiveRawMemories(rawDir: string, archiveDir: string): Promise<void> {
  await fs.mkdir(archiveDir, { recursive: true });
  const files = await fs.readdir(rawDir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      await fs.rename(path.join(rawDir, file), path.join(archiveDir, file));
    }
  }
}

export async function saveDistilledData(distilledDir: string, summary: string, index: unknown[]): Promise<void> {
  await fs.mkdir(distilledDir, { recursive: true });
  await fs.writeFile(path.join(distilledDir, 'MEMORY.md'), summary, 'utf-8');
  await fs.writeFile(path.join(distilledDir, 'INDEX.json'), JSON.stringify(index, null, 2), 'utf-8');
}

export async function searchArchive(
  host: WorldHost,
  archiveDir: string,
  query: string,
  threshold: number
): Promise<string> {
  // 1. 判断 cognition 是否可用
  if (!host.cognition) {
    return '大肥鱼现在无法进行深度思考（认知模块未开启）。';
  }

  const files = await fs.readdir(archiveDir);
  if (files.length === 0) return '大肥鱼的潜意识里一片空白。';

  // 2. 请求查询向量 (加上 as any 避免类型未定义的报错)
  const queryRes = await host.cognition.request({
    type: 'embed',
    payload: { text: query }
  } as any) as any;

  const queryVector = queryRes?.vector || queryRes?.data?.vector;
  if (!Array.isArray(queryVector)) {
    return '查询向量生成失败。';
  }

  let bestScore = -1;
  let bestContent = '';

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const content = await fs.readFile(path.join(archiveDir, file), 'utf-8');
    const chunk = content.slice(0, 512);

    const chunkRes = await host.cognition.request({
      type: 'embed',
      payload: { text: chunk }
    } as any) as any;

    const chunkVector = chunkRes?.vector || chunkRes?.data?.vector;
    if (!Array.isArray(chunkVector)) continue;

    const score = cosineSimilarity(queryVector, chunkVector);
    if (score > bestScore) {
      bestScore = score;
      bestContent = content;
    }
  }

  return bestScore >= threshold ? bestContent : '大肥鱼想破脑袋也没想起来。';
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    nA += a[i] ** 2;
    nB += b[i] ** 2;
  }
  return nA && nB ? dot / (Math.sqrt(nA) * Math.sqrt(nB)) : 0;
}