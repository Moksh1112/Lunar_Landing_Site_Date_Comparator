import json, pathlib, tomllib, importlib.metadata as md, re, subprocess, urllib.request
root=pathlib.Path.cwd()
lock=json.loads((root/'frontend/package-lock.json').read_text())
node=[]
for path,p in lock['packages'].items():
 if not path: continue
 name=p.get('name') or path.split('node_modules/')[-1]
 node.append(dict(name=name,version=p.get('version'),license=p.get('license','UNDECLARED'),dev=bool(p.get('dev')),path=path))
normalize=lambda s: re.sub(r'[-_.]+','-',s).lower()
installed={normalize(d.metadata['Name']):d for d in md.distributions(path=[str(root/'.venv/target')])}
py=[]
for p in tomllib.loads((root/'backend/uv.lock').read_text())['package']:
 if p['name']=='azelux-backend': continue
 d=installed.get(normalize(p['name']))
 match=d is not None and d.version==p['version']
 classifiers=[x for x in (d.metadata.get_all('Classifier') or []) if x.startswith('License ::')] if match else []
 license=(d.metadata.get('License-Expression') or d.metadata.get('License') or '; '.join(classifiers) or 'UNDECLARED') if match else 'NOT_INSTALLED_AT_LOCKED_VERSION'
 py.append(dict(name=p['name'],version=p['version'],license=license,metadata_matches_lock=match,license_files=d.metadata.get_all('License-File') if match else []))
for item in py:
 if not item['metadata_matches_lock']:
  url='https://pypi.org/pypi/'+item['name']+'/'+item['version']+'/json'
  with urllib.request.urlopen(url,timeout=30) as response:
   info=json.load(response)['info']
  item['license']=info.get('license_expression') or info.get('license') or '; '.join(c for c in info.get('classifiers',[]) if c.startswith('License ::')) or 'UNDECLARED'
  item['metadata_source']=url
 else:
  item['metadata_source']='Installed metadata, exact locked version'
result=dict(schema_version=1,source_commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),scope='Lockfile inventory; npm license declarations and exact-version installed Python metadata, not legal clearance. Third-party vendored code/assets are separately reviewed.',npm=sorted(node,key=lambda x:(x['name'],x['version'] or '')),python=sorted(py,key=lambda x:x['name']))
out=root/'docs/evidence/DEPENDENCY_LICENSES_2026-11-15.json'
out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('npm records',len(node),'undeclared',sum(x['license']=='UNDECLARED' for x in node))
print('Python records',len(py),'unmatched',sum(not x['metadata_matches_lock'] for x in py))
print('Unmatched Python:',[x['name'] for x in py if not x['metadata_matches_lock']])
