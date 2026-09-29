import json
narr=json.load(open('narr.json'))
LEAD=0.45; GAP=0.42; TAIL=0.5; END_HOLD=3.8
t=0.0; scenes=[]
for si,s in enumerate(narr):
    st=t; c=st+LEAD; lines=[]
    for l in s['lines']:
        lines.append({'text':l['text'],'file':l['file'],'start':round(c,3),'end':round(c+l['dur'],3)}); c+=l['dur']+GAP
    end=lines[-1]['end']+TAIL+(END_HOLD if si==len(narr)-1 else 0)
    scenes.append({'name':s['scene'],'start':round(st,3),'end':round(end,3),'lines':lines}); t=end
tl={'total':round(t,3),'scenes':scenes}
json.dump(tl,open('timeline.json','w'),ensure_ascii=False,indent=1)
open('timeline.js','w').write('window.TL='+json.dumps(tl,ensure_ascii=False)+';')
for s in scenes: print(s['name'],s['start'],s['end'],[ (l['start'],l['end']) for l in s['lines']])
print('TOTAL',tl['total'])
