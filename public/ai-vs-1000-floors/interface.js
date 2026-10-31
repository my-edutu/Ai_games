/**
 * Read-only HUD enhancement. The existing app/worker remains authoritative.
 * Observe only app-owned output nodes, never the dialog we update. This avoids
 * feedback loops, new worker subscriptions, and reconstructing campaign state.
 */
const byId = id => document.getElementById(id);
const entry = byId('journey-button');
const dialog = byId('journey-dialog');
const progress = document.querySelector('.progress-track');
const overlay = byId('loading-state');
const pause = byId('pause-button');
const route = byId('district-route');
const steps = [];
for (let index = 0; index < 10; index++) {
  const item = document.createElement('li');
  const number = document.createElement('span');
  const state = document.createElement('small');
  number.textContent = String(index + 1).padStart(2, '0');
  state.textContent = 'Ahead';
  item.append(number, state);
  route.append(item);
  steps.push({item, state});
}
const bounded = (value, minimum, maximum) => {
  if (value === null || value.trim() === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : null;
};
const setText = (id, value) => {
  const node = byId(id);
  if (node.textContent !== value) node.textContent = value;
};
function syncJourney() {
  const floor = bounded(byId('floor-number').textContent, 1, 1000);
  const cleared = bounded(progress.getAttribute('aria-valuenow'), 0, 1000);
  const district = bounded(byId('district-index').textContent.split('—')[0].trim(), 1, 10);
  const checkpoint = byId('checkpoint-label').textContent.match(/Floor\s+(\d+)/i);
  const recovery = bounded(checkpoint?.[1] ?? null, 1, 1000);
  const complete = cleared === 1000;
  const percentage = cleared === null ? null : cleared / 10;
  setText('journey-floor', floor === null ? '—' : String(floor).padStart(3, '0'));
  setText('journey-cleared', cleared === null ? '—' : String(cleared));
  setText('journey-percent', percentage === null ? '—' : `${percentage}%`);
  setText('journey-district', byId('district-name').textContent.slice(0, 60));
  setText('journey-checkpoint', recovery === null ? '—' : `Floor ${String(recovery).padStart(3, '0')}`);
  setText('journey-summary', complete ? 'Expedition complete. All 1,000 floors cleared.' : 'Reach the crown. Follow the explorer through ten districts and 1,000 floors.');
  setText('journey-save', byId('save-note').textContent.slice(0, 180));
  byId('journey-ring-fill').style.strokeDasharray = `${percentage ?? 0} 100`;
  for (let index = 0; index < steps.length; index++) {
    const {item, state} = steps[index];
    // Arrival at floor 1000 is not completion. Cleared count is authoritative.
    const finished = cleared !== null && cleared >= (index + 1) * 100;
    const current = !complete && district === index + 1 && !finished;
    item.dataset.state = finished ? 'cleared' : current ? 'current' : 'ahead';
    if (current) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
    state.textContent = finished ? 'Cleared' : current ? 'Here' : 'Ahead';
    item.setAttribute('aria-label', `District ${index + 1}, floors ${index * 100 + 1}–${(index + 1) * 100}: ${state.textContent.toLowerCase()}`);
  }
}
function syncAvailability() {
  entry.disabled = pause.disabled || !overlay.hidden;
  // An error/rejected-save screen takes priority over any optional modal.
  if (!overlay.hidden && dialog.open) {
    dialog.close();
    const action = [byId('retry-button'), byId('fresh-button')].find(button => !button.hidden);
    action?.focus();
  }
}
entry.addEventListener('click', () => {
  if (entry.disabled || byId('settings-dialog').open) return;
  syncJourney();
  dialog.showModal();
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
// Stop the existing global Space/C/M shortcuts at capture phase. Keep default
// button activation and Escape behavior intact for the native modal itself.
for (const type of ['keydown', 'keyup']) {
  document.addEventListener(type, event => {
    if (dialog.open) event.stopPropagation();
  }, true);
}
const dataObserver = new MutationObserver(() => {
  // Closed panels do no rendering work. Reopening always reads the current HUD.
  if (dialog.open) syncJourney();
});
for (const id of ['floor-number', 'district-name', 'district-index', 'checkpoint-label', 'save-note']) {
  dataObserver.observe(byId(id), {childList: true, characterData: true, subtree: true});
}
dataObserver.observe(progress, {attributes: true, attributeFilter: ['aria-valuenow']});
const availabilityObserver = new MutationObserver(syncAvailability);
availabilityObserver.observe(overlay, {attributes: true, attributeFilter: ['hidden']});
availabilityObserver.observe(pause, {attributes: true, attributeFilter: ['disabled']});
syncAvailability();
