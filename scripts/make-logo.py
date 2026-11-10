"""Genera src/partials/marks.json: el monograma SC (Fraunces 500) y سك (IBM Plex Sans Arabic 600) convertidos a trazados.
Uso: pip install fonttools brotli uharfbuzz && python3 scripts/make-logo.py"""
import os
import io, json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb
NM=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","node_modules")+"/"
def load(path, axes=None):
    f=TTFont(path)
    if axes and 'fvar' in f: f=instancer.instantiateVariableFont(f, axes)
    f.flavor=None; b=io.BytesIO(); f.save(b); return TTFont(io.BytesIO(b.getvalue())), b.getvalue()
def outline(path, text, size, cx, baseline, axes=None, rtl=False, track=0):
    font,data=load(path,axes)
    face=hb.Face(data); hf=hb.Font(face); buf=hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(hf,buf,{})
    upem=font['head'].unitsPerEm; s=size/upem
    gs=font.getGlyphSet(); order=font.getGlyphOrder()
    total=sum(p.x_advance for p in buf.glyph_positions)+track*(len(buf.glyph_positions)-1)/s
    x=cx/s - total/2; d=[]
    for info,pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen=SVGPathPen(gs, lambda v: ("%.2f"%v).rstrip('0').rstrip('.'))
        tp=TransformPen(pen,(s,0,0,-s,(x+pos.x_offset)*s, baseline - pos.y_offset*s))
        gs[order[info.codepoint]].draw(tp); d.append(pen.getCommands())
        x+=pos.x_advance + track/s
    return " ".join(d)
sc=outline(NM+"@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2","SC",42,60,71,{"wght":500,"opsz":72,"SOFT":0,"WONK":0},track=-1)
ar=outline(NM+"@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff","سك",40,60,70)
import os
out=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","src","partials","marks.json")
json.dump({"sc":sc,"ar":ar},open(out,"w"))
print(len(sc),len(ar))
