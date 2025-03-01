/*!
 * ${copyright}
 */

sap.ui.define(['sap/ui/core/Renderer', './ListBaseRenderer'],
	function(Renderer, ListBaseRenderer) {
	"use strict";

	/**
	 * Tree renderer.
	 * @namespace
	 *
	 */
	var TreeRenderer = Renderer.extend(ListBaseRenderer);
	TreeRenderer.apiVersion = 2;

	/**
	 * Returns the ARIA accessibility role.
	 *
	 * @param {sap.m.Tree} oControl An object representation of the control
	 * @returns {string}
	 */
	TreeRenderer.getAriaRole = function(oControl) {
		return "tree";
	};

	return TreeRenderer;

}, /* bExport= */ true);