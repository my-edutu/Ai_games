import json, hashlib
from pathlib import Path
from .schemas import UserProfile, RoleProfile

def snapshot_dataset(users:list[UserProfile], roles:list[RoleProfile], path:Path):
    payload={'users':[u.model_dump(mode='json') for u in users],'roles':[r.model_dump(mode='json') for r in roles]}
    text=json.dumps(payload,sort_keys=True,separators=(',',':'))
    digest=hashlib.sha256(text.encode()).hexdigest()
    path.parent.mkdir(parents=True,exist_ok=True); path.write_text(text,encoding='utf-8')
    return {'sha256':digest,'users':len(users),'roles':len(roles)}
