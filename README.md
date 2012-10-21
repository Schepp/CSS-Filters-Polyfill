Polyfilter - a CSS Filters Polyfill
===================================

This polyfill takes the official CSS filters syntax and translates it to the different equivalent techniques that the browsers know for those effects:

* Just prefixing for the WebKit-Browsers
* Translating to SVG-filters for Firefox
* Translating to DirectX-filters for IE 6-9

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

\* _the IEs only support 0% or 100% values_

##Supported Browsers##

Currently the polyfill is able to support

* Chrome 20+, 
* Safari 6+, 
* Firefox 4+ and 
* IE 6 - 9 on desktop (IE 6 & 7 slightly degraded), 

and 

* iOS 6+ Safari/Chrome and 
* Firefox 4+ on Mobile
* IE on Windows Phone 7, which just supports grayscale.

Not supported are IE 10(!), Opera and Opera Mini, as well as Chrome on Android.

##Setup##

First create a `<script>` element in which you define the **absolute(!)** path to the polyfill library (the stuff in the /lib/ subfolder) in a variable named `polyfilter_scriptpath`, like so:  

```html
<script>  
	var polyfilter_scriptpath = '/css-filters-polyfill/lib/';  
</script>
```

This is important for the IEs.  
Then you link `cssParser.js` and `css-filters-polyfill.js` from the polyfill library. 

```html
<script src="/css-filters-polyfill/lib/cssParser.js"></script>
<script src="/css-filters-polyfill/lib/css-filters-polyfill.js"></script>
```

In an ideal world you should minify and concatenate both of them together with your other JavaScript. If you don't want your page to get blocked by script-loading you put the scripts way down before the closing `</body>`. This might lead to some flickering of the filter effects during loading. If you can't live with the short flickering, put the scripts in the `<head>` of the page. Then it'll be gone, but your page will load slower. Your call.

##Usage##

###Declarative assignment###

This polyfill supports filter declarations in embedded (`<style>`) and external (`<link rel="stylesheet">`) stylesheets. It does not support inline-styles (i.e. style-attributes).

There you define a filter by using the unprefixed W3C syntax, e.g.: 

```css
.element{
	filter: blur(10px);
}
```

###Programmatic assignment###

In addition the polyfill also extends the JavaScript CSSStyleDeclaration object, so that you can assign filter styles on the fly as you are used to with CSS. But instead of exposing a `element.style.filter` property as one would think, you instead need to address `element.style.polyfilter`, e.g.:

```javascript
element.style.polyfilter = 'blur(10px)';`
```

or via jQuery:

```javascript
$(element).css('polyfilter','blur(10px)');
```

_Note: This does not work for IE 6 & 7. They just ignore any programmatic assigment._

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

_Note: This again does not work for IE 6 & 7. They just ignore any programmatic assigment._

