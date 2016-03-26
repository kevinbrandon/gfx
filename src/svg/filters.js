define([
	"dcl/dcl", "dojo/_base/lang", "dojo/dom", "../_base", "./_base"
], function (dcl, lang, dom, g, svg) {

	var filters = {
		// summary:
		//		A module that defines a minimal API to create SVG filter definition objects to be used with the
		//		gfx/svg/Shape.filter property, as well as a set of predefined filters.
		// description:
		//		The module defines the following API:
		//		- filters.createFilter(config, primitives) : Creates a filter object from the specified config and the
		//		given filter primitives.
		//		- a set of methods to create SVG filter primitives, based on the same
		//		naming as the specification (e.g. filters.feGaussianBlur() ). A filter primitive method has the
		//		following signature (taking feGaussianBlur as an example):
		//			filters.feGaussianBlur(properties, children?)
		//			filters.feGaussianBlur(children)
		//		The "properties" parameter must define the primitive attributes as defined by the specification.
		//		The "children" array parameter is an array of child filter primitives.
		//		In addition to this API, the module provides the following predefined filters:
		//		- filters.convolutions.boxBlur3,
		//		- filters.convolutions.boxBlur5,
		//		- filters.convolutions.verticalEdges,
		//		- filters.convolutions.horizontalEdges,
		//		- filters.convolutions.allEdges3,
		//		- filters.convolutions.edgeEnhance,
		//		- filters.shadows.fastSmallDropShadow,
		//		- filters.shadows.fastDropShadow,
		//		- filters.shadows.fastDropShadowLight,
		//		- filters.shadows.dropShadow,
		//		- filters.shadows.dropShadowLight,
		//		- filters.shadows.smallDropShadow,
		//		- filters.shadows.smallDropShadowLight,
		//		- filters.blurs.blur1,
		//		- filters.blurs.blur2,
		//		- filters.blurs.blur4,
		//		- filters.blurs.blur8,
		//		- filters.blurs.glow,
		//		- filters.colors.negate,
		//		- filters.colors.sepia,
		//		- filters.colors.grayscale,
		//		- filters.colors.showRed,
		//		- filters.colors.showGreen,
		//		- filters.colors.showBlue,
		//		- filters.colors.hueRotate60,
		//		- filters.colors.hueRotate120,
		//		- filters.colors.hueRotate180,
		//		- filters.colors.hueRotate270,
		//		- filters.miscs.thinEmbossDropShadow,
		//		- filters.miscs.embossDropShadow,
		//		- filters.miscs.largeEmbossDropShadow,
		//		- filters.miscs.thinEmbossDropShadowLight,
		//		- filters.miscs.embossDropShadowLight,
		//		- filters.miscs.largeEmbossDropShadowLight,
		//		- filters.miscs.fuzzy,
		//		- filters.miscs.veryFuzzy,
		//		- filters.miscs.melting,
		//		- filters.miscs.impressionist,
		//		- filters.miscs.holes,
		//		- filters.miscs.holesComplement,
		//		- filters.reliefs.bumpIn,
		//		- filters.reliefs.bumpOut,
		//		- filters.reliefs.thinEmboss,
		//		- filters.reliefs.emboss,
		//		- filters.reliefs.largeEmboss,
		//		- filters.textures.paper,
		//		- filters.textures.swirl,
		//		- filters.textures.swirl2,
		//		- filters.textures.gold
		//		Note: the gfx/tests/unit/filters.js test shows the rendering of all the predefined filters.
	}, defaultFilterBBox = {x: "0%", y: "0%", width: "100%", height: "100%"}, lib = {};

	/*=====
	 dcl(null, {
	 // summary:
	 //		Represents an SVG filter primitive.
	 // description:
	 //		In addition to the following properties, a FilterPrimitiveArgs should define the properties specific to
	 //		this primitive, as defined by the SVG spec.
	 // example:
	 //		Define a simple feGaussianBlur primitive:
	 //	|	var blurPrimitive = {
	 //	|		"tag": "feGaussianBlur",
	 //	|		"in": "SourceAlpha",
	 //	|		"stdDeviation":"4",
	 //	|		"result":"blur"
	 //	|	};
	 //
	 // example:
	 //		Define a feSpecularLighting primitive with one fePointLight child
	 //	|	var lighting = {
	 //	|		"tag": "feSpecularLighting",
	 //	|		"in":"blur",
	 //	|		"surfaceScale":5,
	 //	|		"specularConstant":.75,
	 //	|		"specularExponent":20,
	 //	|		"lighting-color":"#bbbbbb",
	 //	|		"result":"specOut"
	 //	|		"children": [
	 //	|			"tag": "fePointLight"
	 //	|			"x":-5000,
	 //	|			"y":-10000,
	 //	|			"z":20000
	 //	|		]
	 //	|	};

	 declaredClass: "gfx/svg/__FilterPrimitiveArgs",

	 // tag: String?
	 //		The type of the primitive, as specified by the SVG spec (http://www.w3.org/TR/SVG/filters.html)
	 tag: null,

	 // children: gfx/svg/__FilterPrimitiveArgs[]?
	 //		An array of child primitives, if any.
	 children: null
	 });
	 =====*/


	/*=====
	 dcl(null, {
	 // summary:
	 //		The filter arguments passed to the gfx/svg/Shape.setFilter method.
	 // description:
	 //		An object defining the properties of a SVG Filter.
	 // example:
	 //		Define a drop shadow filter:
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
	 //	|		"values": "0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0,0,0,0.7,0"
	 //	|		},{
	 //	|			"tag": "feOffset",
	 //	|			"dx": 3,
	 //	|			"dy": 3,
	 //	|			"result": "offsetBlur"
	 //	|		},{
	 //	|			"tag": "feMerge",
	 //	|			"children":[{
	 //	|				"tag": "feMergeNode",
	 //	|				"in": "offsetBlur"
	 //	|			},{
	 //	|				"tag": "feMergeNode",
	 //	|				"in": "SourceGraphic"
	 //	|			}]
	 //	|		}]
	 //	|	};

	 declaredClass: "gfx/svg/__FilterArgs",

	 // id: String?
	 //		The filter identifier. If none is provided, a generated id will be used.
	 id: null,

	 // filterUnits: String?
	 //		The coordinate system of the filter. Default is "userSpaceOnUse".
	 filterUnits: "userSpaceOnUse",

	 // primitives: gfx/svg/__FilterPrimitiveArgs[]
	 //		An array of filter primitives that define this filter.
	 primitives: []
	 });
	 =====*/

	var toIgnore = {
		primitives: null,
		tag: null,
		children: null
	};

	function buildFilterPrimitivesDOM(primitive, parentNode) {
		var node = parentNode.ownerDocument.createElementNS(svg.xmlns.svg, primitive.tag);
		parentNode.appendChild(node);
		for (var p in primitive) {
			if (!(p in toIgnore)) {
				node.setAttribute(p, primitive[p]);
			}
		}
		if (primitive.children) {
			primitive.children.forEach(function (f) {
				buildFilterPrimitivesDOM(f, node);
			});
		}
		return node;
	}

	function apply(shape)
	{
		this.id = this.id || g._getUniqueId();
		var filterNode = dom.byId(this.id);
		if (!filterNode) {
			filterNode = shape.rawNode.ownerDocument.createElementNS(svg.xmlns.svg, "filter");
			filterNode.setAttribute("filterUnits", "userSpaceOnUse");
			for (var p in this) {
				if (!(p in toIgnore)) {
					filterNode.setAttribute(p, this[p]);
				}
			}
			this.primitives.forEach(function (p) {
				buildFilterPrimitivesDOM(p, filterNode);
			});
			var surface = shape._getParentSurface();
			if (surface) {
				var defs = surface.defNode;
				defs.appendChild(filterNode);
			}
		}
		shape.rawNode.setAttribute("filter", "url(#" + this.id + ")");
	}

	//
	// A minimal facade API to create primitives
	//

	filters.createFilter = function (/*Object*/args, /*Array*/primitives) {
		// summary:
		//		Creates a filter with the specified primitives.
		// description:
		//		This function creates a new filter object configured with the optional 'args' parameter, and
		//		adds the filter primitives specified in the 'primitives' array'. The gfx/filters module
		//		provides convenient methods to create the corresponding SVG filter primitives, based on the same
		//		naming as the specification (e.g. filters.feGaussianBlur() ).
		//		A filter primitive method follows the following signature (taking feGaussianBlur as an example):
		//			filters.feGaussianBlur(/*Object*/properties, /*Array?*/children)
		//			filters.feGaussianBlur(/*Array?*/children)
		//		The "properties" parameter must define the primitive attributes as defined by the specification.
		//		The optional "children" array parameter is an array of child filter primitives.
		// args: Object
		//		The configuration object for the filter.
		// primitives: Array
		//		An array of primitives object.

		var filter = {};
		dcl.mix(filter, defaultFilterBBox);
		dcl.mix(filter, args);
		if (!filter.primitives) {
			filter.primitives = [];
		}
		if (primitives) {
			Array.prototype.push.apply(filter.primitives, primitives);
		}
		// export apply method so all filter-related in here
		filter._apply = apply;
		return filter;
		/*Object*/
	};

	var _createFePrimitive = function (tag, args, children) {
		if (args instanceof Array) {
			children = args;
			args = null;
		}
		var fe = {};
		dcl.mix(fe, args);
		fe.children = children;
		fe.tag = tag;
		return fe;
	};
	var _createFeMerge = function (args, children) {
		if (typeof args === "string") {
			// list of primitives to merge via the 'in' property
			var toMerge = [];
			for (var i = 0; i < arguments.length; ++i) {
				toMerge.push(filters.feMergeNode({"in": arguments[i]}));
			}
			return _createFePrimitive("feMerge", {}, toMerge);
		}
		return _createFePrimitive("feMerge", args, children);
	};

	[
		"feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting",
		"feDisplacementMap", "feFlood", "feGaussianBlur", "feImage", "feMorphology", "feOffset", "feSpecularLighting",
		"feTile", "feTurbulence", "feDistantLight", "fePointLight", "feSpotLight", "feMergeNode", "feFuncA", "feFuncR",
		"feFuncG", "feFuncB"
	].forEach(function (fe) {
			filters[fe] = function (args, children) {
				return _createFePrimitive(fe, args, children);
			};
		});
	// special case for feMarge to ease syntax
	filters.feMerge = _createFeMerge;


	var createFilter = filters.createFilter;

	//
	// Convolution-based filters
	//
	lib.convolutions = [
		createFilter({_gfxName: "boxBlur3"}, [
			filters.feConvolveMatrix({
				"in": "SourceGraphic",
				"order": 3,
				"divisor": 9,
				"kernelMatrix": "1,1,1,1,1,1,1,1,1"
			})
		]), createFilter({_gfxName: "boxBlur5"}, [
			filters.feConvolveMatrix({
				"in": "SourceGraphic",
				"order": 5,
				"divisor": 25,
				"kernelMatrix": "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1"
			})
		]), createFilter({_gfxName: "verticalEdges", filterUnits: "objectBoundingBox"}, [
			filters.feConvolveMatrix({
				"in": "SourceGraphic",
				"result": "kernel",
				"order": 3,
				"divisor": 1,
				"kernelMatrix": "-1 0 1 -1 0 1 -1 0 1"
			}), filters.feComponentTransfer({
				"in": "kernel"
			}, [
				filters.feFuncA({"type": "table", "tableValues": "1,1"})
			])
		]), createFilter({_gfxName: "horizontalEdges", filterUnits: "objectBoundingBox"}, [
			filters.feConvolveMatrix({
				"in": "SourceGraphic",
				"result": "kernel",
				"order": 3,
				"divisor": 1,
				"kernelMatrix": "1 1 1 0 0 0 -1 -1 -1"
			}), filters.feComponentTransfer({
				"in": "kernel"
			}, [
				filters.feFuncA({"type": "table", "tableValues": "1,1"})
			])
		]), createFilter({_gfxName: "allEdges3", filterUnits: "objectBoundingBox"}, [
			filters.feConvolveMatrix({
				"in": "SourceGraphic",
				"result": "kernel",
				"order": 3,
				"divisor": 1,
				"kernelMatrix": "-1 -1 -1 -1 8 -1 -1 -1 -1"
			}), filters.feComponentTransfer({
				"in": "kernel"
			}, [
				filters.feFuncA({"type": "table", "tableValues": "1,1"})
			])
		]), createFilter({_gfxName: "edgeEnhance", filterUnits: "objectBoundingBox"}, [
			filters.feConvolveMatrix({
				"in": "SourceGraphic",
				"result": "kernel",
				"order": 3,
				"divisor": -1,
				"kernelMatrix": "0 1 0 1 -5 1 0 1 0"
			}), filters.feComponentTransfer({
				"in": "kernel"
			}, [
				filters.feFuncA({"type": "table", "tableValues": "1,1"})
			])
		])
	];
	lib.convolutions.forEach(function (f) {
		dcl.mix(f, defaultFilterBBox);
	});

	//
	// Drop Shadow filters
	//
	lib.shadows = [
		createFilter({_gfxName: "fastSmallDropShadow"}, [
			filters.feColorMatrix({
				"in": "SourceAlpha",
				"type": "matrix",
				"result": "grey",
				"values": "0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0,0,0,0.7,0"
			}), filters.feOffset({"dx": 3, "dy": 3, "result": "offsetBlur"}),
			filters.feMerge("offsetBlur", "SourceGraphic")
		]), createFilter({_gfxName: "fastDropShadow"}, [
			filters.feColorMatrix({
				"in": "SourceAlpha",
				"type": "matrix",
				"result": "grey",
				"values": "0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0,0,0,0.7,0"
			}), filters.feOffset({"dx": 5, "dy": 5, "result": "offsetBlur"}),
			filters.feMerge("offsetBlur", "SourceGraphic")
		]), createFilter({_gfxName: "fastDropShadowLight"}, [
			filters.feColorMatrix({
				"in": "SourceAlpha",
				"type": "matrix",
				"result": "grey",
				"values": "0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0,0,0,0.4,0"
			}), filters.feOffset({"dx": 5, "dy": 5, "result": "offsetBlur"}),
			filters.feMerge("offsetBlur", "SourceGraphic")
		]), createFilter({_gfxName: "dropShadow"}, [
			filters.feGaussianBlur({"in": "SourceAlpha", "stdDeviation": 4}),
			filters.feOffset({"dx": 5, "dy": 5, "result": "offsetBlur"}), filters.feMerge("offsetBlur", "SourceGraphic")
		]), createFilter({_gfxName: "dropShadowLight"}, [
			filters.feGaussianBlur({"in": "SourceAlpha", "stdDeviation": 4, "result": "blur"}),
			filters.feComponentTransfer({
				"in": "blur",
				"result": "lessblur"
			}, [
				filters.feFuncA({"type": "linear", "slope": 0.5})
			]), filters.feOffset({"in": "lessblur", "dx": 5, "dy": 5, "result": "offsetBlur"}),
			filters.feMerge("offsetBlur", "SourceGraphic")
		]), createFilter({_gfxName: "smallDropShadow"}, [
			filters.feGaussianBlur({"in": "SourceAlpha", "stdDeviation": 3}),
			filters.feOffset({"dx": 2, "dy": 2, "result": "offsetBlur"}), filters.feMerge("offsetBlur", "SourceGraphic")
		]), createFilter({_gfxName: "smallDropShadowLight"}, [
			filters.feGaussianBlur({"in": "SourceAlpha", "stdDeviation": 3, "result": "blur"}),
			filters.feComponentTransfer({
				"in": "blur",
				"result": "lessblur"
			}, [
				filters.feFuncA({"type": "linear", "slope": 0.5})
			]), filters.feOffset({"in": "lessblur", "dx": 2, "dy": 2, "result": "offsetBlur"}),
			filters.feMerge("offsetBlur", "SourceGraphic")
		])
	];
	var defaultDropShadowBBox = {
		x: "-10%",
		y: "-10%",
		width: "125%",
		height: "125%"
	};
	lib.shadows.forEach(function (f) {
		dcl.mix(f, defaultDropShadowBBox);
	});

	//
	// Blur effects
	//
	lib.blurs = [
		createFilter({
			_gfxName: "blur1",
			x: "-5%",
			y: "-5%",
			width: "110%",
			height: "110%"
		}, [
			filters.feGaussianBlur({"in": "SourceGraphic", stdDeviation: 1})
		]), createFilter({
			_gfxName: "blur2",
			x: "-15%",
			y: "-15%",
			width: "130%",
			height: "130%"
		}, [
			filters.feGaussianBlur({"in": "SourceGraphic", "stdDeviation": 2})
		]), createFilter({
			_gfxName: "blur4",
			x: "-15%",
			y: "-15%",
			width: "130%",
			height: "130%"
		}, [
			filters.feGaussianBlur({"in": "SourceGraphic", "stdDeviation": 4})
		]), createFilter({
			_gfxName: "blur8",
			x: "-20%",
			y: "-20%",
			width: "140%",
			height: "140%"
		}, [
			filters.feGaussianBlur({"in": "SourceGraphic", "stdDeviation": 8})
		]), createFilter({
			_gfxName: "glow",
			x: "-10%",
			y: "-10%",
			width: "120%",
			height: "120%"
		}, [
			filters.feGaussianBlur({"in": "SourceGraphic", "stdDeviation": 2}), filters.feComponentTransfer([
				filters.feFuncA({"type": "linear", "slope": 10})
			])
		])
	];

	//
	// Colors filters
	//
	lib.colors = [
		createFilter({_gfxName: "negate"}, [
			filters.feComponentTransfer([
				filters.feFuncR({"type": "table", "tableValues": "1,0"}),
				filters.feFuncG({"type": "table", "tableValues": "1,0"}),
				filters.feFuncB({"type": "table", "tableValues": "1,0"})
			])
		]), createFilter({_gfxName: "sepia"}, [
			filters.feColorMatrix({
				"result": "grey",
				"values": "0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0,0,0,1,0"
			}), filters.feComponentTransfer({
				"in": "grey"
			}, [
				filters.feFuncR({"type": "linear", "slope": 0.5, "intercept": 0.5}),
				filters.feFuncB({"type": "table", "tableValues": "0,0"})
			])
		]), createFilter({_gfxName: "grayscale"}, [
			filters.feColorMatrix({
				"values": "0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0.2125,0.7154,0.0721,0,0,0,0,0,1,0"
			})
		]), createFilter({_gfxName: "showRed"}, [
			filters.feComponentTransfer([
				filters.feFuncG({"type": "table", "tableValues": "0,0"}),
				filters.feFuncB({"type": "table", "tableValues": "0,0"})
			])
		]), createFilter({_gfxName: "showGreen"}, [
			filters.feComponentTransfer([
				filters.feFuncR({"type": "table", "tableValues": "0,0"}),
				filters.feFuncB({"type": "table", "tableValues": "0,0"})
			])
		]), createFilter({_gfxName: "showBlue"}, [
			filters.feComponentTransfer([
				filters.feFuncR({"type": "table", "tableValues": "0,0"}),
				filters.feFuncG({"type": "table", "tableValues": "0,0"})
			])
		]), createFilter({_gfxName: "hueRotate60"}, [
			filters.feColorMatrix({"type": "hueRotate", "values": 60})
		]), createFilter({_gfxName: "hueRotate120"}, [
			filters.feColorMatrix({"type": "hueRotate", "values": 120})
		]), createFilter({_gfxName: "hueRotate180"}, [
			filters.feColorMatrix({"type": "hueRotate", "values": 180})
		]), createFilter({_gfxName: "hueRotate270"}, [
			filters.feColorMatrix({"type": "hueRotate", "values": 270})
		])
	];
	lib.colors.forEach(function (f) {
		dcl.mix(f, defaultFilterBBox);
	});

	lib.miscs = [
		createFilter({
			_gfxName: "thinEmbossDropShadow",
			x: "-5%",
			y: "-5%",
			width: "120%",
			height: "120%"
		}, [
			filters.feGaussianBlur({"in": "SourceAlpha", "stdDeviation": 1, "result": "blur"}),
			filters.feOffset({"in": "blur", dx: 6, dy: 6, "result": "offsetBlur"}), filters.feSpecularLighting({
				"in": "blur",
				"surfaceScale": 8,
				"specularConstant": 1,
				"specularExponent": 12,
				"result": "specOut"
			}, [
				filters.fePointLight({x: "-5000", y: "-10000", z: "12000"})
			]), filters.feComposite({"in": "specOut", "in2": "SourceAlpha", "operator": "in", "result": "specOut"}),
			filters.feComposite({
				"in": "SourceGraphic",
				"in2": "specOut",
				"operator": "arithmetic",
				"result": "litPaint",
				"k1": 0,
				"k2": 1,
				"k3": 1,
				"k4": 0
			}), filters.feMerge("offsetBlur", "litPaint")
		]), createFilter({
			_gfxName: "embossDropShadow",
			x: "-5%",
			y: "-5%",
			width: "120%",
			height: "120%"
		}, [
			filters.feGaussianBlur({"in": "SourceAlpha", "stdDeviation": "4", "result": "blur"}),
			filters.feOffset({"in": "blur", "dx": 4, "dy": 4, "result": "offsetBlur"}), filters.feSpecularLighting({
				"in": "blur",
				"surfaceScale": 5,
				"specularConstant": 0.75,
				"specularExponent": 20,
				"lighting-color": "#bbbbbb",
				"result": "specOut"
			}, [filters.fePointLight({x: -5000, y: -10000, z: 20000})]),
			filters.feComposite({
				"in": "specOut",
				"in2": "SourceAlpha",
				"operator": "in",
				"result": "specOut"
			}),
			filters.feComposite({
				"in": "SourceGraphic",
				"in2": "specOut",
				"operator": "arithmetic",
				k1: 0,
				k2: 1,
				k3: 1,
				k4: 0,
				"result": "litPaint"
			}), filters.feMerge("offsetBlur", "litPaint")
		]), createFilter({
			_gfxName: "largeEmbossDropShadow",
			x: "-20%",
			y: "-20%",
			width: "140%",
			height: "140%"
		}, [
			filters.feGaussianBlur({"in": "SourceAlpha", "stdDeviation": 5, "result": "blur"}),
			filters.feOffset({"in": "blur", dx: 6, dy: 6, "result": "offsetBlur"}), filters.feSpecularLighting({
				"in": "blur",
				"surfaceScale": 8,
				"specularConstant": 1,
				"specularExponent": 12,
				"result": "spec"
			}, [
				filters.fePointLight({x: "-5000", y: "-10000", z: "12000"})
			]), filters.feComposite({"in": "spec", "in2": "SourceGraphic", "operator": "in", "result": "specOut"}),
			filters.feComposite({
				"in": "SourceGraphic",
				"in2": "specOut",
				"operator": "arithmetic",
				"result": "litPaint",
				"k1": 0,
				"k2": 1,
				"k3": 1,
				"k4": 0
			}), filters.feMerge("offsetBlur", "litPaint")
		]), createFilter({
			_gfxName: "thinEmbossDropShadowLight",
			x: "-5%",
			y: "-5%",
			width: "120%",
			height: "120%"
		}, [
			filters.feGaussianBlur({"in": "SourceAlpha", "stdDeviation": 1, "result": "blur"}),
			filters.feComponentTransfer({"in": "blur", result: "lessblur"
			}, [
				filters.feFuncA({type: "linear", slope: "0.5"})
			]), filters.feOffset({"in": "lessblur", "dx": "6", "dy": "6", "result": "offsetBlur"}),
			filters.feSpecularLighting({
				"in": "lessblur",
				"surfaceScale": 8,
				"specularConstant": 1,
				"specularExponent": "12",
				"result": "specOut"
			}, [
				filters.fePointLight({x: "-5000", y: "-10000", z: "12000"})
			]), filters.feComposite({"in": "specOut", "in2": "SourceAlpha", "operator": "in", "result": "specOut"}),
			filters.feComposite({
				"in": "SourceGraphic",
				"in2": "specOut",
				"result": "litPaint",
				"operator": "arithmetic",
				"k1": 0,
				"k2": 1,
				"k3": 1,
				"k4": 0
			}), filters.feMerge("offsetBlur", "litPaint")
		]), createFilter({
			_gfxName: "embossDropShadowLight",
			x: "-5%",
			y: "-5%",
			width: "120%",
			height: "120%"
		}, [
			filters.feGaussianBlur({"in": "SourceAlpha", stdDeviation: "3", result: "blur"}),
			filters.feComponentTransfer({
				"in": "blur",
				result: "lessblur"
			}, [
				filters.feFuncA({type: "linear", slope: "0.5"})
			]), filters.feOffset({"in": "lessblur", dx: "6", dy: "6", result: "offsetBlur"}),
			filters.feSpecularLighting({
				"in": "lessblur",
				surfaceScale: "8",
				specularConstant: "1",
				specularExponent: "12",
				result: "specOut"
			}, [
				filters.fePointLight({x: "-5000", y: "-10000", z: "12000"})
			]), filters.feComposite({"in": "specOut", in2: "SourceAlpha", operator: "in", result: "specOut"}),
			filters.feComposite({
				"in": "SourceGraphic",
				in2: "specOut",
				result: "litPaint",
				operator: "arithmetic",
				k1: "0",
				k2: "1",
				k3: "1",
				k4: "0"
			}), filters.feMerge("offsetBlur", "litPaint")
		]), createFilter({
			_gfxName: "largeEmbossDropShadowLight",
			x: "-20%",
			y: "-20%",
			width: "140%",
			height: "140%"
		}, [
			filters.feGaussianBlur({"in": "SourceAlpha", stdDeviation: "5", result: "blur"}),
			filters.feComponentTransfer({"in": "blur", result: "lessblur"
			}, [
				filters.feFuncA({type: "linear", slope: "0.5"})
			]), filters.feOffset({"in": "lessblur", dx: "6", dy: "6", result: "offsetBlur"}),
			filters.feSpecularLighting({
				"in": "blur",
				surfaceScale: "8",
				specularConstant: "1",
				specularExponent: "12",
				result: "spec"
			}, [
				filters.fePointLight({x: "-5000", y: "-10000", z: "12000"})
			]), filters.feComposite({"in": "spec", in2: "SourceGraphic", operator: "in", result: "specOut"}),
			filters.feComposite({
				"in": "SourceGraphic",
				in2: "specOut",
				operator: "arithmetic",
				k1: "0",
				k2: "1",
				k3: "1",
				k4: "0",
				result: "litPaint"
			}), filters.feMerge("offsetBlur", "litPaint")
		]), createFilter({
			_gfxName: "fuzzy",
			x: "-10%",
			y: "-10%",
			width: "120%",
			height: "120%"
		}, [
			filters.feTurbulence({type: "fractalNoise", baseFrequency: "0.1", numOctaves: "1", result: "turb2"}),
			filters.feDisplacementMap({
				"in": "SourceGraphic",
				in2: "turb2",
				result: "turb2",
				scale: "20",
				xChannelSelector: "R",
				yChannelSelector: "G"
			})
		]), createFilter({
			_gfxName: "veryFuzzy",
			x: "-20%",
			y: "-20%",
			width: "140%",
			height: "140%"
		}, [
			filters.feTurbulence({type: "fractalNoise", baseFrequency: "0.1", numOctaves: "1", result: "turb2"}),
			filters.feDisplacementMap({
				"in": "SourceGraphic",
				in2: "turb2",
				result: "turb2",
				scale: "35",
				xChannelSelector: "R",
				yChannelSelector: "G"
			})
		]), createFilter({
			_gfxName: "melting",
			x: "-10%",
			y: "-10%",
			width: "120%",
			height: "120%"
		}, [
			filters.feTurbulence({type: "fractalNoise", baseFrequency: "0.1", numOctaves: "2", result: "turb"}),
			filters.feDisplacementMap({
				result: "bended",
				"in": "SourceGraphic",
				in2: "turb",
				scale: "25",
				xChannelSelector: "R",
				yChannelSelector: "G"
			}), filters.feGaussianBlur({"in": "bended", stdDeviation: "1", result: "bb"}),
			filters.feComponentTransfer({"in": "bb", result: "BendedSource"
			}, [
				filters.feFuncA({type: "linear", slope: 10, intercept: "-1"})
			]), filters.feComponentTransfer({
				"in": "BendedSource",
				result: "BendedAlpha"
			}, [
				filters.feFuncR({ type: "linear", slope: "0", intercept: "0"}),
				filters.feFuncG({ type: "linear", slope: "0", intercept: "0"}),
				filters.feFuncB({ type: "linear", slope: "0", intercept: "0"}),
				filters.feFuncA({ type: "linear", slope: "1", intercept: "0"})
			]), filters.feGaussianBlur({
				"in": "BendedAlpha",
				stdDeviation: "1",
				result: "blur"
			}), filters.feSpecularLighting({
				"in": "blur",
				"lighting-color": "rgb(80%, 80%, 80%)",
				"surfaceScale": "5",
				specularConstant: "1",
				specularExponent: "10",
				result: "specularOut"
			}, [
				filters.fePointLight({
					x: "-5000",
					y: "-10000",
					z: "20000"
				})
			]), filters.feComposite({
				"in": "specularOut",
				in2: "BendedAlpha",
				operator: "in",
				result: "specularOut"
			}), filters.feComposite({
				"in": "BendedSource",
				in2: "specularOut",
				operator: "arithmetic",
				k1: "0",
				k2: "1",
				k3: "1",
				k4: "0",
				result: "litPaint"
			})
		]), createFilter({
			_gfxName: "impressionist",
			x: "0%",
			y: "0%",
			width: "100%",
			height: "100%"
		}, [
			filters.feMorphology({
				"in": "SourceGraphic",
				operator: "dilate",
				radius: "2"
			})
		]), createFilter({
			_gfxName: "holes",
			x: "0%",
			y: "0%",
			width: "100%",
			height: "100%"
		}, [
			filters.feTurbulence({
				type: "fractalNoise",
				baseFrequency: "0.1",
				numOctaves: "1",
				result: "texture"
			}), filters.feComponentTransfer({
				"in": "texture",
				result: "holes"
			}, [
				filters.feFuncA({type: "discrete", tableValues: "0,1"})
			]), filters.feComposite({
				"in": "SourceGraphic",
				in2: "holes",
				operator: "out"
			})
		]), createFilter({
			_gfxName: "holesComplement",
			x: "0%",
			y: "0%",
			width: "100%",
			height: "100%"
		}, [
			filters.feTurbulence({
				type: "fractalNoise",
				baseFrequency: "0.1",
				numOctaves: "1",
				result: "texture"
			}), filters.feComponentTransfer({
				"in": "texture",
				result: "holes"
			}, [
				filters.feFuncA({ type: "discrete", tableValues: "1,0"})
			]), filters.feComposite({"in": "SourceGraphic", in2: "holes", operator: "out"})
		])
	];

	lib.reliefs = [
		createFilter({
			_gfxName: "bumpIn",
			x: "0%",
			y: "0%",
			width: "100%",
			height: "100%"
		}, [
			filters.feColorMatrix({"in": "SourceGraphic", type: "luminanceToAlpha", result: "lumalpha"}),
			filters.feComponentTransfer({
				"in": "lumalpha",
				result: "invertedalpha"
			}, [
				filters.feFuncA({ type: "table", tableValues: "1,0"})
			]), filters.feDiffuseLighting({
				"in": "invertedalpha",
				"lighting-color": "rgb(60%, 60%, 60%)",
				result: "diffuse",
				surfaceScale: "5"
			}, [
				filters.feDistantLight({ azimuth: "135", elevation: "60"})
			]), filters.feSpecularLighting({
				"in": "invertedalpha",
				result: "specular",
				surfaceScale: "5",
				specularExponent: "6"
			}, [
				filters.feDistantLight({ azimuth: "135", elevation: "30"})
			]), filters.feComposite({ "in": "diffuse", in2: "specular", operator: "arithmetic", k2: "1.0", k3: "1.0"})
		]), createFilter({
			_gfxName: "bumpOut",
			x: "0%",
			y: "0%",
			width: "100%",
			height: "100%"
		}, [
			filters.feColorMatrix({ "in": "SourceGraphic", type: "luminanceToAlpha", result: "lumalpha"}),
			filters.feDiffuseLighting({
				"in": "lumalpha",
				"lighting-color": "rgb(60%, 60%, 60%)",
				result: "diffuse",
				surfaceScale: "5"
			}, [
				filters.feDistantLight({ azimuth: "135", elevation: "60"})
			]), filters.feSpecularLighting({
				"in": "lumalpha",
				result: "specular",
				surfaceScale: "5",
				specularExponent: "6"
			}, [
				filters.feDistantLight({ azimuth: "135", elevation: "30"})
			]), filters.feComposite({ "in": "diffuse", in2: "specular", operator: "arithmetic", k2: "1.0", k3: "1.0"})
		]), createFilter({
			_gfxName: "thinEmboss",
			x: "-5%",
			y: "-5%",
			width: "110%",
			height: "110%"
		}, [
			filters.feGaussianBlur({ "in": "SourceAlpha", stdDeviation: "1", result: "blur"}),
			filters.feSpecularLighting({
				"in": "blur",
				surfaceScale: "8",
				specularConstant: "1",
				specularExponent: "12",
				result: "specOut"
			}, [
				filters.fePointLight({ x: "-5000", y: "-10000", z: "12000"})
			]), filters.feComposite({ "in": "specOut", in2: "SourceAlpha", operator: "in", result: "specOut"}),
			filters.feComposite({
				"in": "SourceGraphic",
				in2: "specOut",
				operator: "arithmetic",
				k1: "0",
				k2: "1",
				k3: "1",
				k4: "0"
			})
		]), createFilter({
			_gfxName: "emboss",
			x: "-5%",
			y: "-5%",
			width: "110%",
			height: "110%"
		}, [
			filters.feGaussianBlur({ "in": "SourceAlpha", stdDeviation: "3", result: "blur"}),
			filters.feSpecularLighting({
				"in": "blur",
				surfaceScale: "8",
				specularConstant: "1",
				specularExponent: "12",
				result: "specOut"
			}, [
				filters.fePointLight({ x: "-5000", y: "-10000", z: "12000"})
			]), filters.feComposite({ "in": "specOut", in2: "SourceAlpha", operator: "in", result: "specOut"}),
			filters.feComposite({
				"in": "SourceGraphic",
				in2: "specOut",
				operator: "arithmetic",
				k1: "0",
				k2: "1",
				k3: "1",
				k4: "0"
			})
		]), createFilter({
			_gfxName: "largeEmboss",
			x: "-5%",
			y: "-5%",
			width: "110%",
			height: "110%"
		}, [
			filters.feGaussianBlur({ "in": "SourceAlpha", stdDeviation: "5", result: "blur"}),
			filters.feSpecularLighting({
				"in": "blur",
				surfaceScale: "8",
				specularConstant: "1",
				specularExponent: "12",
				result: "specOut"
			}, [
				filters.fePointLight({ x: "-5000", y: "-10000", z: "12000"})
			]), filters.feComposite({ "in": "specOut", in2: "SourceAlpha", operator: "in", result: "specOut"}),
			filters.feComposite({
				"in": "SourceGraphic",
				in2: "specOut",
				operator: "arithmetic",
				k1: "0",
				k2: "1",
				k3: "1",
				k4: "0"
			})
		])
	];

	lib.textures = [
		createFilter({
			_gfxName: "paper",
			x: "0%",
			y: "0%",
			width: "100%",
			height: "100%"
		}, [
			filters.feTurbulence({ type: "turbulence", baseFrequency: "0.01", numOctaves: "5", result: "texture"}),
			filters.feDiffuseLighting({
				"in": "texture",
				result: "diffuse",
				surfaceScale: "-10"
			}, [
				filters.feDistantLight({ azimuth: "135", elevation: "60"})
			]),
			filters.feComposite({
				"in": "diffuse",
				in2: "SourceGraphic",
				operator: "arithmetic",
				k1: "1",
				k2: "0",
				k3: "0",
				k4: "0"
			})
		]), createFilter({
			_gfxName: "swirl",
			x: "0%",
			y: "0%",
			width: "100%",
			height: "100%"
		}, [
			filters.feTurbulence({ type: "turbulence", baseFrequency: "0.05", numOctaves: "1", result: "texture"}),
			filters.feDiffuseLighting({
				"in": "texture",
				result: "diffuse",
				surfaceScale: "-10"
			}, [
				filters.feDistantLight({ azimuth: "135", elevation: "60"})
			]),
			filters.feComposite({
				"in": "diffuse",
				in2: "SourceGraphic",
				operator: "arithmetic",
				k1: "1",
				k2: "0",
				k3: "0",
				k4: "0"
			})
		]), createFilter({
			_gfxName: "swirl2",
			x: "0%",
			y: "0%",
			width: "100%",
			height: "100%"
		}, [
			filters.feTurbulence({ type: "turbulence", baseFrequency: "0.15", numOctaves: "1", result: "texture"}),
			filters.feDiffuseLighting({
				"in": "texture",
				result: "diffuse",
				surfaceScale: "-10"
			}, [
				filters.feDistantLight({ azimuth: "135", elevation: "60"})
			]),
			filters.feComposite({
				"in": "diffuse",
				in2: "SourceGraphic",
				operator: "arithmetic",
				k1: "1",
				k2: "0",
				k3: "0",
				k4: "0"
			})
		]), createFilter({
			_gfxName: "gold",
			x: "-5%",
			y: "-5%",
			width: "115%",
			height: "110%"
		}, [
			filters.feTurbulence({ baseFrequency: "0.2", numOctaves: "1", type: "turbulence", result: "turb"}),
			filters.feComposite({
				"in": "SourceGraphic",
				in2: "turb",
				operator: "arithmetic",
				k2: "0.6",
				k3: "0.4",
				result: "turb"
			}), filters.feComposite({ "in": "turb", in2: "SourceGraphic", operator: "in", result: "bump"}),
			filters.feDiffuseLighting({
				"in": "turb",
				surfaceScale: "6.0",
				"lighting-color": "rgb(60%, 50%, 0%)",
				diffuseConstant: "1.0",
				result: "diffuse"
			}, [
				filters.feDistantLight({ azimuth: "135", elevation: "60"})
			]), filters.feSpecularLighting({
				"in": "bump",
				surfaceScale: "6.0",
				specularConstant: "1.0",
				specularExponent: "10.0",
				result: "specularOut"
			}, [
				filters.feDistantLight({ azimuth: "135", elevation: "60"})
			]),
			filters.feComposite({
				"in": "specularOut",
				in2: "SourceGraphic",
				operator: "in",
				result: "specularOut"
			}),
			filters.feComposite({
				"in": "bump",
				in2: "diffuse",
				operator: "arithmetic",
				k1: "0.7",
				k2: "0.3",
				result: "litPaint"
			}),
			filters.feComposite({
				"in": "litPaint",
				in2: "specularOut",
				operator: "arithmetic",
				k2: "1.0",
				k3: "0.7",
				result: "litPaint"
			})
		])
	];

	// exports filters defined in lib as function via the returned object
	// i.e. var filter = filters.convolution.verticalEdge({x:.., y:..., width:..., height:...})
	for (var category in lib) {
		if (lib.hasOwnProperty(category)) {
			filters[category] = {};
			var cat = lib[category];
			for (var i = 0; i < cat.length; ++i) {
				(function () {
					var f = cat[i];
					filters[category][f._gfxName] = function (args) {
						return lang.delegate(f, args);
					};
				})();
			}
		}
	}

	return filters;
});
