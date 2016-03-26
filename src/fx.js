define([
	"dojo/_base/lang", "./_base", "./matrix", "dcolor/Color", "dcolor/utils", "dojo/_base/fx", "dojo/_base/connect",
	"dojo/sniff"
], function (lang, g, m, Color, colorUtils, fx, Hub, has) {
		var fxg = g.fx = {};

		function InterpolNumber(start, end) {
			this.start = start;
			this.end = end;
		}

		InterpolNumber.prototype.getValue = function (r) {
			return (this.end - this.start) * r + this.start;
		};

		function InterpolUnit(start, end, units) {
			this.start = start;
			this.end = end;
			this.units = units;
		}

		InterpolUnit.prototype.getValue = function (r) {
			return (this.end - this.start) * r + this.start + this.units;
		};

		function InterpolColor(start, end) {
			this.start = start;
			this.end = end;
			this.temp = new Color();
		}

		InterpolColor.prototype.getValue = function (r) {
			return colorUtils.blendColors(this.start, this.end, r, this.temp);
		};

		function InterpolValues(values) {
			this.values = values;
			this.length = values.length;
		}

		InterpolValues.prototype.getValue = function (r) {
			return this.values[Math.min(Math.floor(r * this.length), this.length - 1)];
		};

		function InterpolObject(values, def) {
			this.values = values;
			this.def = def ? def : {};
		}

		InterpolObject.prototype.getValue = function (r) {
			var ret = lang.clone(this.def);
			for (var i in this.values) {
				ret[i] = this.values[i].getValue(r);
			}
			return ret;
		};

		function InterpolTransform(stack, original) {
			this.stack = stack;
			this.original = original;
		}

		InterpolTransform.prototype.getValue = function (r) {
			var ret = [];
			this.stack.forEach(function (t) {
				if (t instanceof m.Matrix2D) {
					ret.push(t);
					return;
				}
				if (t.name === "original" && this.original) {
					ret.push(this.original);
					return;
				}
				// Adding support for custom matrices
				if (t.name === "matrix") {
					if ((t.start instanceof m.Matrix2D) && (t.end instanceof m.Matrix2D)) {
						var transfMatrix = new m.Matrix2D();
						for (var p in t.start) {
							transfMatrix[p] = (t.end[p] - t.start[p]) * r + t.start[p];
						}
						ret.push(transfMatrix);
					}
					return;
				}
				if (!(t.name in m)) {
					return;
				}
				var f = m[t.name];
				if (typeof f !== "function") {
					// constant
					ret.push(f);
					return;
				}
				var val = t.start.map(function (v, i) {
					return (t.end[i] - v) * r + v;
				}), matrix = f.apply(m, val);
				if (matrix instanceof m.Matrix2D) {
					ret.push(matrix);
				}
			}, this);
			return ret;
		};

		var transparent = new Color(0, 0, 0, 0);

		function getColorInterpol(prop, obj, name, def) {
			if (prop.values) {
				return new InterpolValues(prop.values);
			}
			var value, start, end;
			if (prop.start) {
				start = g.normalizeColor(prop.start);
			} else {
				start = value = obj ? (name ? obj[name] : obj) : def;
			}
			if (prop.end) {
				end = g.normalizeColor(prop.end);
			} else {
				if (!value) {
					value = obj ? (name ? obj[name] : obj) : def;
				}
				end = value;
			}
			return new InterpolColor(start, end);
		}

		function getNumberInterpol(prop, obj, name, def) {
			if (prop.values) {
				return new InterpolValues(prop.values);
			}
			var value, start, end;
			if (prop.start) {
				start = prop.start;
			} else {
				start = value = obj ? obj[name] : def;
			}
			if (prop.end) {
				end = prop.end;
			} else {
				if (typeof value !== "number") {
					value = obj ? obj[name] : def;
				}
				end = value;
			}
			return new InterpolNumber(start, end);
		}

		fxg.animateStroke = function (/*Object*/ args) {
			// summary:
			//		Returns an animation which will change stroke properties over time.
			// args:
			//		an object defining the animation setting.
			// example:
			//	|	fxg.animateStroke{{
			//	|		shape: shape,
			//	|		duration: 500,
			//	|		color: {start: "red", end: "green"},
			//	|		width: {end: 15},
			//	|		join:  {values: ["miter", "bevel", "round"]}
			//	|	}).play();
			if (!args.easing) {
				args.easing = fx._defaultEasing;
			}
			var anim = new fx.Animation(args), shape = args.shape, stroke;
			/* jshint maxcomplexity:13 */
			Hub.connect(anim, "beforeBegin", anim, function () {
				stroke = shape.stroke;
				var prop = args.color, values = {}, start, end;
				if (prop) {
					values.color = getColorInterpol(prop, stroke, "color", transparent);
				}
				prop = args.style;
				if (prop && prop.values) {
					values.style = new InterpolValues(prop.values);
				}
				prop = args.width;
				if (prop) {
					values.width = getNumberInterpol(prop, stroke, "width", 1);
				}
				prop = args.cap;
				if (prop && prop.values) {
					values.cap = new InterpolValues(prop.values);
				}
				prop = args.join;
				if (prop) {
					if (prop.values) {
						values.join = new InterpolValues(prop.values);
					} else {
						start = prop.start ? prop.start : (stroke && stroke.join || 0);
						end = prop.end ? prop.end : (stroke && stroke.join || 0);
						if (typeof start === "number" && typeof end === "number") {
							values.join = new InterpolNumber(start, end);
						}
					}
				}
				this.curve = new InterpolObject(values, stroke);
			});
			/* jshint maxcomplexity:10 */
			Hub.connect(anim, "onAnimate", shape, function (args) {
				shape.stroke = args;
			});
			return anim; // dojo.Animation
		};

		fxg.animateFill = function (/*Object*/ args) {
			// summary:
			//		Returns an animation which will change fill color over time.
			//		Only solid fill color is supported at the moment
			// args:
			//		an object defining the animation setting.
			// example:
			//	|	gfx.animateFill{{
			//	|		shape: shape,
			//	|		duration: 500,
			//	|		color: {start: "red", end: "green"}
			//	|	}).play();
			if (!args.easing) {
				args.easing = fx._defaultEasing;
			}
			var anim = new fx.Animation(args), shape = args.shape, fill;
			Hub.connect(anim, "beforeBegin", anim, function () {
				fill = shape.fill;
				var prop = args.color;
				if (prop) {
					this.curve = getColorInterpol(prop, fill, "", transparent);
				}
			});
			Hub.connect(anim, "onAnimate", shape, function (args) {
				shape.fill = args;
			});
			return anim; // dojo.Animation
		};

		fxg.animateFont = function (/*Object*/ args) {
			// summary:
			//		Returns an animation which will change font properties over time.
			// args:
			//		an object defining the animation setting.
			// example:
			//	|	gfx.animateFont{{
			//	|		shape: shape,
			//	|		duration: 500,
			//	|		variant: {values: ["normal", "small-caps"]},
			//	|		size:  {end: 10, units: "pt"}
			//	|	}).play();
			if (!args.easing) {
				args.easing = fx._defaultEasing;
			}
			var anim = new fx.Animation(args), shape = args.shape, font;
			Hub.connect(anim, "beforeBegin", anim, function () {
				font = shape.font;
				var prop = args.style, values = {}, start, end;
				if (prop && prop.values) {
					values.style = new InterpolValues(prop.values);
				}
				prop = args.variant;
				if (prop && prop.values) {
					values.variant = new InterpolValues(prop.values);
				}
				prop = args.weight;
				if (prop && prop.values) {
					values.weight = new InterpolValues(prop.values);
				}
				prop = args.family;
				if (prop && prop.values) {
					values.family = new InterpolValues(prop.values);
				}
				prop = args.size;
				if (prop && prop.units) {
					start = parseFloat(prop.start ? prop.start : (shape.font && shape.font.size || "0"));
					end = parseFloat(prop.end ? prop.end : (shape.font && shape.font.size || "0"));
					values.size = new InterpolUnit(start, end, prop.units);
				}
				this.curve = new InterpolObject(values, font);
			});
			Hub.connect(anim, "onAnimate", shape, function (args) {
				shape.font = args;
			});
			return anim; // dojo.Animation
		};

		fxg.animateTransform = function (/*Object*/ args) {
			// summary:
			//		Returns an animation which will change transformation over time.
			// args:
			//		an object defining the animation setting.
			// example:
			//	|	gfx.animateTransform{{
			//	|		shape: shape,
			//	|		duration: 500,
			//	|		transform: [
			//	|			{name: "translate", start: [0, 0], end: [200, 200]},
			//	|			{name: "original"}
			//	|		]
			//	|	}).play();
			if (!args.easing) {
				args.easing = fx._defaultEasing;
			}
			var anim = new fx.Animation(args), shape = args.shape, original;
			Hub.connect(anim, "beforeBegin", anim, function () {
				original = shape.transform;
				this.curve = new InterpolTransform(args.transform, original);
			});
			Hub.connect(anim, "onAnimate", shape, function (args) {
				shape.transform = args;
			});
			if (g.renderer === "svg" && has("ie") >= 10) {
				// fix http://bugs.dojotoolkit.org/ticket/16879
				var handlers = [
					Hub.connect(anim, "onBegin", anim, function () {
						var parent = shape.getParent();
						while (parent && parent.getParent) {
							parent = parent.getParent();
						}
						if (parent) {
							shape.__svgContainer = parent.rawNode.parentNode;
						}
					}), Hub.connect(anim, "onAnimate", anim, function () {
						try {
							if (shape.__svgContainer) {
								var ov = shape.__svgContainer.style.visibility;
								shape.__svgContainer.style.visibility = "visible";
								shape.__svgContainer.style.visibility = ov;
							}
						} catch (e) {
						}
					}), Hub.connect(anim, "onEnd", anim, function () {
						handlers.forEach(Hub.disconnect);
						if (shape.__svgContainer) {
							var ov = shape.__svgContainer.style.visibility;
							var sn = shape.__svgContainer;
							shape.__svgContainer.style.visibility = "visible";
							setTimeout(function () {
								try {
									sn.style.visibility = ov;
									sn = null;
								} catch (e) {
								}
							}, 100);
						}
						delete shape.__svgContainer;
					})
				];
			}
			return anim; // dojo.Animation
		};

		return fxg;
	});
