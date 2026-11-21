'use strict';
// The exact five-edits source archive fails loudly when its anchors change.
const edits=[["      uniform float fogNear;\n      uniform float fogFar;\n      varying vec2 waterUv;","      uniform float time;\n      uniform float fogNear;\n      uniform float fogFar;\n      varying vec2 waterUv;"],["        waterUv=position.xy*.018;","        waterUv=position.xy*.018+vec2(time*.0014,time*.00065);"],["      varying float waterFogFactor;\n      uniform float time;\n      uniform sampler2D waterField;","      varying float waterFogFactor;\n      uniform sampler2D waterField;"],["        vec2 flow=vec2(time*.0014,time*.00065);\n        // Preserve the existing water palette","        // Preserve the existing water palette"],["gl_FragColor=texture2D(waterField,waterUv+flow);","gl_FragColor=texture2D(waterField,waterUv);"]];
function once(s,a,b){const n=s.split(a).length-1;if(n!==1)throw Error('R42 archive anchor count '+n+': '+a.slice(0,55));return s.replace(a,b);}
const applyR42Water=s=>edits.reduce((v,[a,b])=>once(v,a,b),s);
const restorePreR42Water=s=>[...edits].reverse().reduce((v,[a,b])=>once(v,b,a),s);
module.exports={applyR42Water,restorePreR42Water};
