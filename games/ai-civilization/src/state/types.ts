import type{CivilizationConfig,CivilizationTier}from'../config/schema';
export type Lifecycle='running'|'result'|'intermission';
export type Terrain='plains'|'forest'|'hills'|'river'|'lake'|'marsh'|'coast';
export type OwnerId='player'|'neutral'|`rival-${1|2|3}`;
export type ResourceKey='food'|'wood'|'stone'|'gold'|'knowledge'|'influence';
export type Resources=Record<ResourceKey,number>;
export type BuildingType='camp'|'farm'|'lumberyard'|'quarry'|'house'|'granary'|'market'|'school'|'barracks'|'temple'|'aqueduct'|'workshop'|'monument';
export type GreatWorkId='sky-library'|'river-citadel'|'unity-monument';
export interface BuildingInstance{id:string;type:BuildingType;level:1;builtAtTick:number}
export interface WorldTile{index:number;x:number;y:number;terrain:Terrain;fertility:number;timber:number;stone:number;water:number;trade:number;defence:number;owner:OwnerId;building?:BuildingInstance;hazard?:string}
export interface CivilizationWorld{width:number;height:number;capitalIndex:number;tiles:WorldTile[];generationAttempts:number;usedFallback:boolean;rivalCapitals:number[]}
export type CharacterRole='ruler'|'heir'|'councillor'|'rival';
export type CharacterExpression='calm'|'focused'|'concerned'|'triumphant'|'defeated';
export interface PortraitRecipe{silhouette:'round'|'angular'|'tall'|'broad';emblem:'sun'|'river'|'oak'|'mountain'|'star'|'crown';pattern:'plain'|'chevron'|'quartered'|'ring';palette:number}
export interface CivilizationCharacter{id:string;name:string;role:CharacterRole;age:number;health:number;legitimacy:number;traits:string[];aspiration:string;expression:CharacterExpression;portrait:PortraitRecipe;relationship:number;stance:string}
export interface CivilizationCharacters{ruler:CivilizationCharacter;heir:CivilizationCharacter;councillors:CivilizationCharacter[];rivals:CivilizationCharacter[]}
export interface PopulationState{total:number;children:number;workers:number;elders:number;housing:number;health:number;morale:number;starvationDays:number;births:number;deaths:number;migration:number;lastDelta:number}
export interface PolicyState{rationingDays:number;civicFocus:'survival'|'prosperity'|'knowledge'|'diplomacy'|'defence'|'expansion'}
export interface AiState{goal:string;actionKey:string;pressure:string;confidence:'low'|'medium'|'high';fallbackUsed:boolean;decisions:number;planChanges:number;lastPlanChangeReason:string;traitUtilityModifier:number}
export interface ProgressionState{tier:CivilizationTier;renown:number;nextTierRenown:number;greatWorkId:GreatWorkId|null;greatWorkProgress:number;completedGreatWorks:GreatWorkId[];lastMeaningfulTick:number;zeroStabilitySince:number|null}
export type RivalStatus='neutral'|'wary'|'friendly'|'allied'|'hostile'|'war';
export interface RivalRelation{id:`rival-${1|2|3}`;status:RivalStatus;reputation:number;tension:number;strength:number;observedStrengthBand:'weaker'|'matched'|'stronger';treatyUntilTick:number;tradeUntilTick:number;aidBalance:number;lastConflictTick:number}
export interface ChronicleHighlight{tick:number;kind:string;copyKey:string;importance:number}
export interface ReignRecord{rulerId:string;startTick:number;endTick:number;renownGained:number;legacy:string}
export interface EconomyLedger{tick:number;produced:Resources;consumed:Resources;spoiled:Resources;upkeep:Resources;trade:Resources}
export interface EconomyState{ledger:EconomyLedger;history:EconomyLedger[];actionRenownCounts:Record<string,number>}
export type CrisisPhase='warning'|'active'|'recovery';
export interface CivilizationCrisis{id:string;kind:'drought'|'plague'|'border-raid'|'market-panic'|'river-flood';conflictGroup:'climate'|'health'|'war'|'economy';severity:number;phase:CrisisPhase;remainingDays:number;warnedAtTick:number;recoveryCost:Partial<Resources>}
export interface QueuedInfluence{id:string;effectId:string;applyAtTick:number;expiresAtTick:number}
export interface InfluenceShell{queued:QueuedInfluence[];appliedIds:string[];cooldowns:Record<string,number>}
export type CivilizationResultReason='legendary-victory'|'population-collapse'|'state-collapse'|'capital-fallen'|'era-timeout'|'integrity-quarantine'|'operator-abort';
export interface CivilizationResult{kind:'game'|'technical';reason:CivilizationResultReason;tick:number;tier:CivilizationTier;renown:number;population:number;finalChecksum?:string}
export interface CivilizationState{
  schemaVersion:1;runId:string;seed:string;tick:number;day:number;season:number;year:number;lifecycle:Lifecycle;config:CivilizationConfig;
  world:CivilizationWorld;resources:Resources;economy:EconomyState;population:PopulationState;characters:CivilizationCharacters;policies:PolicyState;
  stability:number;defence:number;ai:AiState;progression:ProgressionState;diplomacy:RivalRelation[];crisis:CivilizationCrisis|null;crisisCooldowns:Record<string,number>;lastSuccessionTick:number;successionCount:number;
  influence:InfluenceShell;chronicle:{highlights:ChronicleHighlight[];reigns:ReignRecord[]};result?:CivilizationResult;intermissionRemaining:number;
}
export type DiplomacyMode='treaty'|'trade'|'aid';
export type CrisisResponse='relief'|'ration'|'fortify';
export type CivilizationAction=
 |{key:'reserve';type:'reserve'}
 |{key:string;type:'build';building:Exclude<BuildingType,'camp'>;tileIndex:number}
 |{key:'policy:ration';type:'enact-policy';policy:'ration'}
 |{key:'trade:food';type:'trade';resource:'food'}
 |{key:'research';type:'research'}
 |{key:'defend';type:'defend'}
 |{key:string;type:'select-great-work';greatWorkId:GreatWorkId}
 |{key:'great-work';type:'great-work'}
 |{key:string;type:'diplomacy';targetId:RivalRelation['id'];mode:DiplomacyMode}
 |{key:string;type:'crisis-response';response:CrisisResponse};
export interface CivilizationEvent{seq:number;tick:number;type:string;data?:Record<string,unknown>}
export interface PublicIntent{goal:string;decree:string;pressure:string;confidence:'low'|'medium'|'high';fallbackUsed:boolean;planChangeReason:string}
export interface PolicyDecision{action:CivilizationAction;intent:PublicIntent;candidateCount:number;score:number}
