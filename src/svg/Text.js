define([
	"dcl/dcl", "dojo/_base/sniff", "../_base", "./_base", "./Shape", "../shape/_TextBase", "./Font",
	"dojo/has!dojo-bidi?./bidi/Text"
], function (dcl, has, g, svg, SvgShape, TextBase, Font, SvgBidiText) {
	var android = has("android"), textRenderingFix = has("chrome") || (android && android >= 4) ? "auto" :
		"optimizeLegibility";// #16099, #16461

	var Text = dcl([SvgShape, TextBase, Font], {
		// summary:
		//		an anchored text (SVG)
		_setShapeAttr: function (newShape) {
			// summary:
			//		sets a text shape object (SVG)
			// newShape: Object
			//		a text shape object
			this._set("shape", g.makeParameters(this._get("shape"), newShape));
			this.bbox = null;
			var r = this.rawNode, s = this._get("shape");
			r.setAttribute("x", s.x);
			r.setAttribute("y", s.y);
			r.setAttribute("text-anchor", s.align);
			r.setAttribute("text-decoration", s.decoration);
			r.setAttribute("rotate", s.rotated ? 90 : 0);
			r.setAttribute("kerning", s.kerning ? "auto" : 0);
			r.setAttribute("text-rendering", textRenderingFix);

			// update the text content
			if (r.firstChild) {
				r.firstChild.nodeValue = s.text;
			} else {
				r.appendChild(svg._createTextNode(s.text));
			}
			return this;	// self
		},
		getTextWidth: function () {
			// summary:
			//		get the text width in pixels
			var rawNode = this.rawNode, oldParent = rawNode.parentNode, _measurementNode = rawNode.cloneNode(true);
			_measurementNode.style.visibility = "hidden";

			// solution to the "orphan issue" in FF
			var _width = 0, _text = _measurementNode.firstChild.nodeValue;
			oldParent.appendChild(_measurementNode);

			// solution to the "orphan issue" in Opera
			// (nodeValue === "" hangs firefox)
			if (_text !== "") {
				while (!_width) {
					_width = parseInt(_measurementNode.getBBox().width, 10);
				}
			}
			oldParent.removeChild(_measurementNode);
			return _width;
		},
		getBoundingBox: function () {
			var s = this.shape, bbox = null;
			if (s.text) {
				// try/catch the FF native getBBox error.
				try {
					bbox = this.rawNode.getBBox();
				} catch (e) {
					// under FF when the node is orphan (all other browsers return a 0ed bbox.
					bbox = {x: 0, y: 0, width: 0, height: 0};
				}
			}
			return bbox;
		}
	});
	if (has("dojo-bidi")) {
		Text = dcl([Text, SvgBidiText], {});
	}

	Text.nodeType = "text";
	return Text;
});
