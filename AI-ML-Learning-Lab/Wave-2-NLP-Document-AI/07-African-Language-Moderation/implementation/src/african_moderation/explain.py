from .text import normalize_text
PHRASES={'sw':['nitakupiga','nitakuumiza','mjinga'],'pcm':['go beat you','go hurt you','no get sense','dey craze']}
def review_snippets(text,language):
    norm=normalize_text(text).lower(); return [p for p in PHRASES.get(language,[]) if p in norm]
def context_dependent(text):
    norm=normalize_text(text).lower(); markers=['he said','she said','they said','reported','quote','quoted','"',"'"]; return any(m in norm for m in markers)
