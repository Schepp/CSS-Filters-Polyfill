// SVG cache & creation
var polyfilter = {
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
	
	_create_svg_element: function(tagname,attributes){
		var xmlns = 'http://www.w3.org/2000/svg';
		var elem = document.createElementNS(xmlns,tagname);
		for(key in attributes){
			elem.setAttributeNS(null,key,attributes[key]);
		}
		
		return elem;
	},
	
	_create_svg:	function(id,filterelements){
		var xmlns = 'http://www.w3.org/2000/svg';
		var svg = document.createElementNS(xmlns,'svg');
		
		var svg_filter = document.createElementNS(xmlns,'filter');
		svg_filter.setAttributeNS(null,'id',id);
		svg.appendChild(svg_filter);
		
		for(var i = 0; i < filterelements.length; i++){
			svg_filter.appendChild(filterelements[i]);
		}
		
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
							polyfilter._pending_stylesheets--;
							polyfilter._stylesheets[index].content = xmlHttp.responseText;
							if(polyfilter._pending_stylesheets === 0){
								polyfilter.process();
							}
						}
					};
					try{
						xmlHttp.send(null);
					} catch(e){
						console.log('Could not fetch external CSS via HTTP-Request');
						polyfilter._pending_stylesheets--;
						if(polyfilter._pending_stylesheets === 0){
							polyfilter.process();
						}
					}
				break;
			}
		}
		if(this._pending_stylesheets === 0){
			this.process();
		}
	},

	_processDeclarations:	function(rule){
		var newstyles = '';
		for(var k in rule.declarations){
			var declaration = rule.declarations[k];
		
			if(declaration.property === 'filter'){
				
				var elems = document.querySelectorAll(rule.mSelectorText);
				for(var k = 0; k < elems.length; k++){
					elems[k].style.polyfilterStore = declaration.valueText;
				}
				
				var gluedvalues = declaration.valueText;
				var values = gluedvalues.split(/\)\s+/),
					properties = {
						filtersW3C:	[],
						filtersSVG:	[],
						filtersIE:	[],
						behaviorsIE:[]
					};
				
				for(idx in values){
					var value = values[idx] + ')';
					
					currentproperties = polyfilter.convert(value);
	
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
					var id = gluedvalues.replace(/[^a-z0-9]/g,'');
		
					if(typeof this._svg_cache[id] === 'undefined'){
						this._svg_cache[id] = this._create_svg(id,properties['filtersSVG']);
						document.body.appendChild(this._svg_cache[id]);
					}
					
					newstyles += 'filter: url(#' + id + ');';
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
		return newstyles;
	},
	
	// process stylesheets
	process:		function(){
		var parser = new CSSParser();

		for(var i = 0; i < this._stylesheets.length; i++){
			var newstyles = '';
			var sheet = parser.parse(this._stylesheets[i].content, false, true);
			if(sheet !== null) for(var j in sheet.cssRules){
				var rule = sheet.cssRules[j];
				
				switch(rule.type){
					default:
					break;
					
					case 1:
						newstyles += this._processDeclarations(rule);
					break;
					
					case 4:
						newstyles += '@media ' + rule.media.join(',') + '{';
						for(var k in rule.cssRules){
							var mediarule = rule.cssRules[k];
							
							newstyles += this._processDeclarations(mediarule);
						}
						newstyles += '}';
					break;
				}
			}
			var newstylesheet = document.createElement('style');
			newstylesheet.setAttribute('media',this._stylesheets[i].media);
			document.getElementsByTagName('head')[0].appendChild(newstylesheet);
			
			if(typeof polyfilter._ie === 'undefined') newstylesheet.innerHTML = newstyles;
			else newstylesheet.styleSheet.cssText = newstyles;
		}
	},
	
	init:				function(){
		// Internet Explorer
		/*
		if(1 != 1 && CSSStyleDeclaration.prototype.__defineSetter__){
			CSSStyleDeclaration.prototype.__defineSetter__('polyfilter',function(gluedvalues){
				values = gluedvalues.split(/\)\s+/);
				var properties = {
					filtersW3C:	[],
					filtersSVG:	[],
					filtersIE:	[],
					behaviorsIE:[]
				}
		
				for(idx in values){
					var value = values[idx] + ')';
					
					currentproperties = polyfilter.convert(value);

					for(key in currentproperties){
						if(typeof properties[key] !== 'undefined'){
							properties[key] = properties[key].concat(currentproperties[key]);
						}
					}
				}
	
				if(properties['filtersW3C'].length > 0){
					if(typeof polyfilter._ie === 'undefined'){
						this.msFilter = 
							properties['filtersW3C'].join(' ');
					}
					
					this.webkitFilter = 
					this.mozFilter = 
					this.oFilter = 
						properties['filtersW3C'].join(' ');
				}
				if(properties['filtersSVG'].length > 0){
					var id = gluedvalues.replace(/[^a-z0-9]/g,'');
		
					if(typeof polyfilter._svg_cache[id] === 'undefined'){
						polyfilter._svg_cache[id] = polyfilter._create_svg(id,properties['filtersSVG']);
						document.body.appendChild(polyfilter._svg_cache[id]);
					}

					this.filter = 'url(#' + id + ')';
				}
				if(typeof polyfilter._ie !== 'undefined'){
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
				this.polyfilterStore = gluedvalues;
			});
	
			CSSStyleDeclaration.prototype.__defineGetter__('polyfilter',function(value){
				return this.polyfilterStore || this.filter;
			});
		}
		else {*/
			// ES5
			Object.defineProperty(CSSStyleDeclaration.prototype, 'polyfilter', {
				get:	function(){
					return this.polyfilterStore;
				},
				set:	function(gluedvalues){
					values = gluedvalues.split(/\)\s+/);
					var properties = {
						filtersW3C:	[],
						filtersSVG:	[],
						filtersIE:	[],
						behaviorsIE:[]
					}
			
					for(idx in values){
						var value = values[idx] + ')';
						
						currentproperties = polyfilter.convert(value);
						
						for(key in currentproperties){
							if(typeof properties[key] !== 'undefined'){
								properties[key] = properties[key].concat(currentproperties[key]);
							}
						}
					}
		
					if(properties['filtersW3C'].length > 0){
						if(typeof polyfilter._ie === 'undefined'){
							this.msFilter = 
								properties['filtersW3C'].join(' ');
						}
						
						this.webkitFilter = 
						this.mozFilter = 
						this.oFilter = 
							properties['filtersW3C'].join(' ');
					}
					if(properties['filtersSVG'].length > 0){
						var id = gluedvalues.replace(/[^a-z0-9]/g,'');
			
						if(typeof polyfilter._svg_cache[id] === 'undefined'){
							polyfilter._svg_cache[id] = this._create_svg(id,properties['filtersSVG']);
							document.body.appendChild(polyfilter._svg_cache[id]);
						}
	
						this.filter = 'url(#' + id + ')';
					}
					if(typeof polyfilter._ie !== 'undefined'){
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
					this.polyfilterStore = gluedvalues;
				}
			});
		//}
		
		this._fetch_stylesheets();
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
		var fmatch = value.match(/(blur)\(([0-9]+)[px]*\)/i);
		if(fmatch !== null){
			var amount = parseInt(fmatch[2],10),
				properties = this.blur(amount);
		}
		// Invert
		var fmatch = value.match(/(invert)\(([0-9\.]+)\)/i);
		if(fmatch !== null){
			var amount = parseFloat(fmatch[2],10),
				properties = this.invert(amount);
		}
		// Brightness
		var fmatch = value.match(/(brightness)\(([0-9\.]+)\)/i);
		if(fmatch !== null){
			var amount = parseFloat(fmatch[2],10),
				properties = this.brightness(amount);
		}
		// Drop Shadow
		var fmatch = value.match(/(drop\-shadow)\(([0-9]+)[px]*\s+([0-9]+)[px]*\s+([0-9]+)[px]*\s+([#0-9]+)\)/i);
		if(fmatch !== null){
			var offsetX = parseInt(fmatch[2],10),
				offsetY = parseInt(fmatch[3],10),
				radius = parseInt(fmatch[4],10),
				color = fmatch[5],
				properties = this.dropShadow(offsetX,offsetY,radius,color);
		}
		
		return properties;
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
			var svg_fe1 = this._create_svg_element('feColorMatrix',{
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
			properties['filtersSVG'] = [svg_fe1];
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
			var svg_fe1 = this._create_svg_element('feColorMatrix',{
				type:	'matrix',
				values:	(0.393 + 0.607 * (1 - amount)) + ' ' 
					+ (0.769 - 0.769 * (1 - amount)) + ' ' 
					+ (0.189 - 0.189 * (1 - amount)) + ' 0 0 ' 
					+ (0.349 - 0.349 * (1 - amount)) + ' ' 
					+ (0.686 + 0.314 * (1 - amount)) + ' ' 
					+ (0.168 - 0.168 * (1 - amount)) + ' 0 0 '
					+ (0.272 - 0.272 * (1 - amount)) + ' ' 
					+ (0.534 - 0.534 * (1 - amount)) + ' ' 
					+ (0.131 + 0.869 * (1 - amount)) + ' 0 0 0 0 0 1 0'
			});
			properties['filtersSVG'] = [svg_fe1];
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
			var svg_fe1 = this._create_svg_element('feGaussianBlur',{
				'in':			'SourceGraphic',
				stdDeviation: amount
			});
			properties['filtersSVG'] = [svg_fe1];
		}
		else {
			// IE
			properties['filtersIE'] = ['progid:DXImageTransform.Microsoft.Blur(pixelradius=' + amount + ')'];
		}
		
		return properties;
	},
	
	// Invert
	invert:			function(amount){
		amount = amount || 0;
		
		var properties = {};
		
		if(typeof this._ie === 'undefined'){
			// Proposed spec
			properties['filtersW3C'] = ['invert(' + amount + ')'];
			
			// Firefox
			// https://dvcs.w3.org/hg/FXTF/raw-file/tip/filters/index.html
			var svg_fe1 = this._create_svg_element('feComponentTransfer',{});
			var svg_fe1sub = this._create_svg_element('feFuncR',{
				type:	'table',
				tableValues: amount + ' ' + (1 - amount)
			});
			svg_fe1.appendChild(svg_fe1sub);
			var svg_fe1sub = this._create_svg_element('feFuncG',{
				type:	'table',
				tableValues: amount + ' ' + (1 - amount)
			});
			svg_fe1.appendChild(svg_fe1sub);
			var svg_fe1sub = this._create_svg_element('feFuncB',{
				type:	'table',
				tableValues: amount + ' ' + (1 - amount)
			});
			svg_fe1.appendChild(svg_fe1sub);
			properties['filtersSVG'] = [svg_fe1];
		}
		else {
			// IE
			properties['filtersIE'] = amount >= 0.5 ? ['invert'] : [];
		}
		
		return properties;
	},
		
	// Brightness
	brightness:			function(amount){
		amount = amount || 0;
		
		var properties = {};
		
		if(typeof this._ie === 'undefined'){
			// Proposed spec
			properties['filtersW3C'] = ['brightness(' + amount + ')'];
			
			// Firefox
			// https://dvcs.w3.org/hg/FXTF/raw-file/tip/filters/index.html
			var svg_fe1 = this._create_svg_element('feComponentTransfer',{});
			var svg_fe1sub = this._create_svg_element('feFuncR',{
				type:	'linear',
				slope: 	1 + amount
			});
			svg_fe1.appendChild(svg_fe1sub);
			var svg_fe1sub = this._create_svg_element('feFuncG',{
				type:	'linear',
				slope: 	1 + amount
			});
			svg_fe1.appendChild(svg_fe1sub);
			var svg_fe1sub = this._create_svg_element('feFuncB',{
				type:	'linear',
				slope: 	1 + amount
			});
			svg_fe1.appendChild(svg_fe1sub);
			properties['filtersSVG'] = [svg_fe1];
		}
		else {
			// IE
			properties['filtersIE'] = ['progid:DXImageTransform.Microsoft.Light()'];
			properties['behaviorsIE'] = ['url("brightness.htc")'];
		}
		
		return properties;
	},
		
	// Drop Shadow
	dropShadow:			function(offsetX,offsetY,radius,color){
		offsetX = offsetX || 0;
		offsetY = offsetY || 0;
		radius = radius || 0;
		color = color || '#000000';
		
		var properties = {};
		
		if(typeof this._ie === 'undefined'){
			// Proposed spec
			properties['filtersW3C'] = ['drop-shadow(' + offsetX + 'px ' + offsetY + 'px ' + radius + 'px ' + color + ')'];
			
			// Firefox
			// https://dvcs.w3.org/hg/FXTF/raw-file/tip/filters/index.html
			var svg_fe1 = this._create_svg_element('feGaussianBlur',{
				'in':		'SourceAlpha',
				stdDeviation: radius
			});
			var svg_fe2 = this._create_svg_element('feOffset',{
				dx:		offsetX,
				dy:		offsetY,
				result:	'offsetblur'
			});
			var svg_fe3 = this._create_svg_element('feFlood',{
				'flood-color': color
			});
			var svg_fe4 = this._create_svg_element('feComposite',{
				in2:	'offsetblur',
				operator: 'in'
			});
			var svg_fe5 = this._create_svg_element('feMerge',{});
			var svg_fe5sub = this._create_svg_element('feMergeNode',{});
			svg_fe5.appendChild(svg_fe5sub);
			var svg_fe5sub = this._create_svg_element('feMergeNode',{
				'in':		'input-image'
			});
			svg_fe5.appendChild(svg_fe5sub);
			properties['filtersSVG'] = [svg_fe1,svg_fe2,svg_fe3,svg_fe4,svg_fe5];
		}
		else {
			// IE
			properties['filtersIE'] = ['progid:DXImageTransform.Microsoft.Glow(color=' + color + ',strength=0)','progid:DXImageTransform.Microsoft.Shadow(color=' + color + ',strength=0)'];
			properties['behaviorsIE'] = ['url("drop-shadow.htc")'];
		}
		
		return properties;
	}
}