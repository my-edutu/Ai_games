from dataclasses import dataclass
SUPPORTED_LANGUAGES={'sw','pcm'}
SUPPORTED_LABELS={'safe','harassment','threat'}
@dataclass(frozen=True)
class PolicyPack:
    version:str='moderation-policy-v1'
    supported_languages:frozenset[str]=frozenset(SUPPORTED_LANGUAGES)
    supported_labels:frozenset[str]=frozenset(SUPPORTED_LABELS)
    native_speaker_validated:bool=False
