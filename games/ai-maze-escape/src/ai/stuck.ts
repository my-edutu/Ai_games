export function detectMazeCycle(recentCells:number[]){const sample=recentCells.slice(-10);if(sample.length<6)return false;return new Set(sample).size<=3}
