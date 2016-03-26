define([
	"dcl/dcl", "./_base", "./Shape", "../shape/_LineBase"
], function (dcl, canvas, CanvasShape, LineBase) {
	return dcl([CanvasShape, LineBase], {
		// summary:
		//		a line shape (Canvas)
		_renderShape: function (/* Object */ ctx) {
			var s = this.shape;
			ctx.beginPath();
			ctx.moveTo(s.x1, s.y1);
			ctx.lineTo(s.x2, s.y2);
		},
		_renderDashedStroke: function (ctx, apply) {
			var s = this.shape;
			ctx.beginPath();
			canvas.toDashedLineTo(ctx, this, s.x1, s.y1, s.x2, s.y2);
			if (apply) {
				ctx.stroke();
			}
		}
	});

});
