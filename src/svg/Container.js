define([
	"dcl/dcl", "../shape/_ContainerBase", "./_base"
], function (dcl, ContainerBase, svg) {
	return dcl([ContainerBase], {
		openBatch: function () {
			// summary:
			//		starts a new batch, subsequent new child shapes will be held in
			//		the batch instead of appending to the container directly
			if (!this._batch) {
				this.fragment = svg._createFragment();
			}
			++this._batch;
			return this;
		},
		closeBatch: function () {
			// summary:
			//		submits the current batch, append all pending child shapes to DOM
			this._batch = this._batch > 0 ? --this._batch : 0;
			if (this.fragment && !this._batch) {
				this.rawNode.appendChild(this.fragment);
				delete this.fragment;
			}
			return this;
		},
		add: dcl.superCall(function (sup) {
			return function (shape) {
				// summary:
				//		adds a shape to a group/surface
				// shape: gfx/shape.Shape
				//		an SVG shape object
				if (this !== shape.getParent()) {
					if (this.fragment) {
						this.fragment.appendChild(shape.rawNode);
					} else {
						this.rawNode.appendChild(shape.rawNode);
					}
					sup.apply(this, arguments);
					// update clipnode with new parent
					shape.clip = shape.clip;
				}
				return this;	// self
			};
		}),
		remove: dcl.superCall(function (sup) {
			return function (shape /*===== , silently =====*/) {
				// summary:
				//		remove a shape from a group/surface
				// shape: gfx/shape.Shape
				//		an SVG shape object
				// silently: Boolean?
				//		if true, regenerate a picture
				if (this === shape.getParent()) {
					if (this.rawNode === shape.rawNode.parentNode) {
						this.rawNode.removeChild(shape.rawNode);
					}
					if (this.fragment && this.fragment === shape.rawNode.parentNode) {
						this.fragment.removeChild(shape.rawNode);
					}
					// remove clip node from parent
					shape._removeClipNode();
					sup.apply(this, arguments);
				}
				return this;	// self
			};
		}),
		clear: dcl.superCall(function (sup) {
			return function () {
				// summary:
				//		removes all shapes from a group/surface
				var r = this.rawNode;
				while (r.lastChild) {
					r.removeChild(r.lastChild);
				}
				var defNode = this.defNode;
				if (defNode) {
					while (defNode.lastChild) {
						defNode.removeChild(defNode.lastChild);
					}
					r.appendChild(defNode);
				}
				sup.apply(this, arguments);
			};
		})
	});
});
