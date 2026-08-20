def category_dataset():
    samples={"travel":["uber airport ride","hotel booking business trip","flight ticket travel","taxi transport receipt","lodging hotel night"],"office":["printer paper stationery","office supplies pens","toner cartridge printer","desk stationery purchase","paper clips office"],"meals":["restaurant lunch meal","cafe coffee food","dinner restaurant receipt","team lunch food","breakfast cafe"],"software":["cloud software subscription","saas monthly license","hosting cloud subscription","software license renewal","online tool subscription"]}; X=[]; y=[]
    for k,vals in samples.items():
        for i in range(8):
            for v in vals:X.append(f"{v} ref{i}"); y.append(k)
    return X,y
