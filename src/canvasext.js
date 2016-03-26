define([
	"dojo/_base/lang", "./_base", "./canvas"
], function (lang, gfx, canvas) {

	/*=====
	 return {
	 // summary:
	 //		A module that adds canvas-specific features to the gfx api. You should require this module
	 //		when your application specifically targets the HTML5 Canvas renderer.
	 }
	 =====*/

	var ext = gfx.canvasext = {};

	lang.extend(canvas.Surface, {

		getImageData: function (rect) {
			// summary:
			//		Returns the canvas pixel buffer.
			// rect: gfx.Rectangle
			//		The canvas area.

			// flush pending renders queue, if any
			if ("pendingRender" in this) {
				this._render(true); // force render even if there're pendingImages
			}
			return this.rawNode.getContext("2d").getImageData(rect.x, rect.y, rect.width, rect.height);
		},

		getContext: function () {
			// summary:
			//		Returns the surface CanvasRenderingContext2D.
			return this.rawNode.getContext("2d");
		}
	});

	return ext;
});
