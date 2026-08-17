import { readFileSync } from 'node:fs';

const inputPath = process.argv[2] || 'src/data/model-arena.json';
const data = JSON.parse(readFileSync(inputPath, 'utf8'));
const problems = [];
const checkedAt = Date.parse(data.checkedAtISO || '');
const ageHours = (Date.now() - checkedAt) / 36e5;

if (!Number.isFinite(checkedAt)) {
  problems.push('缺少有效的 checkedAtISO');
} else if (ageHours > 30) {
  problems.push(`最后检查时间距今 ${ageHours.toFixed(1)} 小时，超过 30 小时`);
} else if (ageHours < -1) {
  problems.push('最后检查时间位于未来');
}

const arenaText = data.sourceBoards?.find(board => board.id === 'arena-text');
if (!arenaText) {
  problems.push('缺少 Arena Text 数据源');
} else if (arenaText.status === 'stale') {
  problems.push('Arena Text 数据源已过期');
}

if ((data.methodology?.operatorCount || 0) < 3) {
  problems.push('有效独立来源少于 3 个');
}

if (problems.length) {
  console.error(`模型榜验证失败：${problems.join('；')}`);
  process.exit(1);
}

console.log(`模型榜验证通过：检查于 ${data.checkedAt}，${data.methodology.operatorCount} 个独立来源，Arena Text ${arenaText.status}`);
