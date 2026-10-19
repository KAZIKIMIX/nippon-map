#!/usr/bin/env python3
"""Read-only MLIT N02 GeoJSON matcher; never updates official_url."""
import argparse,csv,json,math,re
from collections import defaultdict
from pathlib import Path
def norm(s):
    return re.sub(r'[\s　]+','',str(s or '').removesuffix('駅')).replace('ヶ','ケ').replace('ヵ','カ')
def points(g):
    if not g:return []
    t=g.get('type');c=g.get('coordinates',[])
    if t=='LineString':return c
    if t=='MultiLineString':return [p for line in c for p in line]
    if t=='Point':return [c]
    return []
def distance(a,b):
    lat1,lon1=a;lat2,lon2=b
    x=math.radians(lat2-lat1);y=math.radians(lon2-lon1)
    h=math.sin(x/2)**2+math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(y/2)**2
    return 12742000*math.asin(min(1,math.sqrt(h)))
p=argparse.ArgumentParser()
p.add_argument('--stations',required=True)
p.add_argument('--n02',required=True)
p.add_argument('--output',required=True)
a=p.parse_args()
with open(a.n02,encoding='utf-8') as f:features=json.load(f)['features']
idx=defaultdict(list)
for feature in features:
    prop=feature.get('properties',{})
    if '東日本旅客鉄道' not in str(prop.get('N02_004','')):continue
    name=norm(prop.get('N02_005',''))
    if name and points(feature.get('geometry')):idx[name].append((prop,points(feature['geometry'])))
with open(a.stations,encoding='utf-8-sig',newline='') as f:
    stations=json.load(f) if a.stations.lower().endswith('.json') else list(csv.DictReader(f))
rows=[]
for station in stations:
    if 'latitude' not in station or 'longitude' not in station:
        raise ValueError('Current Supabase coordinates required; stale snapshot is insufficient')
    candidates=[]
    for prop,coords in idx.get(norm(station['name']),[]):
        try:d=min(distance((float(station['latitude']),float(station['longitude'])),(float(pt[1]),float(pt[0]))) for pt in coords)
        except (TypeError,ValueError,IndexError):continue
        route=str(prop.get('N02_003',''))
        routes=station.get('routes',[])
        if not isinstance(routes,list):routes=str(routes).split('|')
        route_match=any(norm(route)==norm(r) or norm(route).replace('本線','線')==norm(r) for r in routes)
        candidates.append((d,route_match,route,prop.get('N02_005c','')))
    candidates.sort()
    close=[x for x in candidates if x[0]<=500 and x[1]]
    status='matched' if len(close)==1 else ('ambiguous' if len(close)>1 else ('needs_review' if candidates else 'no_match'))
    best=close[0] if len(close)==1 else (candidates[0] if candidates else None)
    rows.append({'id':station['id'],'name':station['name'],'prefecture_name':station['prefecture_name'],'status':status,'distance_m':round(best[0],1) if best else '', 'n02_route':best[2] if best else '', 'n02_station_code':best[3] if best else '', 'candidate_count':len(candidates),'official_url':''})
Path(a.output).parent.mkdir(parents=True,exist_ok=True)
with open(a.output,'w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=['id','name','prefecture_name','status','distance_m','n02_route','n02_station_code','candidate_count','official_url'])
    w.writeheader();w.writerows(rows)
print(json.dumps({'total':len(rows),**{k:sum(x['status']==k for x in rows) for k in ['matched','ambiguous','needs_review','no_match']}},ensure_ascii=False))
