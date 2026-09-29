import json, wave, numpy as np, subprocess, os
SR=44100
TL=json.load(open('timeline.json')); total=TL['total']; N=int((total+0.5)*SR)
S={s['name']:s for s in TL['scenes']}
def rd(fn):
    w=wave.open(fn); sr=w.getframerate(); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768; return x,sr
def resamp(x,sr):
    if sr==SR: return x
    n=int(len(x)*SR/sr); return np.interp(np.linspace(0,len(x)-1,n),np.arange(len(x)),x).astype(np.float32)
def env(n,a,r):
    e=np.ones(n,dtype=np.float32); na=int(a*SR); nr=int(r*SR)
    if na>0: e[:na]=np.linspace(0,1,na)
    if nr>0: e[-nr:]*=np.linspace(1,0,nr)
    return e
rng=np.random.default_rng(7)
def add(buf,x,t,g=1.0,pan=0.0):
    i=int(t*SR); x=x[:max(0,N-i)]; 
    if len(x)==0: return
    buf[0,i:i+len(x)]+=x*g*(1-max(0,pan)); buf[1,i:i+len(x)]+=x*g*(1+min(0,pan))
def midi(m): return 440*2**((m-69)/12)

# ---------- 배경음악: 따뜻한 패드 + 잔잔한 플럭 ----------
music=np.zeros((2,N),dtype=np.float32)
bpm=84; beat=60/bpm; bar=4*beat
chords=[[48,55,64,67],[45,52,60,64],[41,48,57,60],[43,50,59,62]]   # C  Am  F  G (open voicings)
tot_bars=int((total+0.5)/bar)+2
for b in range(tot_bars):
    ch=chords[(b//1)%4]; t0=b*bar; dur=bar+0.8
    n=int(dur*SR); tt=np.arange(n)/SR; sig=np.zeros(n,dtype=np.float32)
    for k,m in enumerate(ch):
        f=midi(m)
        for det in (-0.12,0.0,0.12):
            sig+=np.sin(2*np.pi*f*(1+det*0.01)*tt+k)*0.5
        sig+=np.sin(2*np.pi*f*2*tt)*0.08
    sig*=env(n,0.9,1.2)*0.055
    add(music,sig,t0,1.0)
pent=[72,74,76,79,81,84,79,76,74,72,69,67]
mel_pat=[0,2,4,2,5,4,2,1, 0,3,4,5,4,2,1,0]
step=beat/2
for i in range(int((total+.5)/step)):
    if i%2==1 and (i//2)%4 in (1,3) : pass
    t=i*step
    if t<1.0 or (i%8) not in (0,3,5,6): continue
    m=pent[(mel_pat[i%16]+ (i//16)) % len(pent)]-(12 if (i//16)%2==0 else 0)
    n=int(1.6*SR); tt=np.arange(n)/SR; f=midi(m)
    sig=(np.sin(2*np.pi*f*tt)+0.35*np.sin(2*np.pi*f*2*tt)*np.exp(-tt*6)+0.15*np.sin(2*np.pi*f*3.01*tt)*np.exp(-tt*9))*np.exp(-tt*3.2)
    sig[:int(.004*SR)]*=np.linspace(0,1,int(.004*SR))
    add(music,sig.astype(np.float32),t,0.05,pan=((i%5)-2)*0.15)
# 단순 에코
d=int(.375*SR); e=music.copy(); e[:,d:]+=music[:,:-d]*0.28; e[:,2*d:]+=music[:,:-2*d]*0.12; music=e
music*=np.interp(np.arange(N)/SR,[0,1.5,total-3,total+.3],[0,1,1,0]).astype(np.float32)

# ---------- 효과음 ----------
sfx=np.zeros((2,N),dtype=np.float32)
def whoosh(t,dur=.55,g=.10):
    n=int(dur*SR); x=rng.standard_normal(n).astype(np.float32)
    # 밴드패스 스윕 (이동 평균 조합으로 단순화)
    k=np.linspace(0,1,n); y=np.zeros(n,dtype=np.float32); acc=0.0
    for i in range(n):
        a=0.02+0.35*np.sin(np.pi*k[i])**2; acc+=a*(x[i]-acc); y[i]=acc
    y=y-np.convolve(y,np.ones(200)/200,mode='same')
    y*=np.sin(np.pi*k)**1.5; y/= (np.abs(y).max()+1e-6); add(sfx,y,t,g)
def chime(t,m=84,g=.11,dur=1.1):
    n=int(dur*SR); tt=np.arange(n)/SR; f=midi(m)
    x=(np.sin(2*np.pi*f*tt)+.4*np.sin(2*np.pi*f*2.76*tt)*np.exp(-tt*8)+.2*np.sin(2*np.pi*f*5.4*tt)*np.exp(-tt*14))*np.exp(-tt*4.5)
    x[:int(.003*SR)]*=np.linspace(0,1,int(.003*SR)); add(sfx,x.astype(np.float32),t,g)
def pop(t,g=.10):
    n=int(.12*SR); tt=np.arange(n)/SR; x=np.sin(2*np.pi*(300+900*np.exp(-tt*40))*tt)*np.exp(-tt*30); add(sfx,x.astype(np.float32),t,g)
for s in TL['scenes']: whoosh(max(0,s['start']-.05))
f=S['today']['lines'][1]; 
for dt,m in zip((.6,1.9,3.1),(79,83,86)): chime(f['start']+dt,m,.09,.7)
pop(S['today']['lines'][2]['start']+2.2)
k=S['reward']['lines'][0]; chime(k['start']+1.8,88,.10,1.3); chime(k['start']+1.8+.12,91,.08,1.3)
for m,dt in zip((72,76,79,84),(0,.09,.18,.27)): chime(k['start']+2.4+dt,m,.10,1.4)
for i in range(6): pop(S['recall']['lines'][1]['start']+.5+(i+1)*.42,.05)
o=S['outro']['lines'][1]
for m,dt in zip((72,76,79,84,88),(.3,.4,.5,.6,.7)): chime(o['start']+dt,m,.09,1.6)
chime(S['intro']['start']+.7,84,.06,.9)
for i in range(6): pop(S['outro']['start']+.7+i*.16,.05)

# ---------- 나레이션 ----------
voice=np.zeros((2,N),dtype=np.float32)
for sc in TL['scenes']:
    for l in sc['lines']:
        x,sr=rd(l['file']); x=resamp(x,sr); x=x/(np.abs(x).max()+1e-6)*0.9
        x[:int(.01*SR)]*=np.linspace(0,1,int(.01*SR)); x[-int(.03*SR):]*=np.linspace(1,0,int(.03*SR))
        add(voice,x,l['start'],1.0)
np.save('/tmp/voice.npy',voice)
# 덕킹: 음성이 있는 구간에서 음악 볼륨 낮춤
vm=np.abs(voice[0]); vm=np.convolve(vm,np.ones(int(.15*SR))/int(.15*SR),mode='same'); duck=np.clip(1-3.5*vm,0.35,1.0)
duck=np.convolve(duck,np.ones(int(.25*SR))/int(.25*SR),mode='same')
mix=voice*1.0+music*duck*1.15+sfx*0.9
def wr(fn,a):
    a=np.clip(a,-1,1); w=wave.open(fn,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a.T*32767).astype(np.int16).tobytes()); w.close()
wr('../audio/voice.wav',voice); wr('../audio/mix_raw.wav',mix)
print('ok',total)
