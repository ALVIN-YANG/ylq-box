import fs from 'node:fs';

function usage() {
  console.error('Usage: node scripts/analyze-codex-session.mjs <session.jsonl> [--before <ISO timestamp>]');
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const sessionPath = args[0];
let before = null;

for (let index = 1; index < args.length; index += 1) {
  if (args[index] !== '--before' || !args[index + 1]) usage();
  before = args[index + 1];
  index += 1;
}

if (!fs.existsSync(sessionPath)) {
  console.error(`Session file not found: ${sessionPath}`);
  process.exit(1);
}

const records = fs.readFileSync(sessionPath, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSON on line ${index + 1}: ${error.message}`);
    }
  })
  .filter((record) => !before || record.timestamp < before);

const sessionMeta = records.find((record) => record.type === 'session_meta')?.payload ?? {};
const turnContext = records.find((record) => record.type === 'turn_context')?.payload ?? {};

const summary = {
  environment: {
    originator: sessionMeta.originator ?? null,
    version: sessionMeta.cli_version ?? null,
    model: turnContext.model ?? null,
    effort: turnContext.effort ?? null,
    before,
  },
  calls: {
    exec: 0,
    execWithWriteStdin: 0,
    writeStdin: 0,
    emptyWriteStdin: 0,
    writeStdinYieldMs: {},
    outerExecPragma: 0,
    outerCellYield: 0,
    wait: 0,
    waitYieldMs: {},
  },
  usage: {
    modelEvents: 0,
    waitEvents: 0,
    all: emptyUsage(),
    wait: emptyUsage(),
    waitShare: {},
  },
};

let currentModelCallHasWait = false;

for (const record of records) {
  const payload = record.payload ?? {};

  if (record.type === 'response_item' && payload.type === 'custom_tool_call' && payload.name === 'exec') {
    summary.calls.exec += 1;
    const source = payload.input ?? '';
    if (/^\s*\/\/ @exec:/.test(source)) summary.calls.outerExecPragma += 1;
    if (source.includes('tools.write_stdin')) summary.calls.execWithWriteStdin += 1;

    for (const match of source.matchAll(/tools\.write_stdin\s*\(\s*\{([\s\S]*?)\}\s*\)/g)) {
      summary.calls.writeStdin += 1;
      const body = match[1];
      const chars = body.match(/["']?chars["']?\s*:\s*(["'])([\s\S]*?)\1/);
      if (chars?.[2] === '') summary.calls.emptyWriteStdin += 1;
      const yieldMs = body.match(/["']?yield_time_ms["']?\s*:\s*(\d+)/)?.[1] ?? 'default';
      summary.calls.writeStdinYieldMs[yieldMs] = (summary.calls.writeStdinYieldMs[yieldMs] ?? 0) + 1;
    }
  }

  if (record.type === 'response_item' && payload.type === 'custom_tool_call_output') {
    if ((payload.output ?? '').includes('Script running with cell ID')) {
      summary.calls.outerCellYield += 1;
    }
  }

  if (record.type === 'response_item' && payload.type === 'function_call' && payload.name === 'wait') {
    summary.calls.wait += 1;
    currentModelCallHasWait = true;
    const waitArgs = JSON.parse(payload.arguments ?? '{}');
    const yieldMs = String(waitArgs.yield_time_ms ?? 10000);
    summary.calls.waitYieldMs[yieldMs] = (summary.calls.waitYieldMs[yieldMs] ?? 0) + 1;
  }

  if (record.type === 'event_msg' && payload.type === 'token_count' && payload.info?.last_token_usage) {
    const usage = payload.info.last_token_usage;
    summary.usage.modelEvents += 1;
    addUsage(summary.usage.all, usage);
    if (currentModelCallHasWait) {
      summary.usage.waitEvents += 1;
      addUsage(summary.usage.wait, usage);
    }
    currentModelCallHasWait = false;
  }
}

summary.usage.all.uncachedInputTokens = summary.usage.all.inputTokens - summary.usage.all.cachedInputTokens;
summary.usage.wait.uncachedInputTokens = summary.usage.wait.inputTokens - summary.usage.wait.cachedInputTokens;
summary.usage.waitShare = {
  modelEvents: ratio(summary.usage.waitEvents, summary.usage.modelEvents),
  inputTokens: ratio(summary.usage.wait.inputTokens, summary.usage.all.inputTokens),
  uncachedInputTokens: ratio(summary.usage.wait.uncachedInputTokens, summary.usage.all.uncachedInputTokens),
  outputTokens: ratio(summary.usage.wait.outputTokens, summary.usage.all.outputTokens),
  reasoningOutputTokens: ratio(summary.usage.wait.reasoningOutputTokens, summary.usage.all.reasoningOutputTokens),
};

console.log(JSON.stringify(summary, null, 2));

function emptyUsage() {
  return {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
  };
}

function addUsage(target, source) {
  target.inputTokens += source.input_tokens ?? 0;
  target.cachedInputTokens += source.cached_input_tokens ?? 0;
  target.outputTokens += source.output_tokens ?? 0;
  target.reasoningOutputTokens += source.reasoning_output_tokens ?? 0;
}

function ratio(part, total) {
  return total === 0 ? null : Number((part / total).toFixed(4));
}
