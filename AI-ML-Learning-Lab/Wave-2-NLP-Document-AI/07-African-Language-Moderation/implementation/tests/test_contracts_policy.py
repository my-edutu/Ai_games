import pytest
from african_moderation.policy import SUPPORTED_LANGUAGES, SUPPORTED_LABELS
from african_moderation.schemas import ModerationRequest
from african_moderation.text import normalize_text, code_switch_signal
def test_supported_scope_is_explicit_and_hate_is_not_silently_supported(): assert SUPPORTED_LANGUAGES=={'sw','pcm'} and SUPPORTED_LABELS=={'safe','harassment','threat'} and 'hate' not in SUPPORTED_LABELS
def test_unsupported_language_rejected_by_request_contract():
    with pytest.raises(ValueError): ModerationRequest(text='hello',language='yo')
def test_normalization_removes_zero_width_without_translating_content(): assert normalize_text('nita\u200bkupiga!!!')=='nitakupiga!!!'
def test_code_switch_signal_is_explicit_not_inferred_as_harm(): assert code_switch_signal('nitakupiga tomorrow friend','sw') is True and code_switch_signal('asante rafiki','sw') is False
