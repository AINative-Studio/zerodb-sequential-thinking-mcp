import { randomUUID } from 'crypto';

// In-memory chain store for the current session
const chains = new Map();

export function getOrCreateChain(chainId) {
  if (!chainId) chainId = randomUUID();
  if (!chains.has(chainId)) {
    chains.set(chainId, { chainId, steps: [], createdAt: new Date().toISOString() });
  }
  return chains.get(chainId);
}

export async function addStep(args, client) {
  const { thought, chain_id, step_number, total_steps, next_step, is_final = false, persist_steps = false } = args;
  const chain = getOrCreateChain(chain_id);

  const step = {
    step: step_number || chain.steps.length + 1,
    thought,
    next_step: next_step || null,
    is_final,
    timestamp: new Date().toISOString(),
  };

  chain.steps.push(step);

  // Optional ZeroDB persistence
  if (persist_steps && client) {
    try {
      await client.request('POST', '/api/v1/public/memory/v2/remember', {
        content: `[Step ${step.step}] ${thought}`,
        entity_id: chain.chainId,
        memory_type: 'working',
        importance: 0.6,
        tags: ['sequential-thinking', `chain-${chain.chainId}`],
      });
    } catch (e) {
      process.stderr.write(`[zerodb] Warning: failed to persist step: ${e.message}\n`);
    }
  }

  return {
    chain_id: chain.chainId,
    step: step.step,
    total_steps: total_steps || '?',
    thought,
    next_step,
    is_final,
    steps_so_far: chain.steps.length,
  };
}

export function getChain(chainId) {
  return chains.get(chainId) || null;
}
