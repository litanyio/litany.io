class UIState {
	constructor(...selectors) {
		this._selectors = {};
		this._memoized = {};
		this.__state = {};
		for (let s of selectors) this.selectors = s;
	}
	bind(name) {
		return (...a) => { this.update(name); };
	}
	memo(prop) {
		if (this._memoized[prop]) return this._memoized[prop];
		this._memoized[prop] = this[prop];
	}
	update(...props) {
		for (let p of props) {
			if (!p) continue;
			var v = this[p], s = this.__state;
			if (v === undefined || s[p] !== v) {
				s[p] = v;
				this[p] = v;
			}
		}
	}
	set selectors(s) {
		for (let k in s) this._selectors[k] = s[k];
	}
	els(name) {
		var s = this._selectors[name];
		if (!s) return;
		return (typeof s === 'string') ? 
			this.el('main').querySelectorAll(s) : [s];
	}
	el(name) {
		var scope = (name == 'main') ? document : this.el('main');
		var s = this._selectors[name];
		if (!s) return;
		return (typeof s === 'string') ? scope.querySelector(s) : s;
	}

}

class StickyState extends UIState {
	constructor(s) {
		super({
			// Sticky headers. They replace the '.io' in the title when
			// scrolled to.
			'headers': false,
			// When scroll reaches this, sticky is triggered.
			'topbar': false,
			'main': 'body',
			'title': false,
			'window': window,
			// These elements have H1s that will be added to the topbar.
			'titled': false
		}, s);
		this._defaultTitle = this.el('title').textContent;
	}
	get top() {
		return window.scrollY;
	}
	get scrollTitle() {
		for (let el of this.els('titled')) {
			let h1 = el.querySelector('h1');
			if (!h1) continue;
			let min = el.offsetTop + 20, max = min + el.offsetHeight,
			    y = ui.top - ui.el('topbar').offsetHeight;
			if (ui.top > min && ui.top < max) {
				return h1.textContent;
			}
		}
	}
	set scrollTitle(txt) {
		this.el('title').innerHTML = txt || this._defaultTitle;
	}
	get sticky() {
		return (this.top > this.targetOffset);
	}
	set sticky(bool) {
		if (bool === true) {
			this.el('main').classList.add('scrolling');
			window.scrollTo(0, 10);
		} else {
			this.el('main').classList.remove('scrolling');
		}
	}
	get titles() {
		return set(map((e) => {
			var el = this.el('topbar'), t = el.offsetTop, h = el.offsetHeight;
			return [el, t, t + h];
		}, this.els('headers')));
	}
	get targetOffset() {
		return this.el('topbar').offsetTop;
	}
}

function* map(fn, iterator) {
	for (let i of iterator) yield fn(i);
}

function set(...a) { return new Set(...a); }

{
	let ui = new StickyState({
		'topbar': '#fixed-target',
		'title': '#scroll-title',
		'titled': '.product'
	});

	window.addEventListener('scroll', ui.bind('scrollTitle'));
	window.addEventListener('scroll', ui.bind('sticky'));

	window.ui = ui;

	/*
	let stuck = false;

	window.addEventListener('scroll', () => {
		var el = document.getElementById('fixed-target');
		var sticky = (window.scrollY > el.offsetTop);
		if (!stuck && sticky) {
			document.body.classList.add('scrolling');
			window.scrollTo(0, 10);
			stuck = true;
		} else if (!sticky) {
			document.body.classList.remove('scrolling');
			stuck = false;
		}
	});*/
}
