// Persists concluded reasoning chains as ZeroDB plan artifacts.
// Artifacts are keyed by artifact_id and can be resumed across sessions.

const PLAN_API = '/api/v1/public/memory/v2/plan';

export async function concludeChain(chainId, conclusion, title, type = 'plan', client) {
  if (!client) {
    return { artifact_id: null, conclusion, warning: 'No ZeroDB client — conclusion not persisted' };
  }

  const artifactTitle = title || conclusion.slice(0, 60);
  const content = chainId
    ? `## Conclusion\n${conclusion}\n\n## Chain ID\n${chainId}`
    : `## Conclusion\n${conclusion}`;

  try {
    const artifact = await client.request('POST', `${PLAN_API}/`, {
      title: artifactTitle,
      type,
      content,
    });

    return {
      artifact_id: artifact.id,
      title: artifact.title,
      type: artifact.type,
      status: artifact.status,
      created_at: artifact.created_at,
      resume_hint: `Use sequential_resume with artifact_id: "${artifact.id}" to continue this reasoning chain in a future session.`,
    };
  } catch (e) {
    process.stderr.write(`[zerodb] Warning: failed to save plan artifact: ${e.message}\n`);
    return { artifact_id: null, conclusion, error: e.message };
  }
}

export async function resumeChain(artifactId, client) {
  if (!client) {
    return { error: 'No ZeroDB client — cannot resume' };
  }

  try {
    const artifact = await client.request('GET', `${PLAN_API}/${artifactId}`);
    return {
      artifact_id: artifact.id,
      title: artifact.title,
      type: artifact.type,
      status: artifact.status,
      prior_content: artifact.content,
      updated_at: artifact.updated_at,
      resume_instruction: 'Prior reasoning chain loaded. Continue from the conclusion above.',
    };
  } catch (e) {
    process.stderr.write(`[zerodb] Warning: failed to load plan artifact: ${e.message}\n`);
    return { artifact_id: artifactId, error: e.message };
  }
}
