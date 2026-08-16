import type{SnakeState}from '../state/types';import type{NamedRng}from '../../../../packages/seeded-rng/src/index';
export function spawnFood(state:SnakeState,rng:NamedRng):number|null{const total=state.config.width*state.config.height;const occupied=new Set(state.snake.body);const free:number[]=[];for(let i=0;i<total;i++)if(!occupied.has(i))free.push(i);if(!free.length)return null;return free[rng.nextInt('objective-spawn',free.length)]}
export function cellToXY(i:number,w:number){return{x:i%w,y:Math.floor(i/w)}}
