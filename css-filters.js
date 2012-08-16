// SVG cache & creation
var CFP = {
	// http://james.padolsey.com/javascript/detect-_ie-in-js-using-conditional-comments/
	_ie:			(function(){
		var undef,
		v = 3,
		div = document.createElement('div'),
		all = div.getElementsByTagName('i');
		
		while(
			div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
			all[0]
		);
		
		return v > 4 ? v : undef;
	}()),
	
	_svg_cache: 		{},
	
	_create_svg:	function(id,filtereffect,attributes){
		var xmlns = 'http://www.w3.org/2000/svg';
		var svg = document.createElementNS(xmlns,'svg');
		
		var svg_filter = document.createElementNS(xmlns,'filter');
		svg_filter.setAttributeNS(null,'id',id);
		svg.appendChild(svg_filter);
		
		var svg_fe = document.createElementNS(xmlns,filtereffect);
		for(key in attributes){
			svg_fe.setAttributeNS(null,key,attributes[key]);
		}
		svg_filter.appendChild(svg_fe);
		
		return svg;
	},
	
	_pending_stylesheets: 0,

	_stylesheets: 		[],
	
	_fetch_stylesheets: function(){
		var stylesheets = document.querySelectorAll('style,link[rel="stylesheet"]');
		for(var i = 0; i < stylesheets.length; i++){
			switch(stylesheets[i].nodeName){
				default:
				break;
				
				case 'STYLE':
					this._stylesheets.push({
						media:		stylesheets[i].media || 'all',
						content: 	stylesheets[i].innerHTML,
					});
				break;
				
				case 'LINK':
					var index = this._stylesheets.length;
				
					this._stylesheets.push({
						media:		stylesheets[i].media || 'all'
					});
					
					this._pending_stylesheets++;
					
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open('GET', stylesheets[i].href, true);
					xmlHttp.onreadystatechange = function(){
						if(xmlHttp.readyState === 4){
							CFP._pending_stylesheets--;
							CFP._stylesheets[index].content = xmlHttp.responseText;
							if(CFP._pending_stylesheets === 0){
								CFP.process();
							}
						}
					};
					xmlHttp.send(null);
				break;
			}
		}
		if(this._pending_stylesheets === 0){
			this.process();
		}
	},
	
	// process stylesheets
	process:		function(){
		var parser = new CSSParser();

		for(var i = 0; i < this._stylesheets.length; i++){
			var newstyles = '';
			var sheet = parser.parse(this._stylesheets[i].content, false, true);
			if(sheet !== null) for(var j in sheet.cssRules){
				var rule = sheet.cssRules[j];
				for(var k in rule.declarations){
					var declaration = rule.declarations[k];
		
					if(declaration.property === 'filter'){
						
						var elems = document.querySelectorAll(rule.mSelectorText);
						for(var i = 0; i < elems.length; i++){
							elems[i].style.polyFilterStore = declaration.valueText;
						}
						
						var values = declaration.valueText.split(' ');
							properties = {
								filtersW3C:	[],
								filtersSVG:	[],
								filtersIE:	[],
								behaviorsIE:[]
							}
						
						for(idx in values){
							var value = values[idx];
							
							currentproperties = CFP.convert(value);
			
							for(key in currentproperties){
								if(typeof properties[key] !== 'undefined'){
									properties[key] = properties[key].concat(currentproperties[key]);
								}
							}
						}
						
						newstyles += rule.mSelectorText + '{';
						if(properties['filtersW3C'].length > 0){
							var filtersW3C = properties['filtersW3C'].join(' ');
		
							if(typeof this._ie === 'undefined'){
								newstyles += '-ms-filter:' + filtersW3C + ';';
							}
							
							newstyles += '-webkit-filter:' + filtersW3C + ';';
							newstyles += '-moz-filter:' + filtersW3C + ';';
							newstyles += '-o-filter:' + filtersW3C + ';';
						}
						if(properties['filtersSVG'].length > 0){
							var filtersSVG = properties['filtersSVG'].join(' ');
							
							newstyles += 'filter:' + filtersSVG + ';';
						}
						if(typeof this._ie !== 'undefined'){
							if(properties['filtersIE'].length > 0){
								var filtersIE = properties['filtersIE'].join(' ');
								
								newstyles += 'filter:' + filtersIE + ';';
							}
							if(properties['behaviorsIE'].length > 0){
								var behaviorsIE = properties['behaviorsIE'].join(' ');
								
								newstyles += 'behavior:' + behaviorsIE + ';';
							}
						}
						newstyles += '}\r\n';
					}
				}
			}
			var newstylesheet = document.createElement('style');
			newstylesheet.setAttribute('media',this._stylesheets[i].media);
			document.getElementsByTagName('head')[0].appendChild(newstylesheet);
			
			if(typeof CFP._ie === 'undefined') newstylesheet.innerHTML = newstyles;
			else newstylesheet.styleSheet.cssText = newstyles;
			
			console.log(newstyles);
		}
	},
	
	convert:			function(value){
		// Grayscale
		var fmatch = value.match(/(grayscale)\(([0-9\.]+)\)/i);
		if(fmatch !== null){
			var amount = parseFloat(fmatch[2],10),
				properties = this.grayscale(amount);
		}
		// Sepia
		var fmatch = value.match(/(sepia)\(([0-9\.]+)\)/i);
		if(fmatch !== null){
			var amount = parseFloat(fmatch[2],10),
				properties = this.sepia(amount);
		}
		// Blur
		var fmatch = value.match(/(blur)\(([0-9]+)px\)/i);
		if(fmatch !== null){
			var amount = parseInt(fmatch[2],10),
				properties = this.blur(amount);
		}
		
		return properties;
	},
	
	init:				function(){
		if(CSSStyleDeclaration.prototype.__defineSetter__){
			CSSStyleDeclaration.prototype.__defineSetter__('polyFilter',function(gluedvalues){
				values = gluedvalues.split(' ');
				var properties = {
					filtersW3C:	[],
					filtersSVG:	[],
					filtersIE:	[],
					behaviorsIE:[]
				}
		
				for(idx in values){
					var value = values[idx];
					
					currentproperties = CFP.convert(value);
		
					for(key in currentproperties){
						if(typeof properties[key] !== 'undefined'){
							properties[key] = properties[key].concat(currentproperties[key]);
						}
					}
				}
	
				if(properties['filtersW3C'].length > 0){
					if(typeof CFP._ie === 'undefined'){
						this.msFilter = 
							properties['filtersW3C'].join(' ');
					}
					
					this.webkitFilter = 
					this.mozFilter = 
					this.oFilter = 
						properties['filtersW3C'].join(' ');
				}
				if(properties['filtersSVG'].length > 0){
					this.filter = 
						properties['filtersSVG'].join(' ');
				}
				if(typeof CFP._ie !== 'undefined'){
					if(properties['filtersIE'].length > 0){
						this.filter = 
							properties['filtersIE'].join(' ');
					}
					else {
						this.filter = '';
					}
					if(properties['behaviorsIE'].length > 0){
						this.behavior = 
							properties['behaviorsIE'].join(' ');
					}
					else {
						this.behavior = '';
					}
				}
				this.polyFilterStore = gluedvalues;
			});
	
			CSSStyleDeclaration.prototype.__defineGetter__('polyFilter',function(value){
				return this.polyFilterStore || this.page;
			});
		}
		else {
			Object.defineProperty(CSSStyleDeclaration.prototype, 'polyFilter', {
				get:	function(){
					return this.polyFilterStore || this.page;
				},
				set:	function(gluedvalues){
					values = gluedvalues.split(' ');
					var properties = {
						filtersW3C:	[],
						filtersSVG:	[],
						filtersIE:	[],
						behaviorsIE:[]
					}
			
					for(idx in values){
						var value = values[idx];
						
						currentproperties = CFP.convert(value);
			
						for(key in currentproperties){
							if(typeof properties[key] !== 'undefined'){
								properties[key] = properties[key].concat(currentproperties[key]);
							}
						}
					}
		
					if(properties['filtersW3C'].length > 0){
						if(typeof CFP._ie === 'undefined'){
							this.msFilter = 
								properties['filtersW3C'].join(' ');
						}
						
						this.webkitFilter = 
						this.mozFilter = 
						this.oFilter = 
							properties['filtersW3C'].join(' ');
					}
					if(properties['filtersSVG'].length > 0){
						this.filter = 
							properties['filtersSVG'].join(' ');
					}
					if(typeof CFP._ie !== 'undefined'){
						if(properties['filtersIE'].length > 0){
							this.filter = 
								properties['filtersIE'].join(' ');
						}
						else {
							this.filter = '';
						}
						if(properties['behaviorsIE'].length > 0){
							this.behavior = 
								properties['behaviorsIE'].join(' ');
						}
						else {
							this.behavior = '';
						}
					}
					this.polyFilterStore = gluedvalues;
				}
			});
		}
		
		this._fetch_stylesheets();
	},
	
	// Grayscale
	grayscale:			function(amount){
		amount = amount || 0;
		
		var properties = {};
		
		if(typeof this._ie === 'undefined'){
			// Proposed spec
			properties['filtersW3C'] = ['grayscale(' + amount + ')'];
			
			// Firefox
			// https://dvcs.w3.org/hg/FXTF/raw-file/tip/filters/index.html
			var id = 'grayscale' + (amount + '').replace(/[^a-z0-9]/g,'');
			if(typeof this._svg_cache[id] === 'undefined'){
				this._svg_cache[id] = this._create_svg(id,'feColorMatrix',{
					type:	'matrix',
					values:	(0.2126 + 0.7874 * (1 - amount)) + ' ' 
							   + (0.7152 - 0.7152 * (1 - amount)) + ' ' 
							   + (0.0722 - 0.0722 * (1 - amount)) + ' 0 0 ' 
							   + (0.2126 - 0.2126 * (1 - amount)) + ' ' 
							   + (0.7152 + 0.2848 * (1 - amount)) + ' ' 
							   + (0.0722 - 0.0722 * (1 - amount)) + ' 0 0 ' 
							   + (0.2126 - 0.2126 * (1 - amount)) + ' ' 
							   + (0.7152 - 0.7152 * (1 - amount)) + ' ' 
							   + (0.0722 + 0.9278 * (1 - amount)) + ' 0 0 0 0 0 1 0'
				});
				
				document.body.appendChild(this._svg_cache[id]);
			}
			properties['filtersSVG'] = ['url(#' + id + ')'];
		}
		else {
			// IE
			properties['filtersIE'] = amount >= 0.5 ? ['gray'] : [];
		}
		
		return properties;
	},
	
	// Sepia
	sepia:			function(amount){
		amount = amount || 0;

		var properties = {};

		if(typeof this._ie === 'undefined'){
		
			// Proposed spec
			properties['filtersW3C'] = ['sepia(' + amount + ')'];
			
			// Firefox
			// https://dvcs.w3.org/hg/FXTF/raw-file/tip/filters/index.html
			var id = 'sepia' + (amount + '').replace(/[^a-z0-9]/g,'');
			if(typeof this._svg_cache[id] === 'undefined'){
				this._svg_cache[id] = this._create_svg(id,'feColorMatrix',{
					'type':	'matrix',
					'values': (0.393 + 0.607 * (1 - amount)) + ' ' 
							   + (0.769 - 0.769 * (1 - amount)) + ' ' 
							   + (0.189 - 0.189 * (1 - amount)) + ' 0 0 ' 
							   + (0.349 - 0.349 * (1 - amount)) + ' ' 
							   + (0.686 + 0.314 * (1 - amount)) + ' ' 
							   + (0.168 - 0.168 * (1 - amount)) + ' 0 0 '
							   + (0.272 - 0.272 * (1 - amount)) + ' ' 
							   + (0.534 - 0.534 * (1 - amount)) + ' ' 
							   + (0.131 + 0.869 * (1 - amount)) + ' 0 0 0 0 0 1 0'
				});
				
				document.body.appendChild(this._svg_cache[id]);
			}
			properties['filtersSVG'] = ['url(#' + id + ')'];
		}
		else {
			// IE
			properties['filtersIE'] = amount >= 0.5 ? ['gray','progid:DXImageTransform.Microsoft.Light()'] : [];
			properties['behaviorsIE'] = amount >= 0.5 ? ['url("sepia.htc")'] : [];
		}
		
		return properties;
	},
	
	// Blur
	blur:			function(amount){
		amount = amount || 0;
		
		var properties = {};
		
		if(typeof this._ie === 'undefined'){
			// Proposed spec
			properties['filtersW3C'] = ['blur(' + amount + 'px)'];
			
			// Firefox
			// https://dvcs.w3.org/hg/FXTF/raw-file/tip/filters/index.html
			var id = 'blur' + (amount + '').replace(/[^a-z0-9]/g,'');
			if(typeof this._svg_cache[id] === 'undefined'){
				var xmlns = 'http://www.w3.org/2000/svg';
				this._svg_cache[id] = this._create_svg(id,'feGaussianBlur',{
					'in':			'SourceGraphic',
					'stdDeviation': amount
				});

				document.body.appendChild(this._svg_cache[id]);
			}
			properties['filtersSVG'] = ['url(#' + id + ')'];
		}
		else {
			// IE
			properties['filtersIE'] = ['progid:DXImageTransform.Microsoft.Blur(pixelradius=' + amount + ')'];
		}
		
		return properties;
	}
}