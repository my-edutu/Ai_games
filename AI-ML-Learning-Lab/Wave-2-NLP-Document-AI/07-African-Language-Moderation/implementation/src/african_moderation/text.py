import unicodedata,re
ENGLISH_MARKERS={'tomorrow','friend','please','you','today','now','bro','sorry','thanks'}
SW_MARKERS={'asante','rafiki','nitakupiga','wewe','mjinga','habari'}
PCM_MARKERS={'dey','abi','wahala','una','go','no','sense'}
def normalize_text(text):
    s=unicodedata.normalize('NFKC',text)
    return ''.join(ch for ch in s if unicodedata.category(ch)!='Cf').strip()
def code_switch_signal(text,language):
    toks=set(re.findall(r"[a-zA-Z']+",normalize_text(text).lower()))
    local=SW_MARKERS if language=='sw' else PCM_MARKERS
    return bool(toks & ENGLISH_MARKERS) and bool(toks & local)
