const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const skillPath = path.join(root, 'skills', 'platformer-experience-review', 'SKILL.md');
const policyPath = path.join(root, 'games', 'eko-street-run', 'AGENTS.md');
const standardPath = path.join(root, 'games', 'eko-street-run', 'docs', 'EKO_EXPERIENCE_STANDARD.md');

const requiredCoreSkills = [
  'game-creative-direction',
  'game-architecture',
  'game-physics',
  'game-feel-vfx',
  'performance-optimization',
  'platformer-experience-review',
];

test('Eko Run keeps its mandatory platformer experience skill and project policy', () => {
  assert.equal(fs.existsSync(skillPath), true, 'missing platformer-experience-review skill');
  assert.equal(fs.existsSync(policyPath), true, 'missing Eko Run AGENTS.md policy');
  assert.equal(fs.existsSync(standardPath), true, 'missing Eko experience standard');

  const skill = fs.readFileSync(skillPath, 'utf8');
  const policy = fs.readFileSync(policyPath, 'utf8');
  const standard = fs.readFileSync(standardPath, 'utf8');

  for (const skillName of requiredCoreSkills) {
    assert.match(policy, new RegExp(`\\b${skillName}\\b`), `policy must require ${skillName}`);
  }

  assert.match(policy, /must load/i);
  assert.match(policy, /before (?:design|implementation|coding|changing)/i);
  assert.match(policy, /phase gate/i);
  assert.match(policy, /stop-ship/i);
  assert.match(skill, /moment.*expected experience.*observed experience/is);
  assert.match(skill, /readability/i);
  assert.match(skill, /avoidab/i);
  assert.match(skill, /camera/i);
  assert.match(skill, /silhouette/i);
  assert.match(standard, /100-point/i);
  assert.match(standard, /camera-caused/i);
  assert.match(standard, /lagos authenticity/i);
});
