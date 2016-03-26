define([
	"dojo/_base/lang", "dojo/dom", "dcl/dcl", "dojo/sniff", "dojo/dom-geometry", "dcolor/Color", "../_base", "./_base",
	"../shape/_ShapeBase", "./Surface"
], function (lang, dom, dcl, has, domGeom, Color, g, svg, ShapeBase, SvgSurface) {

	var clipCount = 0;

	return dcl(ShapeBase, {
		// summary:
		//		SVG-specific implementation of gfx/shape.Shape methods

		createRawNode: function () {
			// summary: Creates a new SVG shape.
			var node = svg._createElementNS(svg.xmlns.svg, this.constructor.nodeType);
			this.setRawNode(node);
			return node;
		},

		destroy: dcl.superCall(function (sup) {
			return function () {
				if (this.fill && "type" in this.fill) {
					var fill = this.rawNode.getAttribute("fill"), ref = svg.getRef(fill);
					if (ref) {
						ref.parentNode.removeChild(ref);
					}
				}
				if (this.clip) {
					var clipPathProp = this.rawNode.getAttribute("clip-path");
					if (clipPathProp) {
						var clipNode = dom.byId(clipPathProp.match(/gfx_clip[\d]+/)[0]);
						if (clipNode) {
							clipNode.parentNode.removeChild(clipNode);
						}
					}
				}
				sup.apply(this, arguments);
			};
		}),

		_setFillAttr: function (fill) {
			// summary:
			//		sets a fill object (SVG)
			// fill: Object
			//		a fill object
			//		(see gfx.defaultLinearGradient,
			//		gfx.defaultRadialGradient,
			//		gfx.defaultPattern,
			//		or dcolor/Color)

			if (!fill) {
				// don't fill
				this._set("fill", null);
				this.rawNode.setAttribute("fill", "none");
				this.rawNode.setAttribute("fill-opacity", 0);
				return this;
			}
			var f;
			// FIXME: slightly magical. We're using the outer scope's "f", but setting it later
			var setter = function (x) {
				// we assume that we're executing in the scope of the node to mutate
				this.setAttribute(x, f[x].toFixed(8));
			};
			if (typeof(fill) === "object" && "type" in fill) {
				// gradient
				switch (fill.type) {
				case "linear":
					f = g.makeParameters(g.defaultLinearGradient, fill);
					var gradient = this._setFillObject(f, "linearGradient");
					["x1", "y1", "x2", "y2"].forEach(setter, gradient);
					break;
				case "radial":
					f = g.makeParameters(g.defaultRadialGradient, fill);
					var grad = this._setFillObject(f, "radialGradient");
					["cx", "cy", "r"].forEach(setter, grad);
					break;
				case "pattern":
					f = g.makeParameters(g.defaultPattern, fill);
					var pattern = this._setFillObject(f, "pattern");
					["x", "y", "width", "height"].forEach(setter, pattern);
					break;
				}
				this._set("fill", f);
				return this;
			}
			// color object
			f = g.normalizeColor(fill);
			this._set("fill", f);
			this.rawNode.setAttribute("fill", f.toRgbaString());
			this.rawNode.setAttribute("fill-opacity", f.a);
			this.rawNode.setAttribute("fill-rule", "evenodd");
			return this;	// self
		},

		_setStrokeAttr: function (stroke) {
			// summary:
			//		sets a stroke object (SVG)
			// stroke: Object
			//		a stroke object (see gfx.defaultStroke)

			/* jshint maxcomplexity:14 */
			var rn = this.rawNode;
			if (!stroke) {
				// don't stroke
				this._set("stroke", null);
				rn.setAttribute("stroke", "none");
				rn.setAttribute("stroke-opacity", 0);
				return this;
			}
			// normalize the stroke
			if (typeof stroke === "string" || lang.isArray(stroke) || stroke instanceof Color) {
				stroke = { color: stroke };
			}
			var s = g.makeParameters(g.defaultStroke, stroke);
			s.color = g.normalizeColor(s.color);
			this._set("stroke", s);
			// generate attributes
			if (s) {
				rn.setAttribute("stroke", s.color.toRgbaString());
				rn.setAttribute("stroke-opacity", s.color.a);
				rn.setAttribute("stroke-width", s.width);
				rn.setAttribute("stroke-linecap", s.cap);
				if (typeof s.join === "number") {
					rn.setAttribute("stroke-linejoin", "miter");
					rn.setAttribute("stroke-miterlimit", s.join);
				} else {
					rn.setAttribute("stroke-linejoin", s.join);
				}
				var da = s.style.toLowerCase();
				if (da in svg.dasharray) {
					da = svg.dasharray[da];
				}
				if (da instanceof Array) {
					da = lang._toArray(da);
					var i;
					for (i = 0; i < da.length; ++i) {
						da[i] *= s.width;
					}
					if (s.cap !== "butt") {
						for (i = 0; i < da.length; i += 2) {
							da[i] -= s.width;
							if (da[i] < 1) {
								da[i] = 1;
							}
						}
						for (i = 1; i < da.length; i += 2) {
							da[i] += s.width;
						}
					}
					da = da.join(",");
				}
				rn.setAttribute("stroke-dasharray", da);
			}
			return this;	// self
		},

		_getParentSurface: function () {
			var surface = this.parent;
			for (; surface && !(surface instanceof SvgSurface); surface = surface.parent) {
			}
			return surface;
		},

		_setFillObject: function (f, nodeType) {
			var svgns = svg.xmlns.svg;
			this._set("fill", f);
			var surface = this._getParentSurface(), defs = surface &&
				surface.defNode, fill = this.rawNode.getAttribute("fill"), ref = svg.getRef(fill);
			if (ref) {
				fill = ref;
				if (fill.tagName.toLowerCase() !== nodeType.toLowerCase()) {
					var id = fill.id;
					fill.parentNode.removeChild(fill);
					fill = svg._createElementNS(svgns, nodeType);
					fill.setAttribute("id", id);
					if (defs) {
						defs.appendChild(fill);
					} else {
						this._pendingFill = fill;
					}
				} else {
					while (fill.childNodes.length) {
						fill.removeChild(fill.lastChild);
					}
				}
			} else {
				fill = svg._createElementNS(svgns, nodeType);
				fill.setAttribute("id", g._getUniqueId());
				if (defs) {
					defs.appendChild(fill);
				} else {
					this._pendingFill = fill;
				}
			}
			if (nodeType === "pattern") {
				fill.setAttribute("patternUnits", "userSpaceOnUse");
				var img = svg._createElementNS(svgns, "image");
				img.setAttribute("x", 0);
				img.setAttribute("y", 0);
				img.setAttribute("width", f.width.toFixed(8));
				img.setAttribute("height", f.height.toFixed(8));
				svg._setAttributeNS(img, svg.xmlns.xlink, "xlink:href", f.src);
				fill.appendChild(img);
			} else {
				fill.setAttribute("gradientUnits", "userSpaceOnUse");
				for (var i = 0; i < f.colors.length; ++i) {
					var c = f.colors[i], t = svg._createElementNS(svgns, "stop"), cc = c.color =
						g.normalizeColor(c.color);
					t.setAttribute("offset", c.offset.toFixed(8));
					t.setAttribute("stop-color", cc.toRgbaString());
					t.setAttribute("stop-opacity", cc.a);
					fill.appendChild(t);
				}
			}
			this.rawNode.setAttribute("fill", "url(#" + fill.getAttribute("id") + ")");
			this.rawNode.removeAttribute("fill-opacity");
			this.rawNode.setAttribute("fill-rule", "evenodd");
			return fill;
		},

		_setParent: dcl.superCall(function (sup) {
			return function () {
				sup.apply(this, arguments);
				if (this._pendingFill) {
					var surface = this._getParentSurface();
					if (surface) {
						surface.defNode.appendChild(this._pendingFill);
						this._pendingFill = null;
					}
				}
			};
		}),

		_applyTransform: function () {
			var matrix = this.transform;
			if (matrix) {
				var tm = this.transform;
				this.rawNode.setAttribute("transform",
					"matrix(" + tm.xx.toFixed(8) + "," + tm.yx.toFixed(8) + "," + tm.xy.toFixed(8) + "," +
						tm.yy.toFixed(8) + "," + tm.dx.toFixed(8) + "," + tm.dy.toFixed(8) + ")");
			} else {
				this.rawNode.removeAttribute("transform");
			}
			return this;
		},

		setRawNode: function (rawNode) {
			// summary:
			//		assigns and clears the underlying node that will represent this
			//		shape. Once set, transforms, gradients, etc, can be applied.
			//		(no fill & stroke by default)
			var r = this.rawNode = rawNode;
			if (this.shape.type !== "image") {
				r.setAttribute("fill", "none");
			}
			r.setAttribute("fill-opacity", 0);
			r.setAttribute("stroke", "none");
			r.setAttribute("stroke-opacity", 0);
			r.setAttribute("stroke-width", 1);
			r.setAttribute("stroke-linecap", "butt");
			r.setAttribute("stroke-linejoin", "miter");
			r.setAttribute("stroke-miterlimit", 4);
			// Bind GFX object with SVG node for ease of retrieval - that is to
			// save code/performance to keep this association elsewhere
			r._gfxObject = this;
		},

		_setShapeAttr: function (newShape) {
			// summary:
			//		sets a shape object (SVG)
			// newShape: Object
			//		a shape object
			//		(see gfx.defaultPath,
			//		gfx.defaultPolyline,
			//		gfx.defaultRect,
			//		gfx.defaultEllipse,
			//		gfx.defaultCircle,
			//		gfx.defaultLine,
			//		or gfx.defaultImage)
			this._set("shape", g.makeParameters(this.shape, newShape));
			for (var i in this.shape) {
				if (i !== "type") {
					this.rawNode.setAttribute(i, this.shape[i]);
				}
			}
			this.bbox = null;
			return this;	// self
		},

		// move family

		_moveToFront: function () {
			// summary:
			//		moves a shape to front of its parent's list of shapes (SVG)
			this.rawNode.parentNode.appendChild(this.rawNode);
			return this;	// self
		},
		_moveToBack: function () {
			// summary:
			//		moves a shape to back of its parent's list of shapes (SVG)
			this.rawNode.parentNode.insertBefore(this.rawNode, this.rawNode.parentNode.firstChild);
			return this;	// self
		},
		_setClipAttr: dcl.superCall(function (sup) {
			return function (clip) {
				// summary:
				//		sets the clipping area of this shape.
				// description:
				//		This method overrides the gfx/shape/Shape._setClipAttr() method.
				// clip: Object
				//		an object that defines the clipping geometry, or null to remove clip.
				/* jshint maxcomplexity:14 */
				sup.apply(this, arguments);
				var clipType = clip ? "width" in clip ? "rect" :
					"cx" in clip ? "ellipse" : "points" in clip ? "polyline" : "d" in clip ? "path" : null : null;
				if (clip && !clipType) {
					return;
				}
				if (clipType === "polyline") {
					clip = lang.clone(clip);
					clip.points = clip.points.join(",");
				}
				var clipNode, clipShape, clipPathProp = this.rawNode.getAttribute("clip-path");
				if (clipPathProp) {
					clipNode = dom.byId(clipPathProp.match(/gfx_clip[\d]+/)[0]);
					if (clipNode) { // may be null if not in the DOM anymore
						clipNode.removeChild(clipNode.childNodes[0]);
					}
				}
				if (clip) {
					if (clipNode) {
						clipShape = svg._createElementNS(svg.xmlns.svg, clipType);
						clipNode.appendChild(clipShape);
					} else {
						var idIndex = ++clipCount;
						var clipId = "gfx_clip" + idIndex;
						var clipUrl = "url(#" + clipId + ")";
						this.rawNode.setAttribute("clip-path", clipUrl);
						clipNode = svg._createElementNS(svg.xmlns.svg, "clipPath");
						clipShape = svg._createElementNS(svg.xmlns.svg, clipType);
						clipNode.appendChild(clipShape);
						this.rawNode.parentNode.insertBefore(clipNode, this.rawNode);
						clipNode.setAttribute("id", clipId);
					}
					for (var p in clip) {
						clipShape.setAttribute(p, clip[p]);
					}
				} else {
					//remove clip-path
					this.rawNode.removeAttribute("clip-path");
					if (clipNode) {
						clipNode.parentNode.removeChild(clipNode);
					}
				}
			};
		}),
		_removeClipNode: function () {
			var clipNode, clipPathProp = this.rawNode.getAttribute("clip-path");
			if (clipPathProp) {
				clipNode = dom.byId(clipPathProp.match(/gfx_clip[\d]+/)[0]);
				if (clipNode) {
					clipNode.parentNode.removeChild(clipNode);
				}
			}
			return clipNode;
		},

		// Mouse/Touch event
		_fixTarget: function (event/*===== , gfxElement =====*/) {
			// summary:
			//		Adds the gfxElement to event.gfxTarget if none exists. This new
			//		property will carry the GFX element associated with this event.
			// event: Object
			//		The current input event (MouseEvent or TouchEvent)
			// gfxElement: Object
			//		The GFX target element
			if (!event.gfxTarget) {
				if (has("ios") && event.target.wholeText) {
					// Workaround iOS bug when touching text nodes
					event.gfxTarget = event.target.parentElement._gfxObject;
				} else {
					event.gfxTarget = event.target._gfxObject;
				}
			}
			return true;
		},

		addRenderingOption: function (/*String*/option, /*String*/value) {
			// summary:
			//		Adds the specified SVG rendering option on this shape.
			// option: String
			//		The name of the rendering option to add to this shape, as specified by the
			//		SVG specification (http://www.w3.org/TR/SVG/painting.html#RenderingProperties)
			// value: String
			//		the option value.
			this.rawNode.setAttribute(option, value);
			return this; // self
		},

		// filter: Object
		//		An SVG filter to apply to this shape. See gfx/svg/filters.
		filter: null,

		_setFilterAttr: function (/*gfx/svg/__FilterArgs*/filter) {
			// summary:
			//		Sets the specified SVG Filter on this shape.
			// filter: gfx/svg/__FilterArgs
			//		An object that defines the filter properties. Note that in order to make the creation of such
			//		filter easier, the gfx/filters module defines both a simple API to easily create filter objects
			//		and also a set of predefined filters like drop shadows, blurs, textures effects (among others).
			// example:
			//		Sets a drop shadow filter:
			//	|	var filter = {
			//	|		"id": "fastSmallDropShadow",
			//	|		"x": "-10%",
			//	|		"y": "-10%",
			//	|		"width": "125%",
			//	|		"height": "125%",
			//	|		"primitives": [{
			//	|			"tag": "feColorMatrix",
			//	|			"in": "SourceAlpha",
			//	|			"type": "matrix",
			//	|			"result": "grey",
			//	| "values": "0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0,0,0,0.7,0"
			//	|		},{
			//	|			"tag": "feOffset",
			//	|			"dx": 3,
			//	|			"dy": 3,
			//	|			"result": "offsetBlur"
			//	|		},{
			//	|			"tag": "feMerge",
			//	|			"in": "offsetBlur",
			//	|			"in2": "SourceGraphic"
			//	|		}]
			//	|	};
			//	|	var shape = surface.createRect().setFilter(filter);
			//
			// example:
			//		Sets a predefined filter from the gfx/filters module:
			//	|	require(["gfx/filters",...], function(filters){
			//	|		...
			//	|		var filter = filters.textures.paper({"id":"myFilter","x":0,"y":0,"width":100,"height":100});
			//	|		var shape = surface.createRect().filter = filter;

			this._set("filter", filter);
			if (filter) {
				filter._apply(this);
			} else {
				this.rawNode.removeAttribute("filter");
			}
			return this;
		},

		// mask: gfx/svg/Mask
		//		An SVG mask to apply to this shape. See gfx/svg/Mask.
		mask: null,

		_setMaskAttr: function (/*gfx/svg/Mask*/mask) {
			// summary:
			//		Sets a mask object (SVG)
			// mask:
			//		The mask object

			var rawNode = this.rawNode;
			if (mask) {
				rawNode.setAttribute("mask", "url(#" + mask.shape.id + ")");
				this._set("mask", mask);
			} else {
				rawNode.removeAttribute("mask");
				this._set("mask", null);
			}

			return this;
		}
	});
});
