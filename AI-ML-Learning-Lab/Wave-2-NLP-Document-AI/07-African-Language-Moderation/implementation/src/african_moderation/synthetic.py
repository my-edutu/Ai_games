from dataclasses import dataclass
@dataclass(frozen=True)
class Example:
    text:str; language:str; label:str; group_id:str; holdout:bool=False; validation:bool=False
BASE={'sw':{'safe':[('asante rafiki','sw-safe-1',False,False),('asante sana rafiki','sw-safe-2',True,False),('habari rafiki','sw-safe-3',False,True)],'harassment':[('wewe ni mjinga','sw-har-1',False,False),('wewe mjinga','sw-har-2',True,False),('mjinga sana','sw-har-3',False,True)],'threat':[('nitakupiga','sw-thr-1',False,False),('nitakupiga tomorrow friend','sw-thr-2',True,False),('nitakuumiza','sw-thr-3',False,True)]},'pcm':{'safe':[('how you dey my friend','pcm-safe-1',False,False),('how you dey today my friend','pcm-safe-2',True,False),('we dey together','pcm-safe-3',False,True)],'harassment':[('you no get sense','pcm-har-1',False,False),('you no get any sense','pcm-har-2',True,False),('you dey craze','pcm-har-3',False,True)],'threat':[('I go beat you','pcm-thr-1',False,False),('I go beat you tomorrow','pcm-thr-2',True,False),('I go hurt you','pcm-thr-3',False,True)]}}
VARIANTS=['{x}','{x}!','{x} !!!','{x} now','{x}.']
def make_dataset():
    rows=[]
    for lang,labels in BASE.items():
        for label,phrases in labels.items():
            for phrase,gid,hold,val in phrases:
                for v in VARIANTS: rows.append(Example(v.format(x=phrase),lang,label,gid,hold,val))
    return rows
