import { addStep, getChain } from './reasoner.js';
import { concludeChain, resumeChain } from './plan-store.js';

export const TOOLS = [
  {
    name: 'sequential_think',
    description: 'Perform a sequential reasoning step. Chain multiple calls for complex problems. Optionally persist steps to ZeroDB for cross-session continuity.',
    inputSchema: {
      type: 'object',
      properties: {
        thought: { type: 'string', description: 'The current reasoning step' },
        chain_id: { type: 'string', description: 'Chain ID (auto-generated on first call)' },
        step_number: { type: 'number', description: 'Current step number' },
        total_steps: { type: 'number', description: 'Estimated total steps' },
        next_step: { type: 'string', description: 'What to reason about next' },
        is_final: { type: 'boolean', description: 'Is this the last step before concluding?', default: false },
        persist_steps: { type: 'boolean', description: 'Persist each step to ZeroDB working memory', default: false }
      },
      required: ['thought']
    }
  },
  {
    name: 'sequential_conclude',
    description: 'Finalize a reasoning chain and save the conclusion as a persistent ZeroDB plan artifact. Returns an artifact_id you can use to resume in future sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        chain_id: { type: 'string', description: 'Chain ID from sequential_think calls' },
        conclusion: { type: 'string', description: 'The final answer or decision' },
        title: { type: 'string', description: 'Artifact title (defaults to first 60 chars of conclusion)' },
        save_as: { type: 'string', enum: ['plan', 'prd', 'task'], default: 'plan', description: 'Artifact type' }
      },
      required: ['conclusion']
    }
  },
  {
    name: 'sequential_resume',
    description: 'Resume a reasoning chain from a previous session using an artifact_id returned by sequential_conclude.',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Artifact ID from a prior sequential_conclude call' }
      },
      required: ['artifact_id']
    }
  }
];

export async function executeTool(name, args, client) {
  switch (name) {
    case 'sequential_think':
      return addStep(args, client);

    case 'sequential_conclude':
      return concludeChain(args.chain_id, args.conclusion, args.title, args.save_as || 'plan', client);

    case 'sequential_resume':
      return resumeChain(args.artifact_id, client);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
