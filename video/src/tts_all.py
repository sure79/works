import json, sys, wave, numpy as np, sherpa_onnx, os
speed=float(sys.argv[1]) if len(sys.argv)>1 else 1.0
d="/tmp/claude-0/-home-user-works/3d1983ad-8244-5106-a6e2-ce8e190218ef/scratchpad/v/vits-mimic3-ko_KO-kss_low"
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{d}/ko_KO-kss_low.onnx",tokens=f"{d}/tokens.txt",data_dir=f"{d}/espeak-ng-data"),num_threads=4))
tts=sherpa_onnx.OfflineTts(cfg)
sc=json.load(open("script.json")); out=[]; n=0
for s in sc:
    L=[]
    for t in s["lines"]:
        a=tts.generate(t,sid=0,speed=speed); x=np.array(a.samples,dtype=np.float32); sr=a.sample_rate
        fn=f"../audio/line{n:02d}.wav"; n+=1
        with wave.open(fn,"wb") as w:
            w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(x,-1,1)*32767).astype(np.int16).tobytes())
        L.append({"text":t,"file":fn,"dur":len(x)/sr})
    out.append({"scene":s["scene"],"lines":L})
json.dump(out,open("narr.json","w"),ensure_ascii=False,indent=1)
tot=sum(l["dur"] for s in out for l in s["lines"]); print("sr",sr,"speech total",round(tot,1),"lines",n)
