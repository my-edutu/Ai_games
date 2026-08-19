import { useSimulationStore } from '../../state/store';
import { ConcreteMixerTruck } from './ConcreteMixerTruck';
import { TowerCrane } from './TowerCrane';
import { Wheelbarrow } from './Wheelbarrow';

export function HeroEquipmentLayer() {
  const truck = useSimulationStore((state) => state.truck);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  return <>
    <ConcreteMixerTruck status={truck} onSelect={() => select('concrete-truck')} />
    <TowerCrane onSelect={() => select('crane')} />
    <Wheelbarrow position={[-5,0,13]} rotation={-.45} />
  </>;
}
