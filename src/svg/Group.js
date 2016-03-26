define([
	"dcl/dcl", "./Shape", "../shape/_GroupBase", "./Container", "./Creator"
], function (dcl, SvgShape, GroupBase, SvgContainer, SvgCreator) {

	var Group = dcl([SvgShape, GroupBase, SvgContainer, SvgCreator], {
		// summary:
		//		a group shape (SVG), which can be used
		//		to logically group shapes (e.g, to propagate matricies)
		setRawNode: function (rawNode) {
			// summary:
			//		sets a raw SVG node to be used by this shape
			// rawNode: Node
			//		an SVG node
			this.rawNode = rawNode;
			// Bind GFX object with SVG node for ease of retrieval - that is to
			// save code/performance to keep this association elsewhere
			this.rawNode._gfxObject = this;
		}
	});
	Group.nodeType = "g";

	return Group;
});
