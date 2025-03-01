/* global QUnit */

sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/integration/controls/Paginator"
], function (
	Core,
	Paginator
) {
	"use strict";

	var DOM_RENDER_LOCATION = "qunit-fixture";

	QUnit.module("API and Rendering", {
		beforeEach: function () {
			this.oPaginator = new Paginator({
				pageNumber: 1,
				pageCount: 4
			});
			this.oPaginator.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		},
		afterEach: function () {
			this.oPaginator.destroy();
		}
	});

	QUnit.test("rendered", function (assert) {
		assert.strictEqual(this.oPaginator.$().length, 1, "rendered");
	});

	QUnit.test("pageCount <= 1", function (assert) {
		this.oPaginator.setPageCount(1);
		Core.applyChanges();
		assert.notOk(this.oPaginator.$().length, "not rendered");
	});

	QUnit.test("arrows and dots", function (assert) {
		assert.strictEqual(this.oPaginator.$().find(".sapMCrslPrev").length, 1, "prev arrow is rendered");
		assert.strictEqual(this.oPaginator.$().find(".sapMCrslNext").length, 1, "next arrow is rendered");

		assert.strictEqual(this.oPaginator.$().find(".sapMCrslBulleted span").length, 4, "dots are rendered");
		assert.ok(this.oPaginator.$().find(".sapMCrslBulleted span")[1].classList.contains("sapMCrslActive"), "active dot is correct");
	});

	QUnit.test("pageCount > 5", function (assert) {
		this.oPaginator.setPageCount(10);
		Core.applyChanges();
		assert.notOk(this.oPaginator.$().find(".sapMCrslBulleted span").length, "dots are not rendered");

		var $numericIndicator = this.oPaginator.$().find(".sapMCrslNumeric span");
		assert.strictEqual($numericIndicator.length, 1, "numeric indicator is rendered");
		assert.strictEqual($numericIndicator.text(), Core.getLibraryResourceBundle("sap.m").getText("CAROUSEL_PAGE_INDICATOR_TEXT", [2, 10]), "numeric indicator is correct");
	});

	QUnit.module("Interaction", {
		beforeEach: function () {
			this.oPaginator = new Paginator({
				pageNumber: 1,
				pageCount: 5
			});
			this.oPaginator.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		},
		afterEach: function () {
			this.oPaginator.destroy();
		}
	});

	QUnit.test("navigate next", function (assert) {
		// act - press right arrow
		this.oPaginator.$().find(".sapMCrslNext .sapUiIcon").trigger("click");
		assert.strictEqual(this.oPaginator.getPageNumber(), 2, "page number is correct");

		this.oPaginator.setPageNumber(4);
		Core.applyChanges();

		this.oPaginator.$().find(".sapMCrslNext .sapUiIcon").trigger("click");
		assert.strictEqual(this.oPaginator.getPageNumber(), 4, "page number stays the same");
	});

	QUnit.test("navigate prev", function (assert) {
		// act - press right arrow
		this.oPaginator.$().find(".sapMCrslPrev .sapUiIcon").trigger("click");
		assert.strictEqual(this.oPaginator.getPageNumber(), 0, "page number is correct");

		this.oPaginator.$().find(".sapMCrslPrev .sapUiIcon").trigger("click");
		assert.strictEqual(this.oPaginator.getPageNumber(), 0, "page number stays the same");
	});
});