import type { BroadcastPresentation } from "./types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function titleCase(value: string): string {
  return value.split("-").map(part => part.length ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

export function renderBroadcastOverlayHtml(model: Readonly<BroadcastPresentation>): string {
  const safe = model.layout.viewport.safeArea;
  const danger = model.hud.danger;
  const caption = model.captions[0]?.captionKey ?? "";
  const dangerHtml = danger.visible
    ? `<section class="card danger" data-testid="danger"><strong>${escapeHtml(titleCase(danger.family ?? "danger"))}</strong><span>${escapeHtml(danger.legalResponses.join(" / "))}</span></section>`
    : "";
  const lifecycleLabel = model.hud.lifecycle === "intermission" ? "INTERMISSION" : model.hud.lifecycle.toUpperCase();
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Eko Run Broadcast</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;font-family:Inter,Arial,sans-serif;color:#fff}body{position:relative}.overlay{position:absolute;inset:${safe.top}px ${safe.right}px ${safe.bottom}px ${safe.left}px;display:grid;grid-template-rows:auto 1fr auto;gap:12px;pointer-events:none}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.primary,.card,.caption{background:rgba(8,12,18,.78);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.22);border-radius:14px;padding:12px 14px}.primary{min-width:min(68vw,520px)}.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.78}.progress{font-size:clamp(24px,4vw,44px);font-weight:800;line-height:1}.meta{margin-top:8px;font-size:clamp(13px,1.5vw,18px);opacity:.9}.secondary{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.card{font-size:14px}.danger{align-self:start;justify-self:center;border-width:2px;max-width:min(82vw,520px);display:flex;gap:12px;align-items:center;font-size:clamp(15px,2vw,22px)}.bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.caption{max-width:min(76vw,720px);font-size:clamp(14px,1.8vw,20px)}.future{font-size:11px;opacity:.55}.portrait .top{flex-direction:column}.portrait .secondary{justify-content:flex-start}.portrait .primary{width:100%;min-width:0}.portrait .bottom{flex-direction:column;align-items:stretch}.portrait .caption{max-width:none}@media(max-width:520px){.overlay{gap:8px}.primary,.card,.caption{border-radius:12px;padding:10px 12px}.secondary .future{display:none}}
</style></head><body class="${model.layout.mode}"><main class="overlay" data-phase7-version="${model.version}" data-quality="${escapeHtml(model.quality)}">
<header class="top"><section class="primary" data-testid="primary-progress"><div class="eyebrow">${escapeHtml(titleCase(model.hud.primary.districtId))} · Cycle ${model.hud.primary.cycle + 1} · ${escapeHtml(lifecycleLabel)}</div><div class="progress">${model.hud.primary.progress.toFixed(1)} m</div><div class="meta">Checkpoint ${model.hud.primary.checkpointIndex}/${model.hud.primary.checkpointCount} · Record ${model.hud.record.maxProgress.toFixed(1)} m</div></section><section class="secondary"><div class="card">Eko Tokens <strong>${model.hud.resources.ekoTokens}</strong></div><div class="card future">AI: not enabled</div><div class="card future">Viewer influence: not enabled</div></section></header>
<div>${dangerHtml}</div>
<footer class="bottom"><div class="caption" data-testid="caption">${escapeHtml(caption)}</div><div class="card">Earned ${model.hud.resources.earnedTokenTotal} · ${escapeHtml(model.hud.primary.pacingBand)}</div></footer>
</main></body></html>`;
}
