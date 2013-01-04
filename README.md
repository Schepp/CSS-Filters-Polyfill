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

Have a look at [this overview](http://www.der-schepp.de/css-filters-polyfill/examples/static-vs-animated/static.html).

\* _the IEs only support 0% or 100% values_

##Supported Browsers##

Currently the polyfill is able to support

* Chrome 20+, 
* Safari 6+, 
* Yandex 1+,
* Firefox 4+ and 
* IE 6 - 9 on desktop (IE 6 & 7 slightly degraded), 

and 

* iOS 6+ Safari/Chrome 
* Firefox 4+ on Mobile (albeit slow) and
* IE on Windows Phone 7, which just supports grayscale.

Not supported are IE 10(!), Opera and Opera Mini, as well as Chrome on Android (they didn't turn on CSS filter effects there as of yet).

###A word regarding IE 10###

Why is IE 6 - 9 supported, but not IE 10? Well, since Microsoft decided to switch sides and to now follow standards, they killed their old proprietary filters in IE 10 which I rely on for emulation. On the other hand they introduced the real CSS filters, but those are limited to a usage inside SVGs. They cannot be applied to HTML-elements. 

Even triggering legacy mode does not help any more. So this is why we are left at the end with no hook/support at all in IE10 :(

###And what about Opera?###

Opera offers none of the hooks I could use to simulate CSS filter effects. So it is basically up to you people requesting support for CSS filter effects from Opera. But I might guess that you will remain unheard since Opera is very mobile and low-end device focused and filters hurt performance a lot. So it could take its fair amount of time to convince them.

Anyway, as far as I am concerned, I took care that once Opera supports filters, even when only prefixed, this polyfill will pick up support automagically.

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

###A note on stylesheet caching###

Since the polyfill needs to re-retrieve and parse every stylesheet again I implemented localStorage caching. Contents of stylesheets that have successfully been retrieved will get stored in localStorage. On the next reload of the page the polyfill will use the stylesheet from localStorage so that it renders quicker. When that is done it will retrieve the file and replace localStorage contents. That means that when you develop you would need to refresh twice to see any changes you made regarding filters. 

But to make your life easier I implemented a mechanism that looks on the hostname, and when it is "localhost" or when it uses the TLD ".local" or when it's an IP address it turns that caching off.

###Examples and Howtos###

See [http://www.der-schepp.de/css-filters-polyfill/examples/](http://www.der-schepp.de/css-filters-polyfill/examples/)

###License###

Copyright (c) 2012 Christian Schepp Schaefer

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
