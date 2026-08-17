import { deriveEscapeAudioCues, type EscapeAudioCue } from './audio';
import { updateEscapeCamera, type EscapeCameraState } from './camera';
import { computeEscapeLayout, type EscapeLayout, type EscapeLayoutMode } from './layout';
import type { EscapeRenderSnapshot } from './snapshot';
export interface EscapePresentationControllerOptions{replayCapacity:number;maxObjects:number;muted:boolean;}
export interface EscapePresentationFrame extends EscapeRenderSnapshot{layout:EscapeLayout;camera:EscapeCameraState;audio:EscapeAudioCue[];mode:EscapeLayoutMode;}
export class EscapePresentationController{
  private frames:EscapeRenderSnapshot[]=[];private current:EscapeRenderSnapshot|null=null;private latestValid:EscapeRenderSnapshot|null=null;private camera:EscapeCameraState|null=null;private outputFailure:string|null=null;
  constructor(private readonly options:EscapePresentationControllerOptions){if(!Number.isInteger(options.replayCapacity)||options.replayCapacity<1||options.replayCapacity>5000)throw new RangeError('replayCapacity');if(!Number.isInteger(options.maxObjects)||options.maxObjects<1||options.maxObjects>256)throw new RangeError('maxObjects');}
  accept(snapshot:EscapeRenderSnapshot){
    if(snapshot.objects.length>this.options.maxObjects)return{accepted:false,reason:'object-budget'};
    if(this.current&&snapshot.runToken===this.current.runToken&&snapshot.tick<=this.current.tick)return{accepted:false,reason:'stale-frame'};
    this.current=snapshot;this.latestValid=snapshot;this.outputFailure=null;this.frames=[...this.frames,snapshot].slice(-this.options.replayCapacity);this.camera=updateEscapeCamera(snapshot,this.camera);return{accepted:true,reason:'accepted'};
  }
  frame(width=1920,height=1080,mode:Partial<EscapeLayoutMode>={}):EscapePresentationFrame{
    if(!this.current)throw new Error('no presentation frame');const normalized={cleanFeed:mode.cleanFeed??false,phoneLandscape:mode.phoneLandscape??height/width<0.55};
    const snapshot=this.outputFailure?{...this.current,scene:'recovery' as const,health:{level:'safe-scene' as const,reason:'output-recovery'}}:this.current;
    const camera=updateEscapeCamera(snapshot,this.camera);this.camera=camera;return{...snapshot,layout:computeEscapeLayout({width,height},normalized),camera,audio:deriveEscapeAudioCues(snapshot.events,snapshot,{muted:this.options.muted,maxVoices:8}),mode:normalized};
  }
  replayWindow(limit:number){return this.frames.slice(-Math.max(0,Math.min(this.options.replayCapacity,Math.floor(limit))));}
  failOutput(reason:string){this.outputFailure=reason.slice(0,160);}
  rebuildFromLatest(){if(!this.latestValid)return{recovered:false};this.current=this.latestValid;this.outputFailure=null;this.camera=updateEscapeCamera(this.current,null);return{recovered:true};}
  diagnostic(){return{frameCount:this.frames.length,currentTick:this.current?.tick??null,runToken:this.current?.runToken??null,outputFailure:this.outputFailure,replayCapacity:this.options.replayCapacity};}
}
