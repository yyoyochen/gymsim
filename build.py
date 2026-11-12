import glob, subprocess, base64, os, tempfile
T=tempfile.gettempdir()
src=''.join(open(f).read() for f in sorted(glob.glob('src/*.js')))
shell=open('shell.html').read()
# Chinese pixel font (Cubic 11, SIL OFL): subset to the characters the sim uses and inline it, since the artifact can't load fonts from other sites
chars=set(c for c in src+shell if ord(c)>=0x2E80)|set('，。、：；？！（）「」·')
open(T+'/cubic_chars.txt','w').write(''.join(sorted(chars)))
subprocess.run(['pyftsubset','fonts/Cubic_11.woff2','--text-file='+T+'/cubic_chars.txt','--flavor=woff2','--output-file='+T+'/cubic_sub.woff2','--no-hinting'],check=True,stderr=subprocess.DEVNULL)
b64=base64.b64encode(open(T+'/cubic_sub.woff2','rb').read()).decode()
shell=shell.replace('https://cdn.jsdelivr.net/gh/ACh-K/Cubic-11@main/fonts/web/Cubic_11.woff2','data:font/woff2;base64,'+b64)
open('index.html','w').write(shell.replace('/*MAIN*/',src))
print(len(src), len(b64))
