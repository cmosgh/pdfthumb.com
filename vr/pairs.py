import re,glob,collections,sys
PAL=r'(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(-\d{2,3})?(/\d+)?'
PROPS='bg|text|border|ring-offset|ring|divide|from|to|via|fill|stroke|shadow|outline|placeholder|decoration'
cls=re.compile(r'^((?:[a-z-]+:)*)('+PROPS+r')-'+PAL+r'$')
pairs=collections.Counter(); where=collections.defaultdict(set)
for f in glob.glob('src/**/*.tsx',recursive=True)+glob.glob('src/**/*.ts',recursive=True):
    if 'routeTree' in f: continue
    src=open(f).read()
    for m in re.finditer(r'(["`\'])((?:(?!\1).)*?)\1',src,re.S):
        toks=m.group(2).split()
        found={}
        for t in toks:
            mm=cls.match(t)
            if not mm: continue
            pre=mm.group(1); dark='dark:' in pre; state=pre.replace('dark:','')
            key=(state,mm.group(2))
            val=t[len(pre):][len(mm.group(2))+1:]
            found.setdefault(key,{})['dark' if dark else 'light']=val
        for (state,prop),v in found.items():
            p=(state+prop, v.get('light','-'), v.get('dark','-'))
            pairs[p]+=1; where[p].add(f.replace('src/',''))
for p,n in sorted(pairs.items(),key=lambda x:(x[0][0],-x[1])):
    print(f"{n:3} {p[0]:22} {p[1]:18} {p[2]:18} {', '.join(sorted(where[p]))[:90]}")
print(len(pairs),"distinct pairs",file=sys.stderr)
