Polyfilter - a CSS Filters Polyfill
===================================

This polyfill takes the official CSS Filter Effects syntax, which spec you can find over [here](http://www.w3.org/TR/filter-effects/#FilterProperty) and translates it to the different equivalent techniques that the browsers know for those effects:

* Prefixing for WebKit/Blink-based browsers
* Translating into SVG-filters for Firefox
* Translating into DirectX-filters for IE 6-9

For instance, this allows you to assign a property like 

`filter: blur(10px);`

in your stylesheets and the polyfill will take care that it works in as many browsers as possible.

##Supported Filters##

* grayscale*
* sepia*
* blur
* invert*
* brightness
* drop-shadow

Have a look at [this overview](http://schepp.github.io/CSS-Filters-Polyfill/examples/static-vs-animated/static.html).

\* _the IEs only support 0% or 100% values_

##Supported Browsers##

Currently the polyfill is able to support

* Chrome 20+ (brightness filter 28+), 
* Opera 15+ 
* Safari 6+, 
* Yandex 1+,
* Firefox 4+, 
* IE 6 - 9 on desktop (IE 6 & 7 slightly degraded), 

and 

* iOS 6+ Safari/Chrome/Webview
* Chrome 28+ on Android, 
* Opera Mobile 14+,
* Blackberry Browser 10+, 
* Firefox 4+ on Mobile,
* IE on Windows Phone 7, which just supports grayscale.

Also have a look at [http://caniuse.com/css-filters](http://caniuse.com/css-filters)

##Not supported Browsers##

* IE 10+,
* older Presto-based Operas,
* Opera Mini,
* Android browser

###A word regarding IE 10+###

Why is IE 6 - 9 supported, but not IE 10 or higher? Well, since Microsoft decided to switch sides and to now follow standards, they killed their old proprietary filters beginning with IE 10 which I rely on for emulation. 

Altough they did introduce SVG filters sadly those are limited to a usage inside SVGs. They cannot be applied to HTML-elements. 

Even triggering legacy mode does not help any more. So this is why we are left at the end with no hook/support at all in IE10+ :(

###And what about those Presto-based Opera?###

Older Operas with Presto engine are not supported, as they offer none of the hooks I used.

##Setup##

First create a `<script>` element in which you define the **absolute(!)** path to the polyfill library (the stuff in the /lib/ subfolder) in a variable named `polyfilter_scriptpath`, like so:  

```html
<script>  
	var polyfilter_scriptpath = '/css-filters-polyfill/lib/';  
</script>
```

This is important both for the old IEs and the web worker script.  

Should you not want the document stylesheets to not get automatically parsed, like when your plan is to apply filters only via JavaScript, then you can additionally set a `polyfilter_skip_stylesheets` switch:

```html
<script>  
	var polyfilter_scriptpath = '/css-filters-polyfill/lib/';  
	var polyfilter_skip_stylesheets = true;  
</script>
```

Then you link `cssParser.js` and `css-filters-polyfill.js` from the polyfill library. 

```html
<script src="/css-filters-polyfill/lib/cssParser.js"></script>
<script src="/css-filters-polyfill/lib/css-filters-polyfill.js"></script>
```

In an ideal world you should minify and concatenate both of them together with your other JavaScript. If you don't want your page to get blocked by script-loading you put the scripts way down before the closing `</body>`. This might lead to some flickering of the filter effects during loading. If you can't live with the short flickering, put the scripts in the `<head>` of the page. Then it'll be gone, but your page will load slower. You decide.

##Usage##

###Declarative assignment###

This polyfill supports filter declarations in embedded (`<style>`) and external (`<link rel="stylesheet">`) stylesheets. It does not support inline-styles (i.e. style-attributes).

You define a filter by using the unprefixed W3C syntax, e.g.: 

```css
.element{
	filter: blur(10px);
}
```

And you can even assign two filters at once, e.g.

```css
.element{
	filter: sepia(1) blur(10px);
}
```

###Programmatic assignment###

In addition the polyfill also extends the JavaScript CSSStyleDeclaration object, so that you can assign filter styles on the fly as you are used to with CSS. But instead of exposing a `element.style.filter` property as one would think, you instead need to address `element.style.polyfilter`, e.g.:

```javascript
element.style.polyfilter = 'blur(10px)';
```

or via jQuery:

```javascript
$(element).css('polyfilter','blur(10px)');
```
And, again, you can assign two filters at once, e.g.

```javascript
element.style.polyfilter = 'sepia(1) blur(10px)';
```

_Note: This does not work for IE 6 & 7. They just ignore any programmatic assignment._

###Animations###

Likewise, if you want to animate a filter, then you do this:

```javascript
var value = 0,   
    increment = 1  
    elem = document.getElementById('filtered');

window.setInterval(function(){  
    value += increment;  
    elem.style.polyfilter = 'blur(' + value + 'px)';  
    if(value >= 10 || value <= 0) increment *= -1;  
},100);
```

_Note: This again does not work for IE 6 & 7. They just ignore any programmatic assignment._

###Cross Origin Restrictions###

If you practice domain sharding and serve your assets from a different domain than the page you have two options to solve the problem of the poylfill not being allowed to refetch the stylesheets:

a) If you use the same domain, just with different subdomains, e.g. www.yourdomain.com + assets.yourdomain.com, then you can set
```javascript
document.domain = "yourdomain.com";
```
and you are fine.

b) If you use different domains, then you need to activate HTTP CORS headers (Cross-Origin Resource Sharing) on the machine that hosts the stylesheets. If it is an Apache machine you can add the following to its/an .htaccess in its root:

```
<IfModule mod_headers.c>
  <FilesMatch "\.css$">
    Header set Access-Control-Allow-Origin "*"
  </FilesMatch>
</IfModule>
```

Or if you want more security, replace the * with the requesting domain:

```
<IfModule mod_headers.c>
  <FilesMatch "\.css$">
    Header set Access-Control-Allow-Origin "requestingdomain.com"
  </FilesMatch>
</IfModule>
``` 

###Examples and Howtos###

See [http://schepp.github.io/CSS-Filters-Polyfill/examples/](http://schepp.github.io/CSS-Filters-Polyfill/examples/)

###License###

Copyright (c) 2012 - 2013 Christian Schepp Schaefer

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
