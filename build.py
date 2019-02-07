import glob
import markdown
import re
import os
import subprocess

_cache = {}
_site  = {}
_root  = os.path.join(os.path.abspath(os.getcwd()), '_content')


with open(".git/HEAD") as f:
	d = f.read().strip()
	_head = d.split("/")[-1]

with open(os.path.join('.git', d.split(":")[1].strip())) as f:
	_sha = f.read().strip()


def call(args):
	o = subprocess.call(args)
	if o > 0:
		exit()

def get_include(f, relative):
	global _root
	p = os.path.dirname(os.path.abspath(relative))
	full = os.path.join(p, f)
	if os.path.exists(full):
		return compile_page(full)
	elif p == _root:
		return "<!-- INCLUDE NOT FOUND FOR {} -->".format(f)
	else:
		return get_include(f, os.path.join('..', p))


def compile_site():
	global _site
	global _root
	pages = []
	patts = ["*.md", "*.html"]
	for p in patts:
		pages.extend(glob.glob(os.path.join(_root, "**/", p)))
		pages.extend(glob.glob(os.path.join(_root, p)))
	for page in pages:
		if page.split('/')[-1][0] == "_":
			continue
		_site[page.replace('.md', '.html')] = compile_page(page)


def compile_page(filename):
	filename = os.path.abspath(filename)
	if filename in _cache:
		return _cache[filename]
	# TODO: Markdown preprocessor for transclusion.
	trans = re.compile(r'(^(?:<p>)?\s*!\s*(.*?)(?:</p>)?$)', re.MULTILINE)
	with open(filename) as f:
		d = f.read()
	if filename[-2:] == "md":  # Convert Markdown to HTML first.
		out = markdown.markdown(d)
	else:
		out = d
	trasclusions = trans.findall(out)
	for m, t in trasclusions:
		i = get_include(t, filename)
		out = out.replace(m, get_include(t, filename))
	_cache[filename] = out
	return out

compile_site()

call(['git', 'checkout', 'gh-pages'])

for f, p in _site.items():
	d = os.path.dirname(f).replace('/_content', '')
	if d and not os.path.exists(d):
		os.makedirs(d)
	of = os.path.join(d, os.path.basename(f))
	with open(of, 'w') as fp:
		fp.write(p)
	
call(['git', 'add', '-A'])
call(['git', 'commit', '-m', 'Autobuild from {}'.format(_sha)])
call(['git', 'checkout', _head])
