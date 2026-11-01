// A green build is a safety check, not a transformed game.
// Pure browser/Node evaluator. It checks evidence structure, not the authenticity
// of clips or reviewer independence; those must be inspected separately.
export const PILLARS = Object.freeze([
  { id: 'looks', title: 'LOOKS', question: 'Does the world, cast and lighting look substantially better?' },
  { id: 'feels', title: 'FEELS', question: 'Does real motion, impact, camera and sound feel substantially better?' },
  { id: 'plays', title: 'PLAYS', question: 'Is the complete autonomous climb more compelling and readable?' },
]);
export const REQUIRED_SCENES = Object.freeze(['ascent', 'danger', 'outcome']);
const SHA = /^[0-9a-f]{40}$/i;
const CLIP = /\.(?:mp4|webm)(?:[?#].*)?$/i;
const allowedVideo = value => typeof value === 'string' && (
  value.startsWith('/tower/gauntlet/evidence/') || /^https:\/\//i.test(value)
) && CLIP.test(value);

function hasProof(clip, sha, scene) {
  return clip && clip.sourceSha === sha && clip.realGameplay === true &&
    clip.captureVerified === true && Number.isFinite(clip.seconds) && clip.seconds >= 60 &&
    clip.seed === scene.seed && clip.viewport === scene.viewport && clip.quality === scene.quality &&
    allowedVideo(clip.url);
}

export function evaluateTransformation(record) {
  const missing = [];
  const baselineSha = record?.baseline?.sha;
  const candidateSha = record?.candidate?.sha;
  const validShaPair = typeof baselineSha === 'string' && SHA.test(baselineSha) &&
    typeof candidateSha === 'string' && SHA.test(candidateSha) && baselineSha !== candidateSha;

  const scenes = new Map((Array.isArray(record?.scenarios) ? record.scenarios : []).map(scene => [scene.id, scene]));
  for (const id of REQUIRED_SCENES) {
    const scene = scenes.get(id);
    if (!scene || !scene.seed || !scene.viewport || !scene.quality ||
      !hasProof(scene.baseline, baselineSha, scene) || !hasProof(scene.candidate, candidateSha, scene)) {
      missing.push(`${id}: matched, authentic 60-second before/after gameplay`);
    }
  }

  const pillars = {};
  for (const { id } of PILLARS) {
    const voters = new Map();
    for (const vote of Array.isArray(record?.reviews?.[id]) ? record.reviews[id] : []) {
      if (!vote || typeof vote.criticId !== 'string' || !vote.criticId.trim() ||
        voters.has(vote.criticId) || vote.independent !== true || vote.blind !== true ||
        vote.randomized !== true || !['candidate', 'baseline', 'tie'].includes(vote.winner) ||
        typeof vote.evidence !== 'string' || vote.evidence.trim().length < 25 ||
        !REQUIRED_SCENES.every(scene => vote.scenarios?.includes(scene))) continue;
      voters.set(vote.criticId, vote);
    }
    const count = voters.size;
    const candidateVotes = [...voters.values()].filter(v => v.winner === 'candidate').length;
    const needed = Math.max(4, Math.ceil(count * .8));
    pillars[id] = {
      count, candidateVotes, needed,
      status: count < 5 ? 'AWAITING_INDEPENDENT_REVIEW' :
        candidateVotes >= needed ? 'SUBSTANTIALLY_BETTER' : 'NO_PREFERENCE_WIN',
    };
  }

  const guardrails = ['ci', 'replay', 'accessibility', 'performance', 'stability'];
  const failingGates = guardrails.filter(id => record?.guardrails?.[id] === 'fail');
  const openGates = guardrails.filter(id => record?.guardrails?.[id] !== 'pass');
  const critical = record?.unresolvedCriticalIssues;
  const criticalOpen = !Number.isInteger(critical) || critical !== 0;
  let status;
  if (!validShaPair) status = 'NOT_EVALUATED';
  else if (missing.length) status = 'AWAITING_GAMEPLAY';
  else if (PILLARS.some(({ id }) => pillars[id].status === 'AWAITING_INDEPENDENT_REVIEW')) status = 'AWAITING_CRITICS';
  else if (PILLARS.some(({ id }) => pillars[id].status !== 'SUBSTANTIALLY_BETTER')) status = 'NOT_SUBSTANTIALLY_BETTER';
  else if (failingGates.length || criticalOpen) status = 'BLOCKED_BY_REGRESSION';
  else if (openGates.length) status = 'TECHNICAL_GATES_OPEN';
  else status = 'TRANSFORMATION_VERIFIED';

  return {
    status, pillars, missing, openGates, criticalOpen,
    baselineSha: SHA.test(baselineSha || '') ? baselineSha : null,
    candidateSha: SHA.test(candidateSha || '') ? candidateSha : null,
  };
}
