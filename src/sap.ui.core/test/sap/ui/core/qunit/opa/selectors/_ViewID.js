/*global QUnit */
sap.ui.define([
	"sap/ui/test/selectors/_ControlSelectorGenerator",
	"sap/ui/thirdparty/jquery",
	"sap/m/Button",
	'sap/m/App',
	'sap/ui/core/mvc/XMLView'
], function (_ControlSelectorGenerator, $, Button, App, XMLView) {
	"use strict";

	QUnit.module("_ViewID", {
		beforeEach: function (assert) {
			// Note: This test is executed with QUnit 1 and QUnit 2.
			//       We therefore cannot rely on the built-in promise handling of QUnit 2.
			var done = assert.async();
			Promise.all([
				XMLView.create({
					id: "myView",
					definition: createViewContent("myView")
				}),
				XMLView.create({
					definition: createViewContent("myViewWithoutId")
				})
			]).then(function(aViews) {
				this.oButton = new Button("myButton");
				this.oButton.placeAt("qunit-fixture");
				this.oViewWithId = aViews[0].placeAt("qunit-fixture");
				this.oViewNoId = aViews[1].placeAt("qunit-fixture");
				sap.ui.getCore().applyChanges();
				done();
			}.bind(this), function(oErr) {
				assert.strictEqual(oErr, undefined, "failed to load view");
			});
		},
		afterEach: function () {
			this.oViewWithId.destroy();
			this.oViewNoId.destroy();
			this.oButton.destroy();
		}
	});

	QUnit.test("Should generate selector for control in a view with stable ID", function (assert) {
		var fnDone = assert.async();
		_ControlSelectorGenerator._generate({control: $("#myView form input").control()[0], includeAll: true})
			.then(function (aSelector) {
				var mViewIdSelector = aSelector[1][0];
				assert.strictEqual(mViewIdSelector.viewId, "myView", "Should generate selector with viewName");
				assert.strictEqual(mViewIdSelector.id, "mySearch", "Should generate selector with ID");
				assert.ok(!mViewIdSelector.controlType, "Should not include controlType matcher");
			}).finally(fnDone);
	});

	QUnit.test("Should generate selector for control with stable ID in any view", function (assert) {
		var fnDone = assert.async();
		var $view = $(".sapUiView").filter(function (i, $elem) {
			return $elem.id !== "myView";
		});
		_ControlSelectorGenerator._generate({control: $view.find("form input").control()[0], includeAll: true})
			.then(function (aSelector) {
				var mViewIdSelector = aSelector[0][0];
				assert.strictEqual(mViewIdSelector.viewName, "myViewWithoutId", "Should generate selector with viewName");
				assert.strictEqual(mViewIdSelector.id, "mySearch", "Should generate selector with ID");
				assert.ok(!mViewIdSelector.controlType, "Should not include controlType matcher");
			}).finally(fnDone);
	});

	QUnit.test("Should not generate selector for control with generated ID", function (assert) {
		var fnDone = assert.async();
		_ControlSelectorGenerator._generate({control: $("#myView form input").control()[1], includeAll: true, shallow: true})
			.then(function (aSelector) {
				assert.ok(!hasViewIdSelector(aSelector), "Should not generate selector");
			}).finally(fnDone);
	});

	QUnit.test("Should not generate selector for control with no view", function (assert) {
		var fnDone = assert.async();
		_ControlSelectorGenerator._generate({control: this.oButton, includeAll: true, shallow: true})
			.then(function (aSelector) {
				assert.ok(!hasViewIdSelector(aSelector), "Should not generate selector");
			}).finally(fnDone);
	});

	function createViewContent (sViewName) {
		return '<mvc:View xmlns:core="sap.ui.core" xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" viewName="' + sViewName + '">' +
			'<App id="myApp">' +
				'<Page id="page1">' +
					'<SearchField id="mySearch" placeholder="Test"></SearchField>' +
					'<SearchField placeholder="Placeholder"></SearchField>' +
				'</Page>' +
			'</App>' +
		'</mvc:View>';
	}

	function hasViewIdSelector(aSelectors) {
		return aSelectors.filter(function (aSelectorsOfType) {
			return aSelectorsOfType.filter(function (mSelector) {
				return (mSelector.viewName || mSelector.viewId) && mSelector.id && Object.keys(mSelector).length === 2;
			}).length;
		}).length;
	}
});
