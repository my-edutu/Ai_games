import type{CivilizationConfig,CivilizationTier}from'../config/schema';
export type Lifecycle='running'|'result'|'intermission';
export type Terrain='plains'|'forest'|'hills'|'river'|'lake'|'marsh'|'coast';
export type OwnerId='player'|'neutral'|`rival-${1|2|3}`;
export type ResourceKey='food'|'wood'|'stone'|'gold'|'knowledge'|'influence';
export type Resources=Record<ResourceKey,number>;
export type BuildingType='camp'|'farm'|'lumberyard'|'quarry'|'house'|'granary';
export interface BuildingInstance{id:string;type:BuildingType;level:1;builtAtTick:number}
export interface WorldTile{index:number;x:number;y:number;terrain:Terrain;fertility:number;timber:number;stone:number;water:number;trade:number;defence:number;owner:OwnerId;building?:BuildingInstance;hazard?:string}
export interface CivilizationWorld{width:number;height:number;capitalIndex:number;tiles:WorldTile[];generationAttempts:number;usedFallback:boolean;rivalCapitals:number[]}
export type CharacterRole='ruler'|'heir'|'councillor'|'rival';
export type CharacterExpression='calm'|'focused'|'concerned'|'triumphant'|'defeated';
export interface PortraitRecipe{silhouette:'round'|'angular'|'tall'|'broad';emblem:'sun'|'river'|'oak'|'mountain'|'star'|'crown';pattern:'plain'|'chevron'|'quartered'|'ring';palette:number}
export interface CivilizationCharacter{id:string;name:string;role:CharacterRole;age:number;health:number;legitimacy:number;traits:string[];aspiration:string;expression:CharacterExpression;portrait:PortraitRecipe;relationship:number;stance:string}
export interface CivilizationCharacters{ruler:CivilizationCharacter;heir:CivilizationCharacter;councillors:CivilizationCharacter[];rivals:CivilizationCharacter[]}
export interface PopulationState{total:number;children:number;workers:number;elders:number;housing:number;health:number;morale:number;starvationDays:number}
export interface PolicyState{rationingDays:number;civicFocus:'survival'|'prosperity'|'knowledge'|'diplomacy'|'defence'|'expansion'}
export interface AiState{goal:string;actionKey:string;pressure:string;confidence:'low'|'medium'|'high';fallbackUsed:boolean;decisions:number;planChanges:number;lastPlanChangeReason:string}
export interface ProgressionState{tier:CivilizationTier;renown:number;nextTierRenown:number;greatWorkId:string|null;greatWorkProgress:number;lastMeaningfulTick:number;zeroStabilitySince:number|null}
export interface RivalRelation{id:`rival-${1|2|3}`;status:'neutral'|'wary'|'friendly'|'allied'|'hostile'|'war';reputation:number;tension:number;strength:number}
export interface ChronicleHighlight{tick:number;kind:string;copyKey:string;importance:number}
export interface ReignRecord{rulerId:string;startTick:number;endTick:number;renownGained:number;legacy:string}
export interface InfluenceShell{queued:Array<{id:string;effectId:string;applyAtTick:number;expiresAtTick:number}>;appliedIds:string[];cooldowns:Record<string,number>}
export type CivilizationResultReason='legendary-victory'|'population-collapse'|'state-collapse'|'capital-fallen'|'era-timeout'|'integrity-quarantine'|'operator-abort';
export interface CivilizationResult{kind:'game'|'technical';reason:CivilizationResultReason;tick:number;tier:CivilizationTier;renown:number;population:number;finalChecksum?:string}
export interface CivilizationState{
  schemaVersion:1;runId:string;seed:string;tick:number;day:number;season:number;year:number;lifecycle:Lifecycle;config:CivilizationConfig;
  world:CivilizationWorld;resources:Resources;population:PopulationState;characters:CivilizationCharacters;policies:PolicyState;
  stability:number;defence:number;ai:AiState;progression:ProgressionState;diplomacy:RivalRelation[];crisis:null|{id:string;kind:string;severity:number;remainingDays:number;warnedAtTick:number};
  influence:InfluenceShell;chronicle:{highlights:ChronicleHighlight[];reigns:ReignRecord[]};result?:CivilizationResult;intermissionRemaining:number;
}
export type CivilizationAction=
 |{key:'reserve';type:'reserve'}
 |{key:string;type:'build';building:Exclude<BuildingType,'camp'>;tileIndex:number}
 |{key:'policy:ration';type:'enact-policy';policy:'ration'}
 |{key:'trade:food';type:'trade';resource:'food'}
 |{key:'research';type:'research'}
 |{key:'defend';type:'defend'}
 |{key:'great-work';type:'great-work'};
export interface CivilizationEvent{seq:number;tick:number;type:string;data?:Record<string,unknown>}
export interface PublicIntent{goal:string;decree:string;pressure:string;confidence:'low'|'medium'|'high';fallbackUsed:boolean;planChangeReason:string}
export interface PolicyDecision{action:CivilizationAction;intent:PublicIntent;candidateCount:number;score:number}
