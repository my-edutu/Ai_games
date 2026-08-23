import { useSimulationStore } from '../../state/store';
import { FormworkInteraction } from './FormworkInteraction';
import { MasonryInteraction } from './MasonryInteraction';
import { RebarInteraction } from './RebarInteraction';
import { WeldingInteraction } from './WeldingInteraction';

export function TrainingInteractionLayer() {
  const skillId = useSimulationStore((state) => state.skillMentor.activeSkillId);
  const phase = useSimulationStore((state) => state.skillMentor.phase);
  if (!skillId || phase !== 'practice') return null;

  if (skillId === 'masonry') return <MasonryInteraction />;
  if (skillId === 'welding') return <WeldingInteraction />;
  if (skillId === 'formwork') return <FormworkInteraction />;
  if (skillId === 'rebar-quality') return <RebarInteraction />;
  return null;
}
