/*global QUnit, sinon, hasher */
sap.ui.define([
	"sap/base/Log",
	"sap/ui/core/UIComponent",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/mvc/JSView",
	"sap/ui/core/mvc/View",
	"sap/ui/core/mvc/ViewType",
	"sap/ui/core/routing/HashChanger",
	"sap/ui/core/routing/RouterHashChanger",
	"sap/ui/core/routing/Router",
	"sap/ui/core/routing/Views",
	"sap/ui/model/json/JSONModel",
	"sap/m/App",
	"sap/m/Button",
	"sap/m/NavContainer",
	"sap/m/Panel",
	"sap/m/SplitContainer",
	"./AsyncViewModuleHook",
	"sap/ui/base/EventProvider",
	"sap/ui/core/Component",
	"sap/ui/core/ComponentContainer",
	"sap/m/VBox"
], function (Log, UIComponent, Controller, JSView, View, ViewType, HashChanger, RouterHashChanger, Router, Views, JSONModel, App, Button, NavContainer, Panel, SplitContainer, ModuleHook, EventProvider, Component, ComponentContainer, VBox) {
	"use strict";

	// This global namespace is used for creating custom component classes.
	// It is set early here so that QUnit doesn't report it when using its 'noglobals' option
	window.namespace = undefined;
	window.namespace1 = undefined;

	// use sap.m.Panel as a lightweight drop-in replacement for the ux3.Shell
	var ShellSubstitute = Panel;

	var fnCreateRouter = function() {
		var args = Array.prototype.slice.call(arguments);

		args.unshift(Router);

		if (args.length < 3) {
			args[2] = {};
		}
		args[2].async = true;

		return new (Function.prototype.bind.apply(Router, args))();
	};

	function createView (aContent, sId) {
		var sXmlViewContent = aContent.join(''),
				oViewOptions = {
					id : sId,
					viewContent: sXmlViewContent,
					type: "XML"
				};

		return sap.ui.view(oViewOptions);
	}

	QUnit.module("State: initial, initialized and stopped", {
		beforeEach: function(assert) {
			this.oRouter = new Router({}, {async: true}, null, {});
		},
		afterEach: function(assert) {
			this.oRouter.destroy();
		}
	});

	QUnit.test("The router is neither initialized nor stopped after construction", function(assert) {
		assert.equal(this.oRouter.isInitialized(), false, "The router isn't initialized");
		assert.equal(this.oRouter.isStopped(), false, "The router isn't stopped");
	});

	QUnit.test("The router is initialized after calling initialize", function(assert) {
		this.oRouter.initialize();

		assert.equal(this.oRouter.isInitialized(), true, "The router is initialized");
		assert.equal(this.oRouter.isStopped(), false, "The router isn't stopped");
	});

	QUnit.test("The router is stopped after calling stop", function(assert) {
		var oTargetsDetachTitleChangedSpy = sinon.spy(this.oRouter.getTargets(), "detachTitleChanged");
		this.oRouter.stop();

		assert.equal(this.oRouter.isInitialized(), false, "The router isn't initialized");
		assert.equal(this.oRouter.isStopped(), true, "The router is stopped");
		assert.equal(oTargetsDetachTitleChangedSpy.callCount, 1, "detachTitleChanged should be called");

		oTargetsDetachTitleChangedSpy.restore();
	});

	QUnit.test("The router is neither initialized nor stopped after destroyed", function(assert) {
		this.oRouter.destroy();
		assert.equal(this.oRouter.isInitialized(), false, "The router isn't initialized");
		assert.equal(this.oRouter.isStopped(), false, "The router isn't stopped");
	});

	QUnit.test("Calling 'navTo' method does not trigger any hash change when the router is stopped", function(assert) {
		HashChanger.getInstance().setHash("");
		assert.expect(4);
		var oSetHashSpy = this.spy(HashChanger.getInstance(), "setHash"),
			done = assert.async(),
			oApp = new App(),
			oRouter = fnCreateRouter([
				{
					name: "home",
					pattern:  "",
					targetControl: oApp.getId()
				},
				{
					name : "second",
					pattern : "second",
					targetControl: oApp.getId()
				}
			]);

		oRouter.getRoute("second").attachPatternMatched(function(oEvent){
			assert.notOk(true, "The route 'second' should not be matched because router is stopped");
		});

		oRouter.initialize();

		assert.equal(oRouter.isStopped(), false, "The router isn't stopped");

		oRouter.stop();

		setTimeout(function(){
			oRouter.navTo("second");
			setTimeout(function(){
				assert.equal(oRouter.isStopped(), true, "The router is stopped");
				assert.strictEqual(HashChanger.getInstance().getHash(), "", "The hash is still empty");
				assert.equal(oSetHashSpy.callCount, 0, "The method 'setHash' was never called after stopping the router instance");
				done();
			});
		});
	});


	QUnit.module("get/setHashChanger");

	QUnit.test("getHashChanger", function(assert) {
		var oRouter = new Router({}, {async: true}, null, {});

		assert.ok(oRouter.getHashChanger().isA("sap.ui.core.routing.RouterHashChanger"), "The router has default hashchanger created in the constructor");
		oRouter.destroy();
	});

	QUnit.test("setHashChanger", function(assert) {
		var oRouter = new Router({}, {async: true}, null, {});
		var oRouterHashChanger = oRouter.getHashChanger();

		var oWarningSpy = sinon.spy(Log, "warning");
		oRouter.setHashChanger({});
		assert.equal(oWarningSpy.callCount, 1, "A warning is written");
		assert.strictEqual(oRouter.getHashChanger(), oRouterHashChanger, "The RouterHashChanger is still the one which is set by the first setter call");

		oWarningSpy.restore();
		oRouter.destroy();
	});

	QUnit.module("construction");

	QUnit.test("constructor with RouterHashChanger", function(assert) {
		var oRouterHashChanger = HashChanger.getInstance().createRouterHashChanger();
		var oRouter = new Router({}, {async: true}, null, {}, oRouterHashChanger);

		assert.strictEqual(oRouter.getHashChanger(), oRouterHashChanger, "The hash changer is assigned to the router");
		oRouterHashChanger.destroy();
		oRouter.destroy();
	});

	QUnit.test("constructor without RouterHashChanger", function(assert) {
		var oRouter = new Router({}, {async: true}, null, {});

		assert.ok(oRouter.getHashChanger().isA("sap.ui.core.routing.RouterHashChanger"), "A hash changer is created by default");
		oRouter.destroy();
	});

	QUnit.module("initialization");

	QUnit.test("Should initialize the router instance", function(assert) {
		//Arrange
		var parseSpy,
		//System under Test
			router = fnCreateRouter();

		parseSpy = this.spy(router, "parse");

		hasher.setHash("");

		//Act
		router.initialize();

		//Assert
		assert.strictEqual(parseSpy.callCount, 1, "did notify for initial hash");

		hasher.setHash("foo");

		assert.strictEqual(parseSpy.callCount, 2, "did notify for hashChanged");

		//Cleanup
		router.destroy();
	});

	QUnit.test("Should stop the router instance", function(assert) {
		//Arrange
		var parseSpy,
		//System under Test
			router = fnCreateRouter();

		parseSpy = this.spy(router, "parse");

		hasher.setHash("");

		//Act
		router.initialize();

		//Assert
		assert.strictEqual(parseSpy.callCount, 1, "did notify for initial hash");

		router.stop();
		hasher.setHash("foo");

		assert.strictEqual(parseSpy.callCount, 1, "did not notify for hashChanged");

		router.initialize();
		assert.strictEqual(parseSpy.callCount, 2, "did notify again and parse the current hash");

		//Cleanup
		router.destroy();
	});

	QUnit.test("Should fire switched event on the last matched route when stopping the router instance", function(assert) {
		//Arrange
		var router = fnCreateRouter({
				home: {
					pattern: ""
				}
			}),
			oRoute = router.getRoute("home"),
			oSwitchedSpy = this.spy();

		oRoute.attachEvent("switched", oSwitchedSpy);

		hasher.setHash("");

		//Act
		router.initialize();
		router.stop();

		//Assert
		assert.equal(oSwitchedSpy.callCount, 1, "The switched event is fired on the last matched route");

		router.initialize();
		assert.equal(oSwitchedSpy.callCount, 1, "No further switched event is fired by initialize");

		//Cleanup
		router.destroy();
	});

	QUnit.test("Should not raise any exeception when stop is called before initialize", function(assert) {
		assert.expect(0);
		var router = fnCreateRouter();

		// call stop shouldn't raise any exception
		router.stop();

		//Cleanup
		router.destroy();
	});

	QUnit.test("Should parse the hash again when second initialize doesn't suppress hash parsing", function(assert) {
		var router = fnCreateRouter();
		var parseSpy = this.spy(router, "parse");

		hasher.setHash("");

		router.initialize();

		assert.equal(parseSpy.callCount, 1, "did notify for initial hash");
		router.stop();

		router.initialize();
		assert.equal(parseSpy.callCount, 2, "did notify when initialized with the same hash again");

		router.destroy();
	});

	QUnit.test("Shouldn't parse the hash again when second initialize does suppress hash parsing", function(assert) {
		var router = fnCreateRouter();
		var parseSpy = this.spy(router, "parse");

		hasher.setHash("");

		router.initialize();

		assert.equal(parseSpy.callCount, 1, "did notify for initial hash");
		router.stop();

		router.initialize(true /*suppress hash parsing*/);
		assert.equal(parseSpy.callCount, 1, "did not notify when initialized with the same hash again");

		router.destroy();
	});

	QUnit.test("Should destroy the router instance", function(assert) {
		//Arrange
		var parseSpy,
		//System under Test
			router = fnCreateRouter();

		parseSpy = this.spy(router, "parse");

		hasher.setHash("");

		//Act
		router.initialize();
		router.initialize();
		router.destroy();
		hasher.setHash("foo");

		//Assert
		assert.strictEqual(parseSpy.callCount, 1, "did notify for initial hash but did not dispatch change after destroy");

	});

	QUnit.test("Should destroy the routers dependencies", function(assert) {
		// System under test + Arrange
		var oRouter = fnCreateRouter([ { name : "myRoute", pattern : "foo" } ], {}, null, {myTarget : {}});

		var oTargets = oRouter.getTargets(),
			oViews = oRouter.getViews(),
			oRoute = oRouter.getRoute("myRoute");

		//Act
		oRouter.destroy();

		//Assert
		assert.ok(oRouter.bIsDestroyed, "did set the destroy flag");
		assert.ok(oTargets.bIsDestroyed, "did destroy the targets");
		assert.ok(oRoute.bIsDestroyed, "did destroy the route");
		assert.ok(oViews.bIsDestroyed, "did destroy the views");
		assert.strictEqual(oRouter._oRouter, null, "did free the crossroads router");
		assert.strictEqual(oRouter._oRoutes, null, "did free the UI5 routes");
		assert.strictEqual(oRouter._oTargets, null, "did free the UI5 targets");
		assert.strictEqual(oRouter._oConfig, null, "did free the config");
		assert.strictEqual(oRouter._oViews, null, "did free the view cache");

	});

	QUnit.test("Should log a warning if a router gets destroyed while the hash changes", function (assert) {

		// Arrange
		var oWarningSpy = this.stub(Log, "warning"),
			oFirstRouter = fnCreateRouter({
				"matchingRoute" : {
					pattern: "matches"
				}
			}),
			oRouterToBeDestroyed = fnCreateRouter({
				"matchingRoute" : {
					pattern: "matches"
				}
			});

		// first router has to init first it is the first registered router on the hashchanger
		oFirstRouter.initialize();
		oRouterToBeDestroyed.initialize();

		this.stub(oFirstRouter, "parse").callsFake(function() {
			Router.prototype.parse.apply(this, arguments);
			oRouterToBeDestroyed.destroy();
		});

		// Act - trigger both routers
		hasher.setHash("matches");

		// Assert
		assert.equal(oWarningSpy.callCount, 1, "");
		assert.ok(oWarningSpy.args[0][0].indexOf("destroyed") !== -1, "The message contains the correct keyword");
		assert.strictEqual(oWarningSpy.args[0][1], oRouterToBeDestroyed, "The second parameter to the warning call is correct");
		oFirstRouter.destroy();
	});

	QUnit.module("config", {
		beforeEach : function() {
			//make sure to start with an empty hash
			hasher.setHash("");
		}
	});

	QUnit.test("Should not match the undefined pattern", function(assert) {
		//Arrange
		var callCount = 0,
			matched = function(oEvent) {
				if (oEvent.getParameter("name") === "child") {
					callCount++;
				}
				if (oEvent.getParameter("name") === "parent") {
					assert.ok(false, "did hit the parent route");
				}
			},
			//System under Test
			router = fnCreateRouter({
				"parent" : {
					subroutes : {
						"child" : {
							pattern : "foo"
						}
					}
				}
			});

		this.stub(router._oViews, "_getViewWithGlobalId").callsFake(function() {
			return createView(
					['<View xmlns="sap.ui.core.mvc">',
						'</View>']);
		});

		var oParentRouteMatchedSpy = this.spy(router.getRoute("parent"), "_routeMatched");
		var oChildRouteMatchedSpy = this.spy(router.getRoute("child"), "_routeMatched");

		router.attachRoutePatternMatched(matched);
		hasher.setHash("");

		//Act
		router.initialize();
		hasher.setHash("foo");
		hasher.setHash("");

		assert.strictEqual(oParentRouteMatchedSpy.callCount, 1, "Parent _routeMatched is called");
		assert.ok(oParentRouteMatchedSpy.args[0][1] instanceof Promise, "Parent _routeMatched is called with second parameter Promise");
		assert.strictEqual(oChildRouteMatchedSpy.callCount, 1, "Child _routeMatched is called");
		assert.strictEqual(oChildRouteMatchedSpy.args[0][1], true, "Child _routeMatched is called with second parameter true");

		return oChildRouteMatchedSpy.returnValues[0].then(function() {
			//Assert
			assert.strictEqual(callCount, 1,"did notify the child");
			router.destroy();
		});
	});

	QUnit.test("Handle setting invalid option 'viewName' in route", function(assert) {
		var oLogSpy = this.spy(Log, "error");

		//Arrange System under Test
		fnCreateRouter({
			name: {
				// This is a wrong usage, the option "view" should be set
				// instead of "viewName"
				// We should still support the usage but log an error to
				// let the app be aware of the wrong usage
				viewName: "myView",
				viewType: "JS",
				pattern : "view1"
			}
		});


		assert.ok(oLogSpy.withArgs("The 'viewName' option shouldn't be used in Route. please use 'view' instead").calledOnce, "The error log is done and the log message is correct");
	});

	QUnit.test("subroute handling", function(assert) {

		//Arrange System under Test
		var router = fnCreateRouter({
			name: {
				view : "myView",
				viewType: "JS",
				pattern : "view1",
				subroutes: {
					subpage: {
						targetControl: "navContainer",
						targetAggregation: "pages",
						view : "subView",
						viewType: "JS",
						pattern: "view1/view2",
						subroutes: {
							subsubpage: {
								targetControl: "navContainer2",
								targetAggregation: "pages",
								view : "subView2",
								viewType: "JS",
								pattern: "foo"
							}
						}
					}
				}
			}
		});

		var aRoutes = router._oRoutes;

		assert.ok(aRoutes.name);
		assert.ok(aRoutes.subpage);
		assert.ok(aRoutes.subsubpage);

		var route1 = aRoutes.name;
		assert.strictEqual(route1._oConfig.name, "name", "Route has correct name");
		assert.strictEqual(route1._oParent, undefined, "Route has no parent");

		var route2 = aRoutes.subpage;
		assert.strictEqual(route2._oConfig.name, "subpage", "Route has correct name");
		assert.strictEqual(route2._oParent, route1, "Route has correct parent");

		var route3 = aRoutes.subsubpage;
		assert.strictEqual(route3._oConfig.name, "subsubpage", "Route has correct name");
		assert.strictEqual(route3._oParent, route2, "Route has correct parent");

		router = fnCreateRouter([
			{
				name : "name",
				view : "myView",
				viewType: "JS",
				pattern : "view1",
				subroutes: [
					{
						targetControl: "navContainer",
						targetAggregation: "pages",
						name: "subpage",
						view : "subView",
						viewType: "JS",
						pattern: "view1/view2",
						subroutes: [
							{
								targetControl: "navContainer2",
								targetAggregation: "pages",
								name: "subsubpage",
								view : "subView2",
								viewType: "JS",
								pattern: "foo"
							}
						]
					}
				]
			}
		]);

		aRoutes = router._oRoutes;

		assert.ok(aRoutes.name);
		assert.ok(aRoutes.subpage);
		assert.ok(aRoutes.subsubpage);

		route1 = aRoutes.name;
		assert.strictEqual(route1._oConfig.name, "name", "Route has correct name");
		assert.strictEqual(route1._oParent, undefined, "Route has no parent");

		route2 = aRoutes.subpage;
		assert.strictEqual(route2._oConfig.name, "subpage", "Route has correct name");
		assert.strictEqual(route2._oParent, route1, "Route has correct parent");

		route3 = aRoutes.subsubpage;
		assert.strictEqual(route3._oConfig.name, "subsubpage", "Route has correct name");
		assert.strictEqual(route3._oParent, route2, "Route has correct parent");

	});

	QUnit.test("Should not crash if viewName is not defined, but controlId and aggregation are defaulted but no view is given", function (assert) {
		var oNavContainer = new NavContainer();

		//Arrange System under Test
		var oRouter = fnCreateRouter({
			routeWithoutView: {
				pattern : "view1"
			}
		},
		{
			targetControl: oNavContainer.getId(),
			targetAggregation: "pages"
		});

		oRouter.parse("view1");

		assert.ok(true, "Did not crash");

		oNavContainer.destroy();
		oRouter.destroy();
	});

	QUnit.module("greedy");

	QUnit.test("Should create a greedy route", function (assert) {
		// Arrange + System under test
		var sPattern = "product",
			oRouter = fnCreateRouter([
			{
				name: "first",
				pattern: sPattern
			},
			{
				name : "parent",
				pattern : sPattern,
				greedy : true,
				subroutes: [
					{
						name : "child",
						pattern : sPattern
					}
				]
			}
		]);

		var aRoutes = [oRouter.getRoute("first"), oRouter.getRoute("parent"), oRouter.getRoute("child")],
			aListenerSpies = [this.spy(), this.spy(), this.spy()],
			aRouteMatchedSpies = [];

		aRoutes.forEach(function(oRoute, i) {
			oRoute.attachPatternMatched(aListenerSpies[i]);
			aRouteMatchedSpies.push(this.spy(oRoute, "_routeMatched"));
		}, this);

		// Act
		oRouter.parse(sPattern);

		assert.strictEqual(aRouteMatchedSpies[0].callCount, 1, "first route is matched");
		assert.strictEqual(aRouteMatchedSpies[1].callCount, 1, "parent route is matched");
		assert.strictEqual(aRouteMatchedSpies[2].callCount, 0, "child route is not matched");

		return Promise.all([aRouteMatchedSpies[0].returnValues[0], aRouteMatchedSpies[1].returnValues[0]]).then(function() {
			assert.strictEqual(aListenerSpies[0].callCount, 1, "first route gets pattern matched");
			assert.strictEqual(aListenerSpies[1].callCount, 1, "parent does also get pattern matched because of greedyness");
			assert.strictEqual(aListenerSpies[2].callCount, 0, "child gets not pattern matched");

			oRouter.destroy();
		});
	});

	QUnit.test("Should create a greedy route", function (assert) {
		// Arrange + System under test
		var sPattern = "product",
			oRouter = fnCreateRouter([
				{
					name: "first",
					pattern: sPattern
				},
				{
					name : "second",
					pattern : sPattern
				},
				{
					name: "last",
					pattern: sPattern,
					greedy : true
				}
			]);

		var aRoutes = [oRouter.getRoute("first"), oRouter.getRoute("second"), oRouter.getRoute("last")],
			aListenerSpies = [this.spy(), this.spy(), this.spy()],
			aRouteMatchedSpies = [];

		aRoutes.forEach(function(oRoute, i) {
			oRoute.attachPatternMatched(aListenerSpies[i]);
			aRouteMatchedSpies.push(this.spy(oRoute, "_routeMatched"));
		}, this);

		// Act
		oRouter.parse(sPattern);

		assert.strictEqual(aRouteMatchedSpies[0].callCount, 1, "first route is matched");
		assert.strictEqual(aRouteMatchedSpies[1].callCount, 0, "second route is not matched");
		assert.strictEqual(aRouteMatchedSpies[2].callCount, 1, "last route is matched");

		return Promise.all([aRouteMatchedSpies[0].returnValues[0], aRouteMatchedSpies[2].returnValues[0]]).then(function() {
			assert.strictEqual(aListenerSpies[0].callCount, 1, "first route gets pattern matched");
			assert.strictEqual(aListenerSpies[1].callCount, 0, "second doesn't get matched");
			assert.strictEqual(aListenerSpies[2].callCount, 1, "last gets pattern matched");

			oRouter.destroy();
		});
	});

	QUnit.module("routing", {
		beforeEach : function() {
			//make sure to start with an empty hash
			hasher.setHash("");
		}
	});

	QUnit.test("Should attach to a route", function(assert) {
		//Arrange
		var spy = this.spy(),
		//System under Test
			router = fnCreateRouter([ {
				name : "name",
				pattern : ""
			} ]);

		var oRoute = router.getRoute("name"),
			oSpy = sinon.spy(oRoute, "_routeMatched");

		//Act
		router.attachRouteMatched(spy);
		router.initialize();

		assert.strictEqual(oSpy.callCount, 1, "_routeMatched is called once");

		return oSpy.returnValues[0].then(function() {
			//Assert
			assert.strictEqual(spy.callCount, 1, "Did call the callback function once");

			//Cleanup
			oSpy.restore();
			router.destroy();
		});
	});

	QUnit.test("Should attach to a route using getRoute", function(assert) {
		//Arrange
		var spy = this.spy(),
			//System under Test
			oRouter = fnCreateRouter([ {
				name : "name",
				pattern : ""
			} ]),
			oRoute = oRouter.getRoute("name");

		var oSpy = sinon.spy(oRoute, "_routeMatched");

		//Act
		oRoute.attachMatched(spy);
		oRouter.initialize();

		assert.strictEqual(oSpy.callCount, 1, "_routeMatched is called once");

		return oSpy.returnValues[0].then(function() {
			//Assert
			assert.strictEqual(spy.callCount, 1, "Did call the callback function once");

			//Cleanup
			oSpy.restore();
			oRouter.destroy();
		});
	});

	QUnit.test("Should go to a route", function(assert) {
		//Arrange
		var callCount = 0,
			aArguments = [],
			matched = function(oEvent) {
				if (oEvent.getParameter("name") === "name") {
					callCount++;
					aArguments = oEvent.getParameter("arguments");
				}
			},
			//System under Test
			router = fnCreateRouter([ {
				name : "name",
				pattern : "{foo}/{bar}"
			} ]);

		this.stub(router._oViews, "_getViewWithGlobalId").callsFake(function() {
			return createView(
					['<View xmlns="sap.ui.core.mvc">',
						'</View>']);
		});

		var oRouteMatchedSpy = this.spy(router.getRoute("name"), "_routeMatched");

		router.initialize();
		router.attachRouteMatched(matched);

		//Act
		var url = router.getURL("name", {
			bar : "bar",
			foo : "foo"
		});
		HashChanger.getInstance().setHash(url);

		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched is called");

		return oRouteMatchedSpy.returnValues[0].then(function() {
			//Assert
			assert.strictEqual(callCount, 1, "Did call the callback function once");
			assert.strictEqual(aArguments.foo, "foo", "parameter foo is passed");
			assert.strictEqual(aArguments.bar, "bar", "parameter bar is passed");

			//Cleanup
			router.destroy();
		});
	});

	QUnit.test("Should go to a route", function(assert) {
		//Arrange
		var beforeCallCount = 0,
			callCount = 0,
			patternCallCount = 0,
			aArguments = [],
			bParentCallFirst = false,
			beforeMatched = function(oEvent) {
				beforeCallCount++;
			},
			matched = function(oEvent) {
				callCount++;
				if (oEvent.getParameter("name") === "name") {
					if (callCount === 1) {
						bParentCallFirst = true;
					}
					aArguments = oEvent.getParameter("arguments");
				}
			},
			patternMatched = function(oEvent) {
				patternCallCount++;
				if (oEvent.getParameter("name") === "name") {
					assert.ok(false, "the parent route should not be hit");
				}
			},
			//System under Test
			router = fnCreateRouter([ {
				name : "name",
				pattern : "{foo}",
				subroutes: [
					{
						name: "subroute",
						pattern: "{foo}/{bar}"
					}
				]
			} ]);

		this.stub(router._oViews, "_getViewWithGlobalId").callsFake(function() {
			return createView(
					['<View xmlns="sap.ui.core.mvc">',
						'</View>']);
		});

		router.initialize();
		router.attachBeforeRouteMatched(beforeMatched);
		router.attachRouteMatched(matched);
		router.attachRoutePatternMatched(patternMatched);

		// var oParentRouteMatchedSpy = this.spy(router.getRoute("name"), "_routeMatched");
		var oChildRouteMatchedSpy = this.spy(router.getRoute("subroute"), "_routeMatched");

		//Act
		var url = router.getURL("subroute", {
			bar : "bar",
			foo : "foo"
		});
		HashChanger.getInstance().setHash(url);

		assert.strictEqual(oChildRouteMatchedSpy.callCount, 1, "Child _routeMatched is called once");

		return oChildRouteMatchedSpy.returnValues[0].then(function() {
			//Assert
			assert.strictEqual(beforeCallCount, 2, "Did call the callback function twice");
			assert.strictEqual(callCount, 2, "Did call the callback function twice");
			assert.strictEqual(patternCallCount, 1, "Did call the patternMatched function once");
			assert.deepEqual(aArguments.foo, "foo", "Did pass foo as parameter it was: " + aArguments.foo);
			assert.ok(bParentCallFirst, "Parent route was called first");

			//Cleanup
			router.destroy();
		});
	});

	QUnit.test("Should go to a route with target set to empty array", function(assert) {
		//System under Test
		var oRouter = fnCreateRouter([ {
			name : "name",
			pattern : "{foo}",
			target: []
		} ], {async: true}, null, {});

		var oRoute = oRouter.getRoute("name");

		var oRouteMatchedEventSpy = sinon.spy(),
			oMatchedEventSpy = sinon.spy(),
			oRouteMatchedSpy = sinon.spy(oRoute, "_routeMatched");

		oRouter.attachRouteMatched(oRouteMatchedEventSpy);
		oRoute.attachMatched(oMatchedEventSpy);

		HashChanger.getInstance().setHash("abc");

		oRouter.initialize();

		assert.equal(oRouteMatchedSpy.callCount, 1, "The route is matched");

		return oRouteMatchedSpy.getCall(0).returnValue.then(function() {
			assert.equal(oRouteMatchedEventSpy.callCount, 1, "routeMatched event is fired on the router");
			assert.equal(oMatchedEventSpy.callCount, 1, "matched event is fired on the route");

			oRouter.destroy();
		});
	});


	//there was a bug that an empty route would catch all the requests
	QUnit.test("Should route to a route after an emptyHash", function(assert) {
		//Arrange
		var callCount = 0,
			matched = function(oEvent) {
				if (oEvent.getParameter("name") === "name") {
					callCount++;
				}
			},
			//System under Test
			router = fnCreateRouter([ {
				name : "emty",
				pattern : ""
			}, {
				name : "name",
				pattern : "foo/"
			} ]);

		router.initialize();
		router.attachRouteMatched(matched);

		var oRoute = router.getRoute("name"),
			oSpy = sinon.spy(oRoute, "_routeMatched");


		//Act
		HashChanger.getInstance().setHash("foo/");

		assert.strictEqual(oSpy.callCount, 1, "_routeMatched of name route is called");

		return oSpy.returnValues[0].then(function() {
			//Assert
			assert.strictEqual(callCount, 1, "Did call the callback function once");

			//Cleanup
			oSpy.restore();
			router.destroy();
		});
	});

	QUnit.module("hrefGeneration");

	QUnit.test("Should create an URL for a route", function(assert) {
		//Arrange
		var //System under Test
			router = fnCreateRouter([ {
				name : "name",
				pattern : "{foo}/{bar}"
			} ]);

		router.initialize();

		//Act
		var result = router.getURL("name", {
			bar : "bar",
			foo : "foo"
		});

		//Assert
		assert.strictEqual(result, "foo/bar", "Did pass foo bar as parameter");

		//Cleanup
		router.destroy();
	});

	QUnit.module("test a hash");

	QUnit.test("test whether a hash can be matched by the router", function(assert) {
		var oRouter = fnCreateRouter([{
			name: "fixedPattern",
			pattern: "foo/bar"
		}, {
			name: "withSingleParameter",
			pattern: "bar/{foo}"
		}, {
			name: "withMultipleParameter",
			pattern: "products/{productId}/{supplerId}"
		},{
			name: "withOptionalParameter",
			pattern: "people/{peopleId}/:year:"
		}, {
			name: "withQueryParameter",
			pattern: "employees/{employeeId}{?query}"
		}, {
			name: "withOptionalQueryParameter",
			pattern: "suppliers/{supplierId}:?query:"
		}, {
			name: "emptyPattern",
			pattern: ""
		}]);

		var aHashAndResults = [{
			hash: "foo/bar",
			match: true,
			name: "fixedPattern",
			info: {
				name: "fixedPattern",
				arguments: {}
			}
		}, {
			hash: "foo/bar1",
			match: false,
			name: undefined,
			info: undefined
		}, {
			hash: "foo",
			match: false,
			name: undefined,
			info: undefined

		}, {
			hash: "bar/foo",
			match: true,
			name: "withSingleParameter",
			info: {
				name: "withSingleParameter",
				arguments: {foo: "foo"}
			}
		}, {
			hash: "bar",
			match: false,
			name: undefined,
			info: undefined
		}, {
			hash: "bar/a",
			match: true,
			name: "withSingleParameter",
			info: {
				name: "withSingleParameter",
				arguments: {foo: "a"}
			}
		}, {
			hash: "bar/a/b",
			match: false,
			name: undefined,
			info: undefined
		}, {
			hash: "",
			match: true,
			name: "emptyPattern",
			info: {
				name: "emptyPattern",
				arguments: {}
			  }
		}, {
			hash: null,
			match: true,
			name: "emptyPattern",
			info: {
				name: "emptyPattern",
				arguments: {}
			  }
		}, {
			hash: undefined,
			match: true,
			name: "emptyPattern",
			info: {
				name: "emptyPattern",
				arguments: {}
			  }
		}, {
			hash: "products/P1/S1",
			match: true,
			name: "withMultipleParameter",
			info: {
				name: "withMultipleParameter",
				arguments: {productId: "P1", supplerId: "S1"}
			}
		}, {
			hash: "people/0",
			match: true,
			name: "withOptionalParameter",
			info: {
				name: "withOptionalParameter",
				arguments: {peopleId: "0", year: undefined}
			}
		}, {
			hash: "people/0/2019",
			match: true,
			name: "withOptionalParameter",
			info: {
				name: "withOptionalParameter",
				arguments: {peopleId: "0", year: "2019"}
			}
		}, {
			hash: "employees/123?company=sap",
			match: true,
			name: "withQueryParameter",
			info: {
				name: "withQueryParameter",
				arguments: {employeeId: "123", "?query": {company: "sap"}}
			}
		}, {
			hash: "suppliers/678?company=sap",
			match: true,
			name: "withOptionalQueryParameter",
			info: {
				name: "withOptionalQueryParameter",
				arguments: {supplierId: "678", "?query": {company: "sap"}}
			}
		}, {
			hash: "suppliers/678?company=sap&region=asia",
			match: true,
			name: "withOptionalQueryParameter",
			info: {
				name: "withOptionalQueryParameter",
				arguments: {supplierId: "678", "?query": {company: "sap", region: "asia"}}
			}
		}, {
			hash: "suppliers/678",
			match: true,
			name: "withOptionalQueryParameter",
			info: {
				name: "withOptionalQueryParameter",
				arguments: {supplierId: "678", "?query": undefined}
			}
		}];

		var oRouteByHash, oRouteInfo, sHash;
		aHashAndResults.forEach(function (oHashAndResult) {
			sHash = oHashAndResult.hash;
			oRouteByHash = oRouter.getRouteByHash(sHash);
			oRouteInfo = oRouter.getRouteInfoByHash(sHash);

			assert.strictEqual(oRouter.match(sHash), oHashAndResult.match, JSON.stringify(oHashAndResult, true) + " can" + (oHashAndResult.match ? "" : "'t") + " be matched by the router");
			assert.strictEqual(oRouteByHash ? oRouteByHash._oConfig.name : undefined, oHashAndResult.name, oHashAndResult.name + " can" + (oHashAndResult.hash ? "" : "'t") + " be matched by the hash");
			assert.deepEqual(oRouteInfo, oHashAndResult.info, "Route info object should be correct");
		});
	});

	QUnit.module("navTo", {
		beforeEach: function () {
			this.oRouter = fnCreateRouter();
			this.oRouter.oHashChanger = {
				setHash: jQuery.noop
			};
		},
		afterEach: function () {
			this.oRouter.destroy();
		}
	});

	QUnit.test("Should be able to chain NavTo", function (assert) {
		// Act
		var oReturnValue = this.oRouter.navTo();

		// Assert
		assert.strictEqual(oReturnValue, this.oRouter, "able to chain navTo");
	});

	QUnit.test("Should be able to use navTo with query parameters", function (assert) {
		// Prepare
		var done = assert.async();
		var iCounter = 0;
		HashChanger.getInstance().setHash("");
		var oApp = new App();

		var oRouter = fnCreateRouter([
			{
				name: "start",
				pattern:  "",
				targetControl: oApp.getId()
			},
			{
				name : "startWithQueryParameter",
				pattern : "start:?query:",
				targetControl: oApp.getId()
			}
		]);
		oRouter.getRoute("start").attachPatternMatched(function(oEvent){
			assert.strictEqual(oEvent.getParameter("name"), "start", "The 'start' route is matched correctly");
			oRouter.navTo("startWithQueryParameter");
		});
		oRouter.getRoute("startWithQueryParameter").attachPatternMatched(function(oEvent){
			var oParameters = oEvent.getParameters();
			var sRouteName = oParameters.name;
			var oRouteArguments = oParameters.arguments;
			assert.strictEqual(sRouteName, "startWithQueryParameter", "The 'startWithQueryParameter' route is matched correctly");
			if (iCounter === 0) {
				assert.deepEqual(oRouteArguments, {"?query": undefined}, "The route arguments are empty." );
				iCounter++;
				oRouter.navTo("startWithQueryParameter", {query: {region: "asia"}});
			} else if (iCounter === 1){
				assert.deepEqual(oRouteArguments, {"?query": {region: "asia"}}, "The route arguments correct." );
				iCounter++;
				oRouter.navTo("startWithQueryParameter", {"?query": {region: "europe"}});
			} else {
				assert.deepEqual(oRouteArguments, {"?query": {region: "europe"}}, "The route arguments correct." );
				oRouter.destroy();
				done();
			}
		});
		oRouter.initialize();

		// Act
		oRouter.navTo("home");
	});

	QUnit.test("Should throw an exception if route placeholder are not unique", function(assert){
		assert.throws(function(){
			fnCreateRouter([
				{
					name: "notValid",
					pattern: "{products}{?products}"
				}]);
			}, new Error("The config of route 'notValid' contains standard parameter and query parameter with the same name: 'products'. The name of the routing parameters and query parameter have to differentiate."));
		assert.ok(
			fnCreateRouter([
				{
					name: "valid",
					pattern: "{products}/{products}"
				}]),
				"The router configuration is correct."
		);
		assert.ok(
			fnCreateRouter([
				{
					name: "valid",
					pattern: "products"
				}]),
				"The router configuration is correct."
		);
		assert.ok(
			fnCreateRouter([
				{
					name: "valid",
					pattern: "{products}/:products:"
				}]),
				"The router configuration is correct."
		);
		assert.throws(function(){
			fnCreateRouter([
				{
					name: "notValid",
					pattern: "{products}:?products:"
				}]);
		}, new Error("The config of route 'notValid' contains standard parameter and query parameter with the same name: 'products'. The name of the routing parameters and query parameter have to differentiate."));
		assert.throws(function(){
			fnCreateRouter([
				{
					name: "notValid",
					pattern: ":products::?products:"
				}
			]);
		}, new Error("The config of route 'notValid' contains standard parameter and query parameter with the same name: 'products'. The name of the routing parameters and query parameter have to differentiate."));
		assert.throws(function(){
			fnCreateRouter([
				{
					name: "notValid",
					pattern: "{id}/{products}/{id}{?products}"
				}
			]);
		}, new Error("The config of route 'notValid' contains standard parameter and query parameter with the same name: 'products'. The name of the routing parameters and query parameter have to differentiate."));
	});

	QUnit.module("View generation", ModuleHook.create());

	QUnit.test("View initialization", function(assert) {

		var oShell = new ShellSubstitute();

		//Arrange System under Test
		var router = fnCreateRouter([
			{
				targetControl: oShell.getId(),
				targetAggregation: "content",
				name: "name",
				view: "Async1",
				viewPath: "qunit.view",
				viewType: "XML",
				pattern : "view1",
				viewId: "view"
			}
		]);

		var fnCreateViewSpy = sinon.spy(View, "create");
		var fnGenericCreateViewSpy = sinon.spy(View, "_create");
		var oRouteMatchedSpy = sinon.spy(router.getRoute("name"), "_routeMatched");

		router.initialize();

		//Act
		HashChanger.getInstance().setHash("view1");

		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched has been called");

		return oRouteMatchedSpy.returnValues[0].then(function(oResult) {
			//Assert
			assert.strictEqual(oShell.getContent()[0].getId(), oResult.view.getId(), "View is first content element");
			assert.strictEqual(fnCreateViewSpy.callCount, 1, "Only one view is created. The 'View.create' factory is called");
			assert.strictEqual(fnGenericCreateViewSpy.callCount, 0, "The 'View._create' factory is not called");

			//Cleanup
			fnCreateViewSpy.restore();
			fnGenericCreateViewSpy.restore();
			oRouteMatchedSpy.restore();
			router.destroy();
			oShell.destroy();
		});

	});

	QUnit.test("Should set a view to the cache", function (assert) {
		var oShell = new ShellSubstitute();

		//Arrange System under Test
		var router = fnCreateRouter([
			{
				targetControl: oShell.getId(),
				targetAggregation: "content",
				name : "name",
				view : "myView",
				viewType: "XML",
				pattern : "view1"
			}
		]);

		var oRouteMatchedSpy = this.spy(router.getRoute("name"), "_routeMatched");

		var sXmlViewContent = [
			'<View xmlns="sap.ui.core.mvc">',
			'</View>'
		].join('');

		var oViewOptions = {
			viewContent: sXmlViewContent,
			type : "XML"
		};

		var oView = sap.ui.view(oViewOptions);

		HashChanger.getInstance().setHash("view1");
		oShell.placeAt("qunit-fixture");

		//Act
		router.setView("myView", oView);
		router.initialize();

		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched has been called");

		return oRouteMatchedSpy.returnValues[0].then(function(oResult) {
			//Assert
			assert.strictEqual(oShell.getContent()[0].getId(), oResult.view.getId(), "a created view was placed");

			//Cleanup
			router.destroy();
			oShell.destroy();
		});
	});

	QUnit.test("Nested View initialization", function(assert) {

		HashChanger.getInstance().setHash("");

		var oApp = new App();

		//Arrange System under Test
		var router = fnCreateRouter([
			{
				targetControl: oApp.getId(),
				targetAggregation: "pages",
				name : "name",
				view : "myView",
				viewType: "JS",
				pattern : "view1",
				subroutes: [
					{
						targetControl: "navContainer",
						targetAggregation: "pages",
						name : "subpage",
						view : "subView",
						viewType: "JS",
						pattern: "view1/view2",
						subroutes: [
							{
								targetControl: "navContainer2",
								targetAggregation: "pages",
								name : "subsubpage",
								view : "subView2",
								viewType: "JS",
								pattern: "foo"
							}
						]
					}
				]
			}
		]);

		var oNavContainer = new NavContainer("navContainer");
		var oNavContainer2 = new NavContainer("navContainer2");
		var oNavContainer3 = new NavContainer("navContainer3");

		sap.ui.controller("myView", {});
		sap.ui.controller("subView", {});
		sap.ui.controller("subView2", {});
		sap.ui.jsview("myView", {
			createContent : function() {
				return oNavContainer;
			},
			getController : function() {
				return sap.ui.controller("myview");
			}
		});
		sap.ui.jsview("subView", {
			createContent : function() {
				return oNavContainer2;
			},
			getController : function() {
				return sap.ui.controller("subView");
			}
		});
		sap.ui.jsview("subView2", {
			createContent : function() {
				return oNavContainer3;
			},
			getController : function() {
				return sap.ui.controller("subView2");
			}
		});

		var oRouteMatchedSpy = this.spy(router.getRoute("subsubpage"), "_routeMatched");

		router.initialize();

		oApp.placeAt("qunit-fixture");

		//Act
		HashChanger.getInstance().setHash("foo");

		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched has been called");

		return  oRouteMatchedSpy.returnValues[0].then(function() {
			//Assert
			assert.strictEqual(oApp.getPages()[0].getContent()[0].getId(), oNavContainer.getId(), "oNavContainer is first page element in app");
			assert.strictEqual(oNavContainer.getPages()[0].getContent()[0].getId(), oNavContainer2.getId(), "oNavContainer2 is first page element in oNavContainer");
			assert.strictEqual(oNavContainer2.getPages()[0].getContent()[0].getId(), oNavContainer3.getId(), "oNavContainer3 is first page element in oNavContainer2");

			//Cleanup
			router.destroy();
			oApp.destroy();
		});
	});

	QUnit.test("Nested target parents", function(assert) {

		HashChanger.getInstance().setHash("");

		var oApp = new App();

		//Arrange System under Test
		var router = fnCreateRouter([
			{
				targetControl: oApp.getId(),
				targetAggregation: "pages",
				name : "splitContainerView",
				view : "SplitContainerView",
				viewType: "JS",
				subroutes: [
					{
						targetControl: "splitContainer",
						targetAggregation: "masterPages",
						name : "master",
						view : "Master",
						viewType: "JS",
						pattern: "master",
						subroutes: [
							{
								targetControl: undefined,
								targetAggregation: "detailPages",
								name : "detail",
								view : "Detail",
								viewType: "JS",
								pattern: "detail"
							}
						]
					}
				]
			},
			{
				targetControl: oApp.getId(),
				targetAggregation: "pages",
				name : "navContainerView",
				view : "NavContainerView",
				viewType: "JS",
				subroutes: [
					{
						targetControl: "navContainer",
						targetAggregation: "pages",
						name : "fullScreenPage",
						view : "FullScreenPage",
						viewType: "JS",
						pattern: "fullScreen"
					}
				]
			}
		]);

		var oNavContainer;
		var oSplitContainer;
		var oMasterContent = new Button();
		var oDetailContent = new Button();
		var oFullScreenContent = new Button();

		sap.ui.controller("SplitContainerView", {});
		sap.ui.controller("Master", {});
		sap.ui.controller("Detail", {});
		sap.ui.controller("NavContainerView", {});
		sap.ui.controller("FullScreenPage", {});

		sap.ui.jsview("NavContainerView", {
			createContent : function() {
				//simulate created ids
				oNavContainer = new NavContainer(this.createId("navContainer"));
				return oNavContainer;
			},
			getController : function() {
				return sap.ui.controller("NavContainerView");
			}
		});
		sap.ui.jsview("SplitContainerView", {
			createContent : function() {
				//simulate created ids
				oSplitContainer =  new SplitContainer(this.createId("splitContainer"));
				return oSplitContainer;
			},
			getController : function() {
				return sap.ui.controller("SplitContainerView");
			}
		});
		sap.ui.jsview("Master", {
			createContent : function() {
				return oMasterContent;
			},
			getController : function() {
				return sap.ui.controller("Master");
			}
		});
		sap.ui.jsview("Detail", {
			createContent : function() {
				return oDetailContent;
			},
			getController : function() {
				return sap.ui.controller("Detail");
			}
		});
		sap.ui.jsview("FullScreenPage", {
			createContent : function() {
				return oFullScreenContent;
			},
			getController : function() {
				return sap.ui.controller("FullScreenPage");
			}
		});


		var oDetailRouteMatchedSpy = this.spy(router.getRoute("detail"), "_routeMatched");
		var oFullScreenRouteMatchedSpy = this.spy(router.getRoute("fullScreenPage"), "_routeMatched");

		router.initialize();

		//Act
		HashChanger.getInstance().setHash("detail");
		HashChanger.getInstance().setHash("fullScreen");

		assert.strictEqual(oDetailRouteMatchedSpy.callCount, 1, "_routeMatched has been called");
		assert.strictEqual(oFullScreenRouteMatchedSpy.callCount, 1, "_routeMatched has been called");

		return Promise.all([oDetailRouteMatchedSpy.returnValues[0], oFullScreenRouteMatchedSpy.returnValues[0]]).then(function() {
			//Assert
			assert.strictEqual(oApp.getPages().length, 2, "splitContainer and navContainer are added to App");
			assert.strictEqual(oNavContainer.getPages()[0].getContent()[0].getId(), oFullScreenContent.getId(), "FullScreenContent is first page element in oNavContainer");
			assert.strictEqual(oSplitContainer.getMasterPages()[0].getContent()[0].getId(), oMasterContent.getId(), "Master is first master-page element in oSplitContainer");
			assert.strictEqual(oSplitContainer.getDetailPages()[0].getContent()[0].getId(), oDetailContent.getId(), "Detail is first detail-page element in oSplitContainer");

			//Cleanup
			router.destroy();
			oApp.destroy();
		});
	});

	QUnit.test("Fixed id", function(assert) {

		var oShell = new ShellSubstitute();

		//Arrange System under Test
		var router = fnCreateRouter([
			{
				targetControl: oShell.getId(),
				targetAggregation: "content",
				name : "name",
				viewId: "test-view",
				view : "myView",
				pattern : "view1"
			}
		],{
			viewType: "JS"
		});

		sap.ui.controller("myView", {});
		sap.ui.jsview("myView", {
			createContent : function() {
				return new Button();
			},
			getController : function() {
				return sap.ui.controller("myView");
			}
		});

		var oRouteMatchedSpy = this.spy(router.getRoute("name"), "_routeMatched");

		router.initialize();

		oShell.placeAt("qunit-fixture");

		//Act
		HashChanger.getInstance().setHash("view1");

		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched has been called");

		return oRouteMatchedSpy.returnValues[0].then(function() {
			//Assert
			assert.strictEqual(oShell.getContent()[0].getId(), "test-view", "View has correct id");

			//Cleanup
			router.destroy();
			oShell.destroy();
		});

	});

	QUnit.module("View events");

	function createXmlView () {
		var sXmlViewContent = [
			'<View xmlns="sap.ui.core.mvc">',
			'</View>'
		].join('');

		var oViewOptions = {
			definition: sXmlViewContent,
			type: "XML"
		};

		return View.create(oViewOptions);
	}

	QUnit.module("views - creation and caching", {
		beforeEach: function () {
			// System under test + Arrange
			this.oRouter = fnCreateRouter();

			return createXmlView().then(function(oView){
				this.oView = oView;
				this.fnLegayCreateViewStub = this.stub(View, "_create").callsFake(function (oViewOptions) {
					return oView;
				});

			}.bind(this));
		},
		afterEach: function () {
			this.oRouter.destroy();
		}
	});

	QUnit.test("Should create a view", function (assert) {
		// Act
		var oExpectedView = this.oRouter.getView("foo", ViewType.XML, "baz");

		// Assert
		assert.deepEqual(oExpectedView.getContent(), this.oView.getContent(), "the view was created");
		assert.strictEqual(this.fnLegayCreateViewStub.callCount, 1, "the stub was invoked");
		var oCallArguments = this.fnLegayCreateViewStub.getCall(0).args[0];
		assert.strictEqual(oCallArguments.viewName, "foo", "Did pass the viewname");
		assert.strictEqual(oCallArguments.type, ViewType.XML, "Did pass the type");
		assert.strictEqual(oCallArguments.id, "baz", "Did pass the id");
	});


	QUnit.test("Should set a view to the cache", function (assert) {
		// Act
		var oExpectedRouter = this.oRouter.setView("foo.bar", this.oView);
		var oRetrievedView = this.oRouter.getView("foo.bar", "bar");

		// Assert
		assert.strictEqual(oRetrievedView, this.oView, "the view was returned");
		assert.strictEqual(oExpectedRouter, this.oRouter, "able to chain this function");
		assert.strictEqual(this.fnLegayCreateViewStub.callCount, 0, "the stub not invoked - view was loaded from the cache");
	});


	QUnit.module("events", {
		beforeEach: function () {
			// System under test + Arrange
			this.oRouter = fnCreateRouter();
		},
		afterEach: function () {
			this.oRouter.destroy();
		}
	});

	QUnit.test("should be able to fire/attach/detach the created event", function(assert) {
		// Arrange
		var oParameters = { foo : "bar" },
			oListener = {},
			oData = { some : "data" },
			fnEventSpy = this.spy(function(oEvent, oActualData) {
				assert.strictEqual(oActualData, oData, "the data is correct");
				assert.strictEqual(oEvent.getParameters(), oParameters, "the parameters are correct");
				assert.strictEqual(this, oListener, "the this pointer is correct");
			}),
			oFireReturnValue,
			oDetachReturnValue,
			oAttachReturnValue = this.oRouter.attachViewCreated(oData, fnEventSpy, oListener);

		// Act
		oFireReturnValue = this.oRouter.fireViewCreated(oParameters);
		oDetachReturnValue = this.oRouter.detachViewCreated(fnEventSpy, oListener);
		this.oRouter.fireViewCreated();

		// Assert
		assert.strictEqual(fnEventSpy.callCount, 1, "did call the attach spy only once");
		assert.strictEqual(oAttachReturnValue, this.oRouter, "did return this for chaining for attach");
		assert.strictEqual(oDetachReturnValue, this.oRouter, "did return this for chaining for detach");
		assert.strictEqual(oFireReturnValue, this.oRouter, "did return this for chaining for fire");
	});

	QUnit.test("Should fire the view created event if a view is created", function (assert) {
		// Arrange
		var sViewType = ViewType.XML,
			sViewName = "foo",
			oParameters,
			fnEventSpy = this.spy(function (oEvent) {
				oParameters = oEvent.getParameters();
			});

		return createXmlView().then(function (oView) {
			this.stub(View, "_create").callsFake(function () {
				return oView;
			});

			this.oRouter.attachViewCreated(fnEventSpy);

			// Act
			this.oRouter.getView(sViewName, sViewType);

			// Assert
			assert.strictEqual(fnEventSpy.callCount, 1, "The view created event was fired");
			assert.strictEqual(oParameters.view, oView, "Did pass the view to the event parameters");
			assert.strictEqual(oParameters.viewName, sViewName, "Did pass the viewName to the event parameters");
			assert.strictEqual(oParameters.type, sViewType, "Did pass the viewType to the event parameters");
		}.bind(this));
	});

	QUnit.module("titleChanged event", {
		beforeEach: function() {
			this.oEventProviderStub = sinon.stub(EventProvider.prototype.oEventPool, "returnObject");
			hasher.setHash("");
			this.oApp = new App();
			this.sPattern = "anything";
			this.sTitle = "myTitle";
			this.oDefaults = {
				// only shells will be used
				controlAggregation: "pages",
				viewName: "foo",
				controlId: this.oApp.getId(),
				async: true
			};
			return createXmlView().then(function(oView){
				this.fnCreateViewStub = this.stub(View, "create").callsFake(function () {
					return Promise.resolve(oView);
				});
			}.bind(this));
		},
		afterEach: function() {
			this.oRouter.destroy();
			this.oEventProviderStub.restore();
		}
	});

	QUnit.test("should be able to fire/attach/detach the titleChanged event", function(assert) {
		// Arrange
		var oParameters = { foo : "bar" },
			oListener = {},
			oData = { some : "data" },
			fnEventSpy = this.spy(function(oEvent, oActualData) {
				assert.strictEqual(oActualData, oData, "the data is correct");
				assert.strictEqual(oEvent.getParameters(), oParameters, "the parameters are correct");
				assert.strictEqual(this, oListener, "the this pointer is correct");
			}),
			oFireReturnValue,
			oDetachReturnValue,
			oAttachReturnValue;

		this.oRouterConfig = {
			routeName : {
				pattern : this.sPattern,
				target: "home"
			}
		};

		this.oTargetConfig = {
			home: {
				title: this.sTitle
			}
		};
		this.oRouter = new Router(this.oRouterConfig, this.oDefaults, null, this.oTargetConfig);
		this.oRouter.initialize();
		oAttachReturnValue = this.oRouter.attachTitleChanged(oData, fnEventSpy, oListener);

		// Act
		oFireReturnValue = this.oRouter.fireTitleChanged(oParameters);
		oDetachReturnValue = this.oRouter.detachTitleChanged(fnEventSpy, oListener);
		this.oRouter.fireTitleChanged(oParameters);

		// Assert
		assert.strictEqual(fnEventSpy.callCount, 1, "did call the attach spy only once");
		assert.strictEqual(oAttachReturnValue, this.oRouter, "did return this for chaining for attach");
		assert.strictEqual(oDetachReturnValue, this.oRouter, "did return this for chaining for detach");
		assert.strictEqual(oFireReturnValue, this.oRouter, "did return this for chaining for fire");
	});

	QUnit.test("Should fire the titleChanged event if the matched route has a target with title defined", function (assert) {
		// Arrange
		var oParameters,
			fnEventSpy = this.spy(function (oEvent) {
				oParameters = oEvent.getParameters();
			}),
			oRouteMatchedSpy;

		this.oRouterConfig = {
			routeName : {
				pattern : this.sPattern,
				target: "home"
			}
		};

		this.oTargetConfig = {
			home: {
				title: this.sTitle
			}
		};
		this.oRouter = new Router(this.oRouterConfig, this.oDefaults, null, this.oTargetConfig);

		oRouteMatchedSpy = this.spy(this.oRouter.getRoute("routeName"), "_routeMatched");

		this.oRouter.initialize();

		this.oRouter.attachTitleChanged(fnEventSpy);

		// Act
		this.oRouter.oHashChanger.setHash(this.sPattern);

		sinon.assert.called(oRouteMatchedSpy);
		return oRouteMatchedSpy.returnValues[0].then(function() {
			// Assert
			assert.strictEqual(fnEventSpy.callCount, 1, "The titleChanged event was fired");
			assert.strictEqual(oParameters.title, this.sTitle, "Did pass title value to the event parameters");
		}.bind(this));
	});

	QUnit.test("Should fire the titleChanged event if the matched route has a title defined", function (assert) {
		// Arrange
		var oParameters,
			fnEventSpy = this.spy(function (oEvent) {
				oParameters = oEvent.getParameters();
			}), oRouteMatchedSpy;

		this.oRouterConfig = {
			routeName : {
				pattern : this.sPattern,
				target: ["home", "titleTarget"],
				titleTarget: "titleTarget"
			}
		};

		this.oTargetConfig = {
			home: {
				title: "foo"
			},
			titleTarget: {
				title: this.sTitle
			}
		};
		this.oRouter = new Router(this.oRouterConfig, this.oDefaults, null, this.oTargetConfig);

		oRouteMatchedSpy = this.spy(this.oRouter.getRoute("routeName"), "_routeMatched");

		this.oRouter.initialize();

		this.oRouter.attachTitleChanged(fnEventSpy);

		// Act
		this.oRouter.oHashChanger.setHash(this.sPattern);

		sinon.assert.called(oRouteMatchedSpy);
		return oRouteMatchedSpy.returnValues[0].then(function() {
			// Assert
			assert.strictEqual(fnEventSpy.callCount, 1, "The titleChanged event was fired");
			assert.strictEqual(oParameters.title, this.sTitle, "Did pass title value to the event parameters");
		}.bind(this));
	});

	QUnit.test("Should fire the titleChanged only on the active route", function (assert) {
		// Arrange
		var oParameters,
			fnEventSpy = this.spy(function (oEvent) {
				oParameters = oEvent.getParameters();
			}),
			sTitle = "title",
			sTitle1 = "title1",
			sPattern = "pattern",
			sPattern1 = "pattern1",
			oTarget,
			oRouteMatchedSpy,
			oSequencePromise;

		this.oRouterConfig = {
			route1 : {
				pattern : sPattern,
				target: "target"
			},
			route2 : {
				pattern : sPattern1,
				target: "target1"
			}
		};

		this.oTargetConfig = {
			target: {
				title: sTitle
			},
			target1: {
				title: sTitle1
			}
		};
		this.oRouter = new Router(this.oRouterConfig, this.oDefaults, null, this.oTargetConfig);
		oRouteMatchedSpy = this.spy(this.oRouter.getRoute("route1"), "_routeMatched");
		this.oRouter.initialize();

		this.oRouter.attachTitleChanged(fnEventSpy);

		// Act
		this.oRouter.oHashChanger.setHash(sPattern);

		sinon.assert.called(oRouteMatchedSpy);
		oSequencePromise = oRouteMatchedSpy.returnValues[0].then(function() {
			// Assert
			assert.strictEqual(fnEventSpy.callCount, 1, "The titleChanged event was fired");
			assert.strictEqual(oParameters.title, sTitle, "Did pass title value to the event parameters");
		});

		return oSequencePromise.then(function() {
			oRouteMatchedSpy = this.spy(this.oRouter.getRoute("route2"), "_routeMatched");
			// Act
			this.oRouter.oHashChanger.setHash(sPattern1);
			sinon.assert.called(oRouteMatchedSpy);

			return oRouteMatchedSpy.returnValues[0].then(function() {
				// Assert
				assert.strictEqual(fnEventSpy.callCount, 2, "The titleChanged event was fired on the matched route");
				assert.strictEqual(oParameters.title, sTitle1, "Did pass title value to the event parameters");

				oTarget = this.oRouter.getTarget("target");
				oTarget.fireTitleChanged({title: "foo"});
				assert.strictEqual(fnEventSpy.callCount, 2, "The titleChanged event wasn't fired again");
			}.bind(this));
		}.bind(this));
	});

	QUnit.module("titleChanged event with binding information", {
		beforeEach: function(){
			this.oEventProviderStub = sinon.stub(EventProvider.prototype.oEventPool, "returnObject");
			hasher.setHash("");
		},
		afterEach: function(){
			this.oEventProviderStub.restore();
		}
	});

	QUnit.test("TitleChanged event should be fired only once if title has binding", function(assert){
		sap.ui.jsview("namespace.comp.RootView", {
			createContent : function() {
				return new Panel(this.createId("rootPanel"));
			}
		});

		sap.ui.jsview("namespace.comp.MyView1", {
			createContent : function() {
				return new Button({
					text: "Home"
				});
			}
		});

		sap.ui.jsview("namespace.comp.MyView2", {
			createContent: function () {
				return new Button({
					text: "ButtonMyView1"
				});
			}
		});

		sap.ui.predefine("namespace/comp/GrandChildComponent/Component", ["sap/ui/core/UIComponent"], function (UIComponent) {
			return UIComponent.extend("namespace.comp.GrandChildComponent", {
				metadata: {
					rootView: {
						viewName: "namespace.comp.RootView",
						type: "JS",
						async: true
					},
					routing: {
						config: {
							async: true,
							controlAggregation: "content",
							controlId: "rootPanel",
							viewType: "JS",
							type: "View"
						},
						routes: [
							{
								pattern: "",
								name: "view1",
								target: "view1"
							}, {
								pattern: "view2",
								name: "view2",
								target: "view2"
							}
						],
						targets: {
							view1: {
								name: "namespace.comp.MyView1",
								title: "{/GrandChildComponentViewTitle}"
							},
							view2: {
								name: "namespace.comp.MyView2",
								title: "MyGrandChildView2Title"
							}
						}
					}
				},
				init : function() {
					UIComponent.prototype.init.apply(this, arguments);
					this.setModel(new JSONModel({}));
					this.getRouter().initialize();
				}
			});
		});

		sap.ui.predefine("namespace/comp/ChildComponent/Component", ["sap/ui/core/UIComponent"], function (UIComponent) {
			return UIComponent.extend("namespace.comp.ChildComponent", {
				metadata: {
					rootView: {
						viewName: "namespace.comp.RootView",
						type: "JS",
						async: true
					},
					routing: {
						config: {
							async: true,
							controlAggregation: "content",
							controlId: "rootPanel",
							viewType: "JS",
							type: "View"
						},
						routes: [
							{
								pattern: "",
								name: "view1",
								target: "view1"
							},
							{
								pattern: "view2",
								name: "view2",
								target: {
									name: "view2",
									prefix: "grandchild",
									propagateTitle: true
								}
							}
						],
						targets: {
							view1: {
								name: "namespace.comp.MyView1",
								title: "TitleView1"
							},
							view2: {
								name: "namespace.comp.GrandChildComponent",
								title: "GrandChildComponentTitle",
								type: "Component",
								options: { manifest: false }
							}
						}
					}
				},
				init: function () {
					UIComponent.prototype.init.apply(this, arguments);
					this.setModel(new JSONModel({}));
					this.getRouter().initialize();
				}
			});
		});

		var Component = UIComponent.extend("namespace.comp.Component", {
			metadata : {
				rootView: { viewName: "namespace.comp.RootView", type: "JS", async: true},
				routing:  {
					config: {
						async: true,
						viewType: "JS",
						type: "View",
						controlId: "rootPanel",
						controlAggregation: "content"
					},
					routes: [
						{ pattern: "", name: "home", target: "home"},
						{ pattern: "second", name: "second", target: "second" },
						{ pattern: "third", name: "third", target: { name: "third", prefix: "child", propagateTitle: true } }
					],
					targets: {
						home: { name: "namespace.comp.MyView1", title: "Home"},
						second: { name: "namespace.comp.MyView2", title: "{/secondViewTitle}"},
						third: { name: "namespace.comp.ChildComponent", type: "Component", id: "childComponent", title: "ChildComponentTitle", options: { manifest: false } }
					}
				}
			},
			init: function(){
				UIComponent.prototype.init.apply(this, arguments);
				this.setModel(new JSONModel({}));
			}
		});

		var oComponent = new Component();
		var done = assert.async();
		var oTitleChangedSpy = sinon.spy();

		this.oRouter = oComponent.getRouter();

		var oHomeRouteMatchedSpy = sinon.spy(this.oRouter.getRoute("home"), "_routeMatched");
		var oSecondRouteMatchedSpy = sinon.spy(this.oRouter.getRoute("second"), "_routeMatched");

		this.oRouter.initialize();

		oHomeRouteMatchedSpy.getCall(0).returnValue.then(function(){
			this.oRouter.attachTitleChanged(oTitleChangedSpy);
			this.oRouter.navTo("second");

			oSecondRouteMatchedSpy.getCall(0).returnValue.then(function () {
				assert.strictEqual(oTitleChangedSpy.callCount, 0, "The title change event shouldn't fired, as title isn't resolved");

				oComponent.getModel().setProperty("/secondViewTitle", "Foo");
				assert.strictEqual(oTitleChangedSpy.callCount, 1, "The title change event should be fired the first time");
				assert.strictEqual(oTitleChangedSpy.getCall(0).args[0].getParameter("title"), "Foo", "The title 'Foo' should be correct");

				var oThirdRouteMatchedSpy = sinon.spy(this.oRouter.getRoute("third"), "_routeMatched");
				this.oRouter.navTo("third");
				oThirdRouteMatchedSpy.getCall(0).returnValue.then(function (oObject) {
					assert.strictEqual(oTitleChangedSpy.callCount, 2, "The title change event should be fired the second time");
					assert.strictEqual(oTitleChangedSpy.getCall(1).args[0].getParameter("title"), "TitleView1", "The title 'TitleView1' should be correct");

					var oChildComponent = oObject.view.getComponentInstance();
					var oChildRouter = oChildComponent.getRouter();
					var oView1RouteMatchedSpy = sinon.spy(oChildRouter.getRoute("view2"), "_routeMatched");

					oChildRouter.navTo("view2");
					oView1RouteMatchedSpy.getCall(0).returnValue.then(function (oObject) {
						assert.strictEqual(oTitleChangedSpy.callCount, 2, "The title change event shouldn't fired, as title isn't resolved");

						var oGrandChildComponent = oObject.view.getComponentInstance();

						var oGrandChildRouter = oGrandChildComponent.getRouter();
						var oGrandChildView2RouteMatchedSpy = sinon.spy(oGrandChildRouter.getRoute("view2"), "_routeMatched");

						oGrandChildRouter.navTo("view2");
						oGrandChildView2RouteMatchedSpy.getCall(0).returnValue.then(function(oObject) {
							assert.strictEqual(oTitleChangedSpy.callCount, 3, "The title change event should be the third time");
							assert.strictEqual(oTitleChangedSpy.getCall(2).args[0].getParameter("title"), "MyGrandChildView2Title", "The title 'MyGrandChildView2Title' should be correct");

							oGrandChildComponent.getModel().setProperty("/GrandChildComponentViewTitle", "Bar");
							setTimeout(function() {
								assert.strictEqual(oTitleChangedSpy.callCount, 3, "The title change event shouldn't be fired as Router has navigated to a different route");

								oSecondRouteMatchedSpy.restore();
								oComponent.destroy();
								done();
							}, 0);
						});
					});
				});
			}.bind(this));
		}.bind(this));
	});

	QUnit.module("component", {
		beforeEach: function () {
			return createXmlView().then(function (oView) {
				this.oView = oView;
				this.fnGenericCreateViewStub = this.stub(View, "_create").callsFake(function () {
					return oView;
				});
			}.bind(this));
		}
	});

	QUnit.test("Should create a view with an component", function (assert) {
		// Arrange
		var oUIComponent = new UIComponent({}),
			fnOwnerSpy = this.spy(oUIComponent, "runAsOwner"),
			oRouter = fnCreateRouter({}, {}, oUIComponent);

		// Act
		oRouter.getView("foo", ViewType.XML);

		// Assert
		assert.strictEqual(fnOwnerSpy.callCount, 1, "Did run with owner");
		assert.ok(fnOwnerSpy.calledBefore(this.fnGenericCreateViewStub), "Did invoke the owner function before creating the view");

		// Cleanup
		oRouter.destroy();
	});

	QUnit.module("targets", {
		beforeEach: function () {
			this.oEventProviderStub = sinon.stub(EventProvider.prototype.oEventPool, "returnObject");
			this.oShell = new ShellSubstitute();
			this.oChildShell = new ShellSubstitute();
			this.oSecondShell = new ShellSubstitute();
			this.sPattern = "anything";

			this.oDefaults = {
				viewType: "XML",
				// we stub the view creation
				viewPath: "bar",
				viewName: "foo",
				// only shells will be used
				controlAggregation: "content"
			};

			this.oRouterConfig = {
				routeName : {
					pattern : this.sPattern
				}
			};

			return createXmlView().then(function(oView){
				this.oView = oView;
			}.bind(this));
		},
		afterEach: function () {
			this.oEventProviderStub.restore();
			this.oRouter.destroy();
			this.oShell.destroy();
			this.oChildShell.destroy();
			this.oSecondShell.destroy();
		}
	});

	QUnit.test("Should display a target referenced by a route", function (assert) {
		// Arrange
		this.stub(Views.prototype, "_getView").callsFake(function () {
			return Promise.resolve(this.oView);
		}.bind(this));

		var oTargetConfig = {
			myTarget : {
				controlId: this.oShell.getId()
			}
		};
		this.oRouterConfig.routeName.target = "myTarget";

		// System under test
		this.oRouter = fnCreateRouter(this.oRouterConfig, this.oDefaults, null, oTargetConfig);
		var oTarget = this.oRouter.getTarget("myTarget");
		var oPlaceSpy = this.spy(oTarget, "_place");
		var oRouteMatchedSpy = this.spy(this.oRouter.getRoute("routeName"), "_routeMatched");
		var oDisplayEventSpy = this.spy();

		oTarget.attachDisplay(oDisplayEventSpy);

		// Act
		this.oRouter.parse(this.sPattern);

		return oRouteMatchedSpy.returnValues[0].then(function() {
			// Assert
			assert.strictEqual(this.oRouter._oTargets._oCache, this.oRouter._oViews, "Targets are using the same view repository");
			assert.strictEqual(this.oRouter._oTargets._oConfig, this.oDefaults, "Targets are using the same defaults as the router");

			assert.equal(oDisplayEventSpy.callCount, 1, "The display event hander is called");
			assert.equal(oDisplayEventSpy.getCall(0).args[0].getParameter("routeRelevant"), true, "The routeRelevant parameter is set with true for static target");

			assert.strictEqual(oPlaceSpy.callCount, 1, "Did place myTarget");
			sinon.assert.calledOn(oPlaceSpy, this.oRouter.getTarget("myTarget"));

			assert.strictEqual(this.oShell.getContent().length, 1, "Did place the view in the shell");
		}.bind(this));

	});

	QUnit.test("Should display multiple targets referenced by a route", function (assert) {
		// Arrange
		this.stub(Views.prototype, "_getView").callsFake(function () {
			return createXmlView();
		});

		var oTargetConfig = {
			myTarget : {
				controlId: this.oShell.getId()
			},
			secondTarget: {
				controlId: this.oSecondShell.getId()
			}
		};
		this.oRouterConfig.routeName.target = ["myTarget", "secondTarget"];

		// System under test
		this.oRouter = fnCreateRouter(this.oRouterConfig, this.oDefaults, null, oTargetConfig);
		var oPlaceMyTargetSpy = this.spy(this.oRouter.getTarget("myTarget"), "_place");
		var oPlaceSecondTargetSpy = this.spy(this.oRouter.getTarget("secondTarget"), "_place");
		var oRouteMatchedSpy = this.spy(this.oRouter.getRoute("routeName"), "_routeMatched");

		// Act
		this.oRouter.parse(this.sPattern);

		return oRouteMatchedSpy.returnValues[0].then(function() {
			// Assert
			assert.strictEqual(oPlaceMyTargetSpy.callCount, 1, "Did place first target");
			assert.strictEqual(oPlaceSecondTargetSpy.callCount, 1, "Did place second target");

			sinon.assert.calledOn(oPlaceMyTargetSpy, this.oRouter.getTarget("myTarget"));
			sinon.assert.calledOn(oPlaceSecondTargetSpy, this.oRouter.getTarget("secondTarget"));

			assert.strictEqual(this.oShell.getContent().length, 1, "Did place the view in the shell");
			assert.strictEqual(this.oSecondShell.getContent().length, 1, "Did place the view in the second shell");
		}.bind(this));
	});

	QUnit.test("Should display child targets referenced by a route", function (assert) {
		// Arrange
		this.stub(Views.prototype, "_getView").callsFake(function () {
			return createXmlView();
		});

		var oTargetConfig = {
			myTarget : {
				controlId: this.oShell.getId()
			},
			myChild : {
				parent: "myTarget",
				controlId: this.oSecondShell.getId()
			}
		};
		this.oRouterConfig.routeName.target = ["myChild"];

		// System under test
		this.oRouter = fnCreateRouter(this.oRouterConfig, this.oDefaults, null, oTargetConfig);
		// need to use sinon.spy instead of this.spy because this.spy is restored synchronously but this test
		// has timeout in it.
		var oPlaceSpy = this.spy(this.oRouter.getTarget("myChild"), "_place");
		var oPlaceParentSpy = this.spy(this.oRouter.getTarget("myTarget"), "_place");
		var oRouteMatchedSpy = this.spy(this.oRouter.getRoute("routeName"), "_routeMatched");

		// Act
		this.oRouter.parse(this.sPattern);

		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "route is matched");

		return oRouteMatchedSpy.returnValues[0].then(function() {
			// Assert
			assert.strictEqual(this.oRouter._oTargets._oCache, this.oRouter._oViews, "Targets are using the same view repository");
			assert.strictEqual(this.oRouter._oTargets._oConfig, this.oDefaults, "Targets are using the same defaults as the router");

			assert.strictEqual(oPlaceSpy.callCount, 1, "Did place myChild");
			assert.strictEqual(oPlaceParentSpy.callCount, 1, "Did place myTarget");

			oPlaceParentSpy.returnValues[0].then(function(oViewInfo) {
				assert.strictEqual(oViewInfo.name, "myTarget");
			});

			oPlaceSpy.returnValues[0].then(function(oViewInfo) {
				assert.strictEqual(oViewInfo.name, "myChild");
			});

			sinon.assert.calledOn(oPlaceParentSpy, this.oRouter.getTarget("myTarget"));
			sinon.assert.calledOn(oPlaceSpy, this.oRouter.getTarget("myChild"));

			assert.strictEqual(this.oShell.getContent().length, 1, "Did place the view in the shell");
			assert.strictEqual(this.oSecondShell.getContent().length, 1, "Did place the view in the shell");
		}.bind(this));

	});

	QUnit.test("'resetHash' should be done only for the active router after a target is manually displayed", function(assert) {
		var that = this;
		// Arrange
		this.stub(Views.prototype, "_getView").callsFake(function () {
			return Promise.resolve(this.oView);
		}.bind(this));

		var oTargetConfig = {
			myTarget : {
				controlId: this.oShell.getId()
			}
		};

		// System under test
		this.oRouter = fnCreateRouter(this.oRouterConfig, this.oDefaults, null, oTargetConfig);
		var oSecondRouter = fnCreateRouter(this.oRouterConfig, this.oDefaults, null, oTargetConfig);

		// initialize the secondRouter first and then the this.oRouter
		// this.oRouter should be the current active router
		oSecondRouter.initialize();
		this.oRouter.initialize();


		assert.strictEqual(this.oRouter.getHashChanger(), oSecondRouter.getHashChanger(), "Both router share the same hash changer");

		// display a target with the secondRouter manually
		return oSecondRouter.getTargets().display("myTarget").then(function() {
			var sHash = oSecondRouter.getHashChanger().getHash();
			assert.notOk(sHash === undefined, "The hash in the HashChanger shouldn't be reset");
		}).then(function() {
			// display a target with this.oRouter manually
			return that.oRouter.getTargets().display("myTarget");
		}).then(function() {
			var sHash = that.oRouter.getHashChanger().getHash();
			assert.ok(sHash === undefined, "The hash in the HashChanger should be reset");
			oSecondRouter.destroy();
		});
	});

	QUnit.module("getTargets");

	QUnit.test("Should get the created targets instance", function (assert) {
		// System under test + arrange
		var oRouter = fnCreateRouter({}, {}, null, {});

		assert.strictEqual(oRouter.getTargets(), oRouter._oTargets, "Did return the Targets instance");
	});

	QUnit.test("Should return undefined if no targets where defined", function (assert) {

		// System under test + arrange
		var oRouter = fnCreateRouter();

		assert.strictEqual(oRouter.getTargets(), undefined, "Did not create a Targets instance");
	});

	QUnit.module("bypassed", {
		beforeEach: function () {
			HashChanger.getInstance().replaceHash("test");
		},
		afterEach: function () {
			this.oRouter.destroy();
			HashChanger.getInstance().replaceHash("");
		}
	});

	QUnit.test("Should attach and detach the bypassed event", function (assert) {
		// Arrange + System under test
		var oListener = {},
			oData = {},
			fnBypassed = this.spy(function (oEvent, oDataInner) {
				var oParameters = oEvent.getParameters();

				assert.strictEqual(this, oListener, "this pointer is correct");
				assert.strictEqual(oData, oDataInner, "the data was passed");
				assert.strictEqual(oParameters.hash, "test","the hash was passed");
			});

		this.oRouter = fnCreateRouter([
			{
				name: "bar",
				pattern: "bar"
			}
		]);

		// Act router does not have a route that matches the pattern set in the setup
		var oReturnValue = this.oRouter.attachBypassed(oData, fnBypassed, oListener);
		this.oRouter.initialize();

		//Assert
		assert.strictEqual(fnBypassed.callCount, 1, "Did call the callback function once");
		assert.strictEqual(this.oRouter, oReturnValue, "Able to chain attach");

		// Act no bypass
		this.oRouter.parse("bar");
		assert.strictEqual(fnBypassed.callCount, 1, "Did not call the callback function for no bypass");

		// Act detach
		oReturnValue = this.oRouter.detachBypassed(fnBypassed, oListener);
		this.oRouter.parse("foo");

		// Assert detach
		assert.strictEqual(fnBypassed.callCount, 1, "The function is still invoked once");
		assert.strictEqual(this.oRouter, oReturnValue, "Able to chain detach");
	});

	QUnit.test("Should create targets in the bypassed event", function (assert) {
		// Arrange
		this.oRouter = fnCreateRouter([], {
				viewType: "JS",
				view : "nonExistingView",
				bypassed : {
					target: ["foo", "bar"]
				}
			},
			null,
			{
				foo: {
				},
				bar: {
				}
			});

		var done = assert.async(),
			fnBypassed = this.spy(function() {
				assert.ok(true, "bypass event is fired");
				done();
			});

		this.oRouter.attachBypassed(fnBypassed);

		var fnDisplayFooStub = this.stub(this.oRouter.getTarget("foo"), "_display").callsFake(function() {
				return Promise.resolve();
			}),
			fnDisplayBarStub = this.stub(this.oRouter.getTarget("bar"), "_display").callsFake(function() {
				return Promise.resolve().then(function() {
					assert.strictEqual(fnBypassed.callCount, 0, "bypass event isn't fired yet");
				});
			});

		// Act
		this.oRouter.initialize();

		// Assert
		assert.strictEqual(fnDisplayFooStub.callCount, 1, "The foo target is displayed");
		assert.strictEqual(fnDisplayBarStub.callCount, 1, "The bar target is displayed");
		sinon.assert.calledWith(fnDisplayFooStub, sinon.match({ hash: "test"}));
		sinon.assert.calledWith(fnDisplayBarStub, sinon.match({ hash: "test"}));
	});

	QUnit.module("Bug fix in Crossroads");

	QUnit.test("slash should be optional when it's between ')' and ':'", function (assert) {
		var callCount = 0,
			fnMatched = function (oEvent) {
				if (oEvent.getParameter("name") === "test") {
					callCount++;
				}
			};

		var oRouter = fnCreateRouter([{
			name: "test",
			pattern: "product({id1})/:id2:"
		}]);

		var oRoute = oRouter.getRoute("test");
		var oRouteMatchedSpy = this.spy(oRoute, "_routeMatched");

		oRouter.attachRoutePatternMatched(fnMatched);

		// Act
		oRouter.initialize();
		oRouter.parse("product(1)");

		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched is called");
		return oRouteMatchedSpy.returnValues[0].then(function() {
			// Assert
			assert.strictEqual(callCount, 1, "The route pattern matched handler should be called once");
			oRouter.destroy();
		});
	});

	QUnit.test("Hash 'page12' shouldn't match pattern 'page1/:context:'", function(assert) {
		var oRouter = fnCreateRouter([{
				name: "page1",
				pattern: "page1/:context:"
			}, {
				name: "page12",
				pattern: "page12/:context:"
			}]);

		var oRoute = oRouter.getRoute("page12");
		var oRouteMatchedSpy = this.spy(oRoute, "_routeMatched");

		// Act
		oRouter.initialize();
		oRouter.parse("page12");

		// Assert
		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched is called");

		return oRouteMatchedSpy.returnValues[0].then(function() {
			oRouter.destroy();
		});
	});

	QUnit.test("Interpolate on pattern with multiple optional params", function(assert) {
		var oRouter = new Router([{
				name: "page1",
				pattern: "page1/:context:/:context1:"
			}]),
			sUrl;

		//Act
		sUrl = oRouter.getURL("page1", {
			context1: "context1"
		});

		assert.equal(sUrl, "page1//context1", "the URL should be correctly calculated");
	});

	QUnit.test("Correctly parse the hash with skipped optional params", function(assert) {
		var oRouter = fnCreateRouter([{
			name: "testWithOptionalParams",
			pattern: "test/:a:/:b:/:c:/:d:"
		}]);

		var oRoute = oRouter.getRoute("testWithOptionalParams");
		var oRouteMatchedSpy = this.spy(oRoute, "_routeMatched");

		// Act
		oRouter.initialize();
		oRouter.parse("test/1//3"); // {a: "1", c: "3"}
		oRouter.parse("test//2//4"); // {b: "2", d: "4"}
		oRouter.parse("test///3"); // {c: "3"}
		oRouter.parse("test/1///4"); // {a: "1", d: "4"}
		oRouter.parse("test////4"); // {d: "4"}

		// Assert
		assert.strictEqual(oRouteMatchedSpy.callCount, 5, "_routeMatched is called");
		var aExpected = [
			{a: "1", c: "3"},
			{b: "2", d: "4"},
			{c: "3"},
			{a: "1", d: "4"},
			{d: "4"}
		];
		var aCalls = oRouteMatchedSpy.getCalls();
		aCalls.forEach(function(oCall, index) {
			var oParam = oCall.args[0];
			// remove properties which are set with undefined
			// to easily compare it with the value in aExpected
			Object.keys(oParam).forEach(function(sKey) {
				if (oParam[sKey] === undefined) {
					delete oParam[sKey];
				}
			});
			assert.deepEqual(oParam, aExpected[index], "results parsed correctly");
		});

		return oRouteMatchedSpy.returnValues[aCalls.length - 1].then(function() {
			oRouter.destroy();
		});
	});

	QUnit.test("Interpolate query parameter with '#' sign", function(assert) {
		var oRouter = fnCreateRouter([{
			name: "queryParamWithPound",
			pattern: "{?query}"
		}]);


		// Act
		var sHash = oRouter.getURL("queryParamWithPound", {
			"?query": {
				"a": "#b#c#",
				"#d#e#f": "g"
			}
		});

		// assert
		assert.equal(sHash, "?a=#b#c#&#d#e#f=g", "Hash can be constructed correctly");

		oRouter.destroy();
	});

	QUnit.module("Typed View", {
		beforeEach: function() {
			hasher.setHash("");
			this.oShell = new ShellSubstitute();
			this.oRouter = fnCreateRouter([{
				name: "typed",
				pattern: "typedView",
				target: "typedView"
			}], {async: true}, null, {
				typedView: {
					type: "View",
					name: "module:test/routing/target/TypedView",
					id: "myView",
					controlId: this.oShell.getId(),
					controlAggregation: "content"
				}
			});
		},
		afterEach: function() {
			this.oRouter.destroy();
			this.oShell.destroy();
		}
	});

	QUnit.test("navTo a route that displays a Typed View target", function(assert) {
		var oRoute = this.oRouter.getRoute("typed");
		var oRouteMatchedSpy = sinon.spy(oRoute, "_routeMatched");
		this.oRouter.initialize();
		this.oRouter.navTo("typed");

		assert.equal(oRouteMatchedSpy.callCount, 1, "The route is matched");
		return oRouteMatchedSpy.getCall(0).returnValue.then(function(oRouteMatchedInfo) {
			var oView = oRouteMatchedInfo.view;
			assert.equal(oView.getId(), "myView", "The view is created with the given Id");

			var oPanel = oView.byId("myPanel");
			assert.ok(oPanel.isA("sap.m.Panel"), "The view's content is created");

			oRouteMatchedSpy.restore();
		});
	});

	QUnit.module("Special Asynchronity Combination Among Component, Root View", {
		beforeEach: function() {
			hasher.setHash("");
		}
	});

	QUnit.test("Async Component with sync root view and router initialize in controller of root view", function(assert) {
		var oFireRouteMatchedSpy = sinon.spy(Router.prototype, "fireRouteMatched");
		return Component.create({
			name: "test.routing.target.syncrootview",
			manifest: false
		}).then(function(oComponent){
			return new Promise(function(resolve, reject) {
				var oRootView = oComponent.getRootControl();
				var oRouter = oComponent.getRouter();

				function check() {
					var oContainer = oRootView.byId("container");
					assert.equal(oContainer.getPages().length, 1, "The target view is added to the container");

					var oPanel = oContainer.getPages()[0].byId("panel");
					assert.ok(oPanel.isA("sap.m.Panel"), "The home target is displayed");

					oComponent.destroy();
					oFireRouteMatchedSpy.restore();
					resolve();
				}

				if (oFireRouteMatchedSpy.callCount == 1) {
					check();
				} else {
					oRouter.attachRouteMatched(function() {
						check();
					});
				}
			});
		});
	});

	QUnit.module("nested components", {
		beforeEach: function() {
			hasher.setHash("");
			var that = this;
			this.fnInitRouter = function() {
				UIComponent.prototype.init.apply(this, arguments);
				this._router = this.getRouter();
				this._router.initialize();
			};

			var ParentComponent,
				ChildComponent;

			ParentComponent = UIComponent.extend("namespace.ParentComponent", {
				metadata : {
					routing:  {
						config: {
							async: true
						},
						routes: [
							{
								pattern: "category/{id}",
								name: "category"
							}
						]
					}
				},
				createContent: function() {
					that.oChildComponent = new ChildComponent("child");
					return sap.ui.jsview("view", {
						content: that.oChildComponent
					});
				},
				init : that.fnInitRouter
			});

			ChildComponent = UIComponent.extend("namespace.ChildComponent", {
				metadata : {
					routing:  {
						config: {
							async: true
						},
						routes: [
							{
								pattern: "product/{id}",
								name: "product",
								parent: "namespace.ParentComponent:category"
							}
						]
					}
				},
				init : that.fnInitRouter
			});

			this.oParentComponent = new ParentComponent("parent");
		},
		afterEach: function () {
			this.oParentComponent.destroy();
			this.oChildComponent.destroy();
		}
	});

	QUnit.test("fire events", function(assert) {
		// Arrange
		var oParentRouteMatchedEvent,
			oParentRouteMatchedEventSpy = sinon.spy(function(oEvent) {
				// save the oEvent because EventProvider will overwrite it otherwise
				oParentRouteMatchedEvent = jQuery.extend(true, {}, oEvent);
			}),
			oParentRoutePatternMatchedEventSpy = sinon.spy(),
			oChildRouteMatchedEvent,
			oChildRouteMatchedEventSpy = sinon.spy(function(oEvent) {
				oChildRouteMatchedEvent = jQuery.extend(true, {}, oEvent);
			}),
			oChildRoutePatternMatchedEventSpy = sinon.spy(),
			oParentRoute = this.oParentComponent.getRouter().getRoute("category"),
			oChildRoute = this.oChildComponent.getRouter().getRoute("product"),
			oParentRouteMatchedSpy = sinon.spy(oParentRoute, "_routeMatched"),
			oChildRouteMatchedSpy = sinon.spy(oChildRoute, "_routeMatched");

		oParentRoute.attachMatched(oParentRouteMatchedEventSpy);
		oParentRoute.attachPatternMatched(oParentRoutePatternMatchedEventSpy);
		oChildRoute.attachMatched(oChildRouteMatchedEventSpy);
		oChildRoute.attachPatternMatched(oChildRoutePatternMatchedEventSpy);

		// Act
		hasher.setHash("category/0/product/0");

		// Assert
		assert.strictEqual(oParentRouteMatchedSpy.callCount, 1, "Parent should be matched");
		assert.strictEqual(oChildRouteMatchedSpy.callCount, 1, "Child is matched");

		return Promise.all([oParentRouteMatchedSpy.returnValues[0], oChildRouteMatchedSpy.returnValues[0]]).then(function() {
			assert.strictEqual(oParentRouteMatchedEventSpy.callCount, 1, "routeMatched fired for parent route");
			assert.strictEqual(oParentRoutePatternMatchedEventSpy.callCount, 0, "routePatternMatched not fired for parent route");
			assert.strictEqual(oParentRouteMatchedEvent.getParameter("nestedRoute"), oChildRoute, "childRoute is passed to event listeners");
			assert.strictEqual(oChildRouteMatchedEventSpy.callCount, 1, "routeMatched fired for child route");
			assert.strictEqual(oChildRoutePatternMatchedEventSpy.callCount, 1, "routePatternMatched fired for child route");
			assert.strictEqual(oChildRouteMatchedEvent.getParameter("nestedRoute"), undefined, "no route is passed to event listeners");
		});
	});

	QUnit.test("nesting for multiple components", function(assert) {
		// This is a pretty extensive test to cover any number of components being nested.
		// It covers also the scope of the previous test, but on a more generic level.

		// Arrange
		var that = this,
			iNumberOfComponents = 3,
			aComponents = [],
			aComponentInstances = [],
			aRoutes = [],
			aRouteMatchedSpies = [],
			aRouteMatchedEvents = [],
			aRouteMatchedEventSpies = [],
			aRoutePatternMatchedSpies = [],
			// We declare components in a function to be able to cover any number
			fnDeclareComponent = function(i, iDepth) {
				var Component = UIComponent.extend("namespace.Component" + i, {
					metadata : {
						routing:  {
							config: {
								async: true
							},
							routes: [
								{
									pattern: "route" + i + "/{id}",
									name: "route" + i,
									// set no parent for the (root-) route
									parent: (i != 0) ? "namespace.Component" + (( i - 1 ) + ":route" + ( i - 1 )) : undefined
								}
							]
						}
					},
					createContent: function() {
						// instantiate "child-"routes for all routes except the directly matched one
						if (i < (iDepth - 1)) {
							// store pointers to the instances for later usage
							aComponentInstances[i + 1] = new aComponents[i + 1]("component" + (i + 1));
							return sap.ui.jsview("view", {
								content: aComponentInstances[i + 1]
							});
						}
					},
					init : that.fnInitRouter
				});
				aComponents.push(Component);
			},
			fnDeclareComponents = function(iDepth) {
				for (var i = 0; i < iDepth; i++) {
					fnDeclareComponent(i, iDepth);
				}
				return aComponents[0];
			};

		// start instantion
		var Component = fnDeclareComponents(iNumberOfComponents);
		aComponentInstances[0] = new Component("component0");

		// Create spies and attach events for all component instances
		aComponentInstances.forEach(function(oComponent, i) {
			aRoutes[i] = oComponent.getRouter().getRoute("route" + i);
			aRouteMatchedEventSpies[i] = sinon.spy(function(oEvent) {
				// save the oEvent because EventProvider will overwrite it otherwise
				aRouteMatchedEvents[i] = jQuery.extend(true, {}, oEvent);
			});
			aRouteMatchedSpies[i] = sinon.spy(aRoutes[i], "_routeMatched");
			aRoutePatternMatchedSpies[i] = sinon.spy();
			aRoutes[i].attachMatched(aRouteMatchedEventSpies[i]);
			aRoutes[i].attachPatternMatched(aRoutePatternMatchedSpies[i]);
		});

		var sHash = "";
		for (var i = 0; i < iNumberOfComponents; i++) {
			sHash += "/route" + i + "/0";
		}

		// Act
		// remove the first slash as it will be implicitly added
		hasher.setHash(sHash.substring(1));

		var aPromises = aRouteMatchedSpies.map(function(oRouteMatchSpy) {
			assert.strictEqual(oRouteMatchSpy.callCount, 1, "_routeMatched is called");
			return oRouteMatchSpy.returnValues[0];
		});

		return Promise.all(aPromises).then(function() {
			// Assert
			aRouteMatchedEvents.forEach(function(oEvent, i, a) {
				if (i === a.length - 1) {
					assert.strictEqual(oEvent.getParameter("nestedRoute"), undefined, "no nested route is passed to the directly matched " + oEvent.getParameter("name"));
					assert.strictEqual(aRoutePatternMatchedSpies[i].callCount, 1, "pattern matched has been fired for the directly matched " + oEvent.getParameter("name"));
				} else {
					assert.strictEqual(oEvent.getParameter("nestedRoute"), aRoutes[i + 1], aRoutes[i + 1] + " nested route is passed to " + oEvent.getParameter("name"));
					assert.strictEqual(aRoutePatternMatchedSpies[i].callCount, 0, "pattern matched has not been fired for " + oEvent.getParameter("name"));
				}
			});

			// CleanUp
			aComponentInstances.forEach(function(oComponent) {
				oComponent.destroy();
			});
		});
	});

	function resetBrowserHash() {
		HashChanger.getInstance().fireHashChanged("");
		hasher.setHash("");
	}

	function waitTillRouteMatched(oRouter, sRoute) {
		var oRoute = oRouter.getRoute(sRoute),
			fnRouteMatched;
		if (oRoute) {
			return new Promise(function(resolve, reject) {
				fnRouteMatched = function(oEvent) {
					oRoute.detachMatched(fnRouteMatched);
					resolve(oEvent.getParameters());
				};
				oRoute.attachMatched(fnRouteMatched);
			});
		} else {
			return Promise.reject("Route " + sRoute + " can't be found");
		}
	}

	var count = 0;
	QUnit.module("Router in nested component", {
		beforeEach: function() {
			this.oEventProviderStub = sinon.stub(EventProvider.prototype.oEventPool, "returnObject");
			resetBrowserHash();
			var that = this;
			this.fnInitRouter = function() {
				UIComponent.prototype.init.apply(this, arguments);
				this._router = this.getRouter();
				this._router.initialize();
			};

			sap.ui.jsview("rootView1", {
				createContent : function() {
					return new VBox(this.createId("box"), {
						items: [
							new ShellSubstitute(this.createId("shell"))
						]
					});
				}
			});

			sap.ui.jsview("namespace1.footer" + count, {
				createContent : function() {
					return new Button({
						text: "abc"
					});
				}
			});

			var ParentComponent;
			ParentComponent = UIComponent.extend("namespace1.ParentComponent" + count, {
				metadata : {
					rootView: {
						viewName: "rootView1",
						type: "JS",
						async: true
					},
					routing:  {
						config: {
							async: true
						},
						routes: [
							{
								pattern: "",
								name: "home",
								target: [ {
									name: "home",
									prefix: "child"
								}, "footer"]
							},
							{
								pattern: "category",
								name: "category"
							}
						],
						targets: {
							home: {
								name: "namespace1.ChildComponent" + count,
								type: "Component",
								clearControlAggregation: true,
								controlId: "shell",
								controlAggregation: "content",
								options: {
									manifest: false
								}
							},
							footer: {
								type: "View",
								viewType: "JS",
								name: "namespace1.footer" + count,
								controlId: "box",
								controlAggregation: "items"
							}
						}
					}
				},
				init : that.fnInitRouter
			});

			this.oNestedRouteMatchedSpy = sinon.spy();

			sap.ui.predefine("namespace1/ChildComponent" + count + "/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
				return UIComponent.extend("namespace1.ChildComponent" + count, {
					metadata : {
						routing:  {
							config: {
								async: true
							},
							routes: [
								{
									pattern: "product/{id}",
									name: "product"
								},
								{
									pattern: "",
									name: "nestedHome"
								}
							]
						}
					},
					init : function() {
						UIComponent.prototype.init.apply(this, arguments);
						var oRouter = this.getRouter();

						oRouter.attachRouteMatched(that.oNestedRouteMatchedSpy);
						oRouter.initialize();
					}
				});
			});

			this.oParentComponent = new ParentComponent("parent");
		},
		afterEach: function () {
			this.oParentComponent.destroy();
			this.oEventProviderStub.restore();
			count++;
		}
	});

	QUnit.test("Should load and instantiate the nested component when the home route is matched", function(assert) {
		var that = this,
			oRouter = this.oParentComponent.getRouter();

		return new Promise(function(resolve, reject) {
			oRouter.getRoute("home").attachMatched(function() {
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell");
				assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
				assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

				var oNestedComponent = oShell.getContent()[0].getComponentInstance();
				assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
				assert.equal(that.oNestedRouteMatchedSpy.callCount, 1, "Route is matched once inside the nested component");

				var oEvent = that.oNestedRouteMatchedSpy.args[0][0];
				assert.equal(oEvent.getParameter("name"), "nestedHome", "The route with empty string pattern is matched");
				oNestedComponent.destroy();
				resolve();
			});
		});
	});

	QUnit.test("Should stop the router in nested component when another route in the parent router is matched", function(assert) {
		var that = this,
			oRouter = this.oParentComponent.getRouter();

		return new Promise(function(resolve, reject) {
			oRouter.getRoute("home").attachMatched(function() {
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell");

				var oNestedComponent = oShell.getContent()[0].getComponentInstance();

				resolve(oNestedComponent);
			});
		}).then(function(oNestedComponent) {
			var oNestedRouter = oNestedComponent.getRouter();
			var oNestedHomeRoute = oNestedRouter.getRoute("nestedHome");
			var oNestedRouteMatchedSpy = sinon.spy(oNestedHomeRoute, "_routeMatched");
			var oNestedRouterStopSpy = sinon.spy(oNestedRouter, "stop");
			var oPromise = new Promise(function(resolve, reject) {
				oRouter.getRoute("category").attachMatched(function() {
					assert.equal(oNestedRouteMatchedSpy.callCount, 0, "The home route in nested router shouldn't be matched again");
					assert.equal(oNestedRouterStopSpy.callCount, 1, "The Router in nested component is stopped");
					oNestedComponent.destroy();
					resolve();
				});
				oRouter.navTo("category");
			});
			return oPromise;
		});
	});

	QUnit.test("Should initialize the router in nested component again once the route is matched again which has loaded the nested component", function(assert) {
		var that = this,
			oRouter = this.oParentComponent.getRouter();

		return new Promise(function(resolve, reject) {
			var fnHomeMatched = function() {
				oRouter.getRoute("home").detachEvent("matched", fnHomeMatched);
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell");

				var oNestedComponent = oShell.getContent()[0].getComponentInstance();

				resolve(oNestedComponent);
			};

			oRouter.getRoute("home").attachMatched(fnHomeMatched);
		}).then(function(oNestedComponent) {
			var oNestedRouter = oNestedComponent.getRouter();
			var oNestedRouterStopSpy = sinon.spy(oNestedRouter, "stop");
			var oPromise = new Promise(function(resolve, reject) {
				oRouter.getRoute("category").attachMatched(function() {
					assert.equal(oNestedRouterStopSpy.callCount, 1, "The Router in nested component is stopped");
					resolve(oNestedComponent);
				});
			});
			oRouter.navTo("category");
			return oPromise;
		}).then(function(oNestedComponent) {
			var iOldCountNestedRouteMatched = that.oNestedRouteMatchedSpy.callCount;
			var oNestedRouter = oNestedComponent.getRouter();
			var oNestedRouterInitSpy = sinon.spy(oNestedRouter, "initialize");
			var oPromise = new Promise(function(resolve, reject) {
				oRouter.getRoute("home").attachMatched(function() {
					assert.equal(oNestedRouterInitSpy.callCount, 1, "The Router in nested component is initialized again");
					assert.equal(that.oNestedRouteMatchedSpy.callCount - iOldCountNestedRouteMatched, 1, "Another routeMatched event is fired in the nested router");
					oNestedComponent.destroy();
					resolve();
				});
			});
			oRouter.navTo("home");
			return oPromise;
		});
	});

	QUnit.test("Should throw an error if a nested component has configured synchronous routing", function(assert){
		var ParentComponent  = UIComponent.extend("namespace.asyc.ParentComponent", {
			metadata: {
				rootView: {
					viewName: "rootView1",
					type: "JS",
					async: true
				},
				routing:  {
					config: {
						async: true
					},
					routes: [
						{
							pattern: "",
							name: "home",
							target: {
								name: "home",
								prefix: "child"
							}
						},
						{
							pattern: "category",
							name: "category"
						}
					],
					targets: {
						home: {
							name: "namespace.sync.ChildComponent",
							type: "Component",
							id: "syncChildComponent",
							controlId: "shell",
							controlAggregation: "content",
							options: {
								manifest: false
							}
						}
					}
				}
			}
		});

		sap.ui.predefine("namespace/sync/ChildComponent/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
			return UIComponent.extend("namespace.sync.ChildComponent", {
				metadata: {
					routing:  {
						config: {
							async: false
						},
						routes: [
							{
								pattern: "product/{id}",
								name: "product"
							},
							{
								pattern: "",
								name: "nestedHome"
							}
						]
					}
				},
				init: function() {
					UIComponent.prototype.init.apply(this, arguments);
					var oRouter = this.getRouter();
					oRouter.initialize();
				}
			});
		});

		var oParentComponent = new ParentComponent("asyncParent");
		var oHomeRoute = oParentComponent.getRouter().getRoute("home");
		var oHomeRouteMatchedSpy = sinon.spy(oHomeRoute, "_routeMatched");
		var done = assert.async();

		oParentComponent.getRouter().initialize();
		assert.equal(oHomeRouteMatchedSpy.callCount, 1, "The home route should be matched once");
		oHomeRouteMatchedSpy.getCall(0).returnValue.catch(function(oError){
			assert.equal(oError.message, "The router of component 'asyncParent---syncChildComponent' which is loaded via the target 'home' is defined as synchronous which is not supported using as a nested component.", "The correct error should be thrown.");
			done();
		});
	});

	QUnit.test("Should suspend a dynamic displayed target when router navigates away from it - routeRelevant: true", function(assert) {
		sap.ui.predefine("namespace1/DynamicChildComponent" + count + "/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
			return UIComponent.extend("namespace1.DynamicChildComponent" + count, {
				metadata : {
					routing:  {
						config: {
							async: true
						},
						routes: [
							{
								pattern: "product/{id}",
								name: "product"
							},
							{
								pattern: "",
								name: "nestedHome"
							}
						]
					}
				},
				init : function() {
					UIComponent.prototype.init.apply(this, arguments);
					var oRouter = this.getRouter();

					oRouter.initialize();
				}
			});
		});

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			sDynamicComponentName = "DynamicChildComponent" + count;

		var oResetHashSpy = sinon.spy(oRouter.getHashChanger(), "resetHash");

		return waitTillRouteMatched(oRouter, "home").then(function(oParams) {
			var oContainer = that.oParentComponent.getRootControl(),
				oShell = oContainer.byId("shell");
			assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
			assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

			var oNestedComponent = oShell.getContent()[0].getComponentInstance();
			assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
			assert.equal(that.oNestedRouteMatchedSpy.callCount, 1, "Route is matched once inside the nested component");
		})
		// Step1: display dynamic component target
		.then(function() {
			// Add dynamic component target
			oRouter.getTargets().addTarget(sDynamicComponentName, {
				name: "namespace1.DynamicChildComponent" + count,
				type: "Component",
				controlId: "shell",
				controlAggregation: "content",
				options: {
					manifest: false
				}
			});

			var fnDisplayed1 = function (oEvent) {
				oRouter.getTargets().detachDisplay(fnDisplayed1);
				assert.equal(oEvent.getParameter("name"), sDynamicComponentName, "correct target is displayed");
			};
			oRouter.getTargets().attachDisplay(fnDisplayed1);

			return oRouter.getTargets().display({
				name: sDynamicComponentName,
				prefix: "dynamic",
				routeRelevant: true
			}).then(function(oTargetInfo) {
				assert.equal(oResetHashSpy.callCount, 0, "resetHash shouldn't be called");
				assert.equal(oRouter.getHashChanger().getHash(), "", "hash should be correct");

				var oControl = oTargetInfo[0].control;
				return Component.getOwnerComponentFor(oControl);
			});
		})
		// Step2: navigate to another route and check whether the dynamic target is suspended
		.then(function(oComponent) {
			var oTarget = oRouter.getTarget(sDynamicComponentName);
			var oTargetSuspendSpy = that.spy(oTarget, "suspend");

			assert.ok(oComponent, "Component should be loaded");

			oRouter.navTo("category");
			return waitTillRouteMatched(oRouter, "category").then(function() {
				assert.equal(oTargetSuspendSpy.callCount, 1, "dynamic displayed target is suspended");
				return {
					targetSuspendSpy: oTargetSuspendSpy
				};
			});
		})
		// Step3: navigate back to home
		.then(function(mParam) {
			var oDisplayEventSpy = that.spy();
			oRouter.getTargets().attachDisplay(oDisplayEventSpy);

			oRouter.navTo("home");

			return waitTillRouteMatched(oRouter, "home").then(function() {
				assert.ok(oDisplayEventSpy.callCount > 0, "Display event handler is called");
				assert.equal(oDisplayEventSpy.getCall(0).args[0].getParameter("name"), "home", "Correct target is displayed");
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell");
				assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
				assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

				var oNestedComponent = oShell.getContent()[0].getComponentInstance();
				assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
				assert.equal(that.oNestedRouteMatchedSpy.callCount, 2, "Route is matched again inside the nested component");
				assert.equal(mParam.targetSuspendSpy.callCount, 1, "Target#suspend shouldn't be called again");

				oResetHashSpy.restore();
				mParam.targetSuspendSpy.restore();
			});
		});
	});

	QUnit.test("Should suspend a dynamic displayed target and its parent when router navigates away from it - routeRelevant: true", function(assert) {
		sap.ui.predefine("namespace1/DynamicChildComponent" + count + "/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
			return UIComponent.extend("namespace1.DynamicChildComponent" + count, {
				metadata : {
					routing:  {
						config: {
							async: true
						},
						routes: [
							{
								pattern: "product/{id}",
								name: "product"
							},
							{
								pattern: "",
								name: "nestedHome"
							}
						]
					}
				},
				init : function() {
					UIComponent.prototype.init.apply(this, arguments);
					var oRouter = this.getRouter();

					oRouter.initialize();
				}
			});
		});

		sap.ui.jsview("DynamicComponentTargetParent", {
			createContent : function() {
				return new VBox(this.createId("box"));
			}
		});

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			sDynamicComponentName = "DynamicChildComponent" + count,
			sParentTarget = sDynamicComponentName + "Parent";

		var oResetHashSpy = sinon.spy(oRouter.getHashChanger(), "resetHash");

		return waitTillRouteMatched(oRouter, "home").then(function(oParams) {
			var oContainer = that.oParentComponent.getRootControl(),
				oShell = oContainer.byId("shell");
			assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
			assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

			var oNestedComponent = oShell.getContent()[0].getComponentInstance();
			assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
			assert.equal(that.oNestedRouteMatchedSpy.callCount, 1, "Route is matched once inside the nested component");
		})
		// Step1: display dynamic component target
		.then(function() {
			oRouter.getTargets().addTarget(sParentTarget, {
				name: "DynamicComponentTargetParent",
				type: "View",
				viewType: "JS",
				controlId: "shell",
				controlAggregation: "content"
			});

			// Add dynamic component target
			oRouter.getTargets().addTarget(sDynamicComponentName, {
				name: "namespace1.DynamicChildComponent" + count,
				type: "Component",
				parent: sParentTarget,
				controlId: "box",
				controlAggregation: "items",
				options: {
					manifest: false
				}
			});

			var aDisplayedTargets = [];

			var fnDisplayed1 = function (oEvent) {
				var sName = oEvent.getParameter("name");
				if (sName === sDynamicComponentName) {
					oRouter.getTargets().detachDisplay(fnDisplayed1);
				}
				aDisplayedTargets.push(sName);
			};
			oRouter.getTargets().attachDisplay(fnDisplayed1);

			return oRouter.getTargets().display({
				name: sDynamicComponentName,
				prefix: "dynamic",
				routeRelevant: true
			}).then(function(oTargetInfo) {
				assert.equal(oResetHashSpy.callCount, 0, "resetHash shouldn't be called");
				assert.equal(oRouter.getHashChanger().getHash(), "", "hash should be correct");
				assert.deepEqual(aDisplayedTargets, [sParentTarget, sDynamicComponentName], "Both parent and dynamic targets are displayed in the correct order");

				var oControl = oTargetInfo[0].control;
				return Component.getOwnerComponentFor(oControl);
			});
		})
		// Step2: navigate to another route and check whether the dynamic target and its parent are suspended
		.then(function(oComponent) {
			var oDynmaicTarget = oRouter.getTarget(sDynamicComponentName);
			var oDynamicTargetSuspendSpy = that.spy(oDynmaicTarget, "suspend");

			var oParentTarget = oRouter.getTarget(sParentTarget);
			var oParentTargetSuspendSpy = that.spy(oParentTarget, "suspend");

			assert.ok(oComponent, "Component should be loaded");

			oRouter.navTo("category");
			return waitTillRouteMatched(oRouter, "category").then(function() {
				assert.equal(oDynamicTargetSuspendSpy.callCount, 1, "dynamic displayed target is suspended");
				assert.equal(oParentTargetSuspendSpy.callCount, 1, "dynamic displayed target's parent is suspended");
				oDynamicTargetSuspendSpy.restore();
				oParentTargetSuspendSpy.restore();
			});
		})
		// Step3: navigate back to home
		.then(function() {
			var oDisplayEventSpy = that.spy();
			oRouter.getTargets().attachDisplay(oDisplayEventSpy);

			oRouter.navTo("home");

			return waitTillRouteMatched(oRouter, "home").then(function() {
				assert.ok(oDisplayEventSpy.callCount > 0, "Display event handler is called");
				assert.equal(oDisplayEventSpy.getCall(0).args[0].getParameter("name"), "home", "Correct target is displayed");
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell");
				assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
				assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

				var oNestedComponent = oShell.getContent()[0].getComponentInstance();
				assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
				assert.equal(that.oNestedRouteMatchedSpy.callCount, 2, "Route is matched again inside the nested component");

				oResetHashSpy.restore();
			});
		});
	});

	QUnit.test("Should not suspend a dynamic displayed target when router navigates away from it - routeRelevant: false", function(assert) {
		sap.ui.predefine("namespace1/DynamicChildComponent" + count + "/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
			return UIComponent.extend("namespace1.DynamicChildComponent" + count, {
				metadata : {
					routing:  {
						config: {
							async: true
						},
						routes: [
							{
								pattern: "product/{id}",
								name: "product"
							},
							{
								pattern: "",
								name: "nestedHome"
							}
						]
					}
				},
				init : function() {
					UIComponent.prototype.init.apply(this, arguments);
					var oRouter = this.getRouter();

					oRouter.initialize();
				}
			});
		});

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			sDynamicComponentName = "DynamicChildComponent" + count;

		var oResetHashSpy = sinon.spy(oRouter.getHashChanger(), "resetHash");

		var oDisplayEventSpy = that.spy();
		oRouter.getTargets().attachDisplay(oDisplayEventSpy);

		return waitTillRouteMatched(oRouter, "home").then(function(oParameters) {
			var oContainer = that.oParentComponent.getRootControl(),
				oShell = oContainer.byId("shell");
			assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
			assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

			var oNestedComponent = oShell.getContent()[0].getComponentInstance();
			assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
			assert.equal(that.oNestedRouteMatchedSpy.callCount, 1, "Route is matched once inside the nested component");
		})
		// Step1: display dynamic component target
		.then(function() {
			// Add dynamic component target
			oRouter.getTargets().addTarget(sDynamicComponentName, {
				name: "namespace1.DynamicChildComponent" + count,
				type: "Component",
				controlId: "shell",
				controlAggregation: "content",
				options: {
					manifest: false
				}
			});

			oDisplayEventSpy.resetHistory();

			return oRouter.getTargets().display({
				name: sDynamicComponentName,
				prefix: "dynamic",
				routeRelevant: false
			}).then(function (oTargetInfo) {
				assert.equal(oDisplayEventSpy.callCount, 1, "The event handler is called");
				assert.equal(oDisplayEventSpy.getCall(0).args[0].getParameter("name"), sDynamicComponentName, "Correct target is displayed");

				assert.equal(oResetHashSpy.callCount, 1, "resetHash should be called once");
				assert.equal(oRouter.getHashChanger().getHash(), undefined, "hash should be reset");

				var oControl = oTargetInfo[0].control;
				return Component.getOwnerComponentFor(oControl);
			});
		})
		// Step2: navigate away from home
		.then(function(oComponent) {
			var oTarget = oRouter.getTarget(sDynamicComponentName);
			var oTargetSuspendSpy = that.spy(oTarget, "suspend");

			assert.ok(oComponent, "Component should be loaded");

			oRouter.navTo("category");
			return waitTillRouteMatched(oRouter, "category").then(function() {
				assert.equal(oTargetSuspendSpy.callCount, 0, "dynamic displayed shouldn't be suspended");
				oTargetSuspendSpy.restore();
			});
		})
		// Step3: navigate back to home
		.then(function() {
			oDisplayEventSpy.resetHistory();
			oRouter.navTo("home");

			return waitTillRouteMatched(oRouter, "home").then(function() {
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell");
				assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
				assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

				var oNestedComponent = oShell.getContent()[0].getComponentInstance();
				assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
				assert.equal(that.oNestedRouteMatchedSpy.callCount, 2, "Route is matched again inside the nested component");

				assert.ok(oDisplayEventSpy.callCount > 0, "The event handler is called");
				assert.equal(oDisplayEventSpy.getCall(0).args[0].getParameter("name"), "home", "Correct target is displayed");

				oResetHashSpy.restore();
			});
		});
	});

	QUnit.test("Should suspend a dynamic displayed target when router navigates away from it - routeRelevant: true, then routeRelevant: false", function (assert) {
		sap.ui.predefine("namespace1/DynamicChildComponent" + count + "/Component", ["sap/ui/core/UIComponent"], function (UIComponent) {
			return UIComponent.extend("namespace1.DynamicChildComponent" + count, {
				metadata: {
					routing: {
						config: {
							async: true
						},
						routes: [
							{
								pattern: "product/{id}",
								name: "product"
							},
							{
								pattern: "",
								name: "nestedHome"
							}
						]
					}
				},
				init: function () {
					UIComponent.prototype.init.apply(this, arguments);
					var oRouter = this.getRouter();

					oRouter.initialize();
				}
			});
		});

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			sDynamicComponentName = "DynamicChildComponent" + count;

		var oResetHashSpy = sinon.spy(oRouter.getHashChanger(), "resetHash");

		var oDisplayEventSpy = that.spy();
		oRouter.getTargets().attachDisplay(oDisplayEventSpy);

		return waitTillRouteMatched(oRouter, "home").then(function() {
			var oContainer = that.oParentComponent.getRootControl(),
				oShell = oContainer.byId("shell");
			assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
			assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

			var oNestedComponent = oShell.getContent()[0].getComponentInstance();
			assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
			assert.equal(that.oNestedRouteMatchedSpy.callCount, 1, "Route is matched once inside the nested component");
		})
		// Step1: Display dynamic component target
		.then(function() {
			// Add dynamic component target
			oRouter.getTargets().addTarget(sDynamicComponentName, {
				name: "namespace1.DynamicChildComponent" + count,
				type: "Component",
				controlId: "shell",
				controlAggregation: "content",
				options: {
					manifest: false
				}
			});

			oDisplayEventSpy.resetHistory();

			return oRouter.getTargets().display({
				name: sDynamicComponentName,
				prefix: "dynamic",
				routeRelevant: true
			}).then(function (oTargetInfo) {
				assert.equal(oDisplayEventSpy.callCount, 1, "The event handler is called");
				assert.equal(oDisplayEventSpy.getCall(0).args[0].getParameter("name"), sDynamicComponentName, "Correct target is displayed");

				assert.equal(oResetHashSpy.callCount, 0, "resetHash shouldn't be called");
				assert.equal(oRouter.getHashChanger().getHash(), "", "hash should be correct");

				var oControl = oTargetInfo[0].control;
				return Component.getOwnerComponentFor(oControl);
			});
		})
		// Step2: navTo "category" route
		.then(function(oComponent) {
			var oTarget = oRouter.getTarget(sDynamicComponentName);
			var oTargetSuspendSpy = that.spy(oTarget, "suspend");

			assert.ok(oComponent, "Component should be loaded");

			oRouter.navTo("category");
			return waitTillRouteMatched(oRouter, "category").then(function() {
				assert.equal(oTargetSuspendSpy.callCount, 1, "dynamic displayed target is suspended");
				oTargetSuspendSpy.restore();
			});
		})
		// Step3: navTo "home" route
		.then(function() {
			oDisplayEventSpy.resetHistory();

			oRouter.navTo("home");

			return waitTillRouteMatched(oRouter, "home").then(function() {
				assert.ok(oDisplayEventSpy.callCount > 0, "The event handler is called");
				assert.equal(oDisplayEventSpy.getCall(0).args[0].getParameter("name"), "home", "Correct target is displayed");

				assert.ok(oRouter.getTargets().getTarget(sDynamicComponentName), "dynamic component target should be available.");
			});

		})
		// Step4: display dynamic target again
		.then(function() {
			oDisplayEventSpy.resetHistory();

			return oRouter.getTargets().display({
				name: sDynamicComponentName,
				prefix: "dynamic"
			}).then(function() {
				assert.equal(oDisplayEventSpy.callCount, 1, "The event handler is called");
				assert.equal(oDisplayEventSpy.getCall(0).args[0].getParameter("name"), sDynamicComponentName, "Correct target is displayed");
				assert.strictEqual(oDisplayEventSpy.getCall(0).args[0].getParameter("routeRelevant"), false, "'routeRelevant' is defaulted to false");

				assert.equal(oResetHashSpy.callCount, 1, "resetHash should be called");
				assert.equal(oRouter.getHashChanger().getHash(), undefined, "hash should be undefined");

				oResetHashSpy.restore();
			});
		});
	});

	QUnit.test("Should initialize a dynamic displayed target when parent router is initialized without parsing the current hash", function(assert) {
		sap.ui.predefine("namespace1/DynamicChildComponent" + count + "/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
			return UIComponent.extend("namespace1.DynamicChildComponent" + count, {
				metadata : {
					routing:  {
						config: {
							async: true
						},
						routes: [
							{
								pattern: "product/{id}",
								name: "product"
							},
							{
								pattern: "",
								name: "nestedHome"
							}
						]
					}
				},
				init : function() {
					UIComponent.prototype.init.apply(this, arguments);
					var oRouter = this.getRouter();

					oRouter.initialize();
				}
			});
		});

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			sDynamicComponentName = "DynamicChildComponent" + count;

		return waitTillRouteMatched(oRouter, "home").then(function(oParams) {
			var oContainer = that.oParentComponent.getRootControl(),
				oShell = oContainer.byId("shell");
			assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
			assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

			var oNestedComponent = oShell.getContent()[0].getComponentInstance();
			assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
			assert.equal(that.oNestedRouteMatchedSpy.callCount, 1, "Route is matched once inside the nested component");
		})
		// Step1: display dynamic component target
		.then(function() {
			// Add dynamic component target
			oRouter.getTargets().addTarget(sDynamicComponentName, {
				name: "namespace1.DynamicChildComponent" + count,
				type: "Component",
				controlId: "shell",
				controlAggregation: "content",
				options: {
					manifest: false
				}
			});

			var fnDisplayed1 = function (oEvent) {
				oRouter.getTargets().detachDisplay(fnDisplayed1);
				assert.equal(oEvent.getParameter("name"), sDynamicComponentName, "correct target is displayed");
			};
			oRouter.getTargets().attachDisplay(fnDisplayed1);

			return oRouter.getTargets().display({
				name: sDynamicComponentName,
				prefix: "dynamic",
				routeRelevant: true
			});
		})
		// Step2: stop the router and check whether the dynamic target is suspended
		.then(function(aTargetInfos) {
			var oTarget = oRouter.getTarget(sDynamicComponentName);
			var oTargetSuspendSpy = that.spy(oTarget, "suspend");

			var oNestedComponent = aTargetInfos[0].view.getComponentInstance();
			var oNestedRouter = oNestedComponent.getRouter();

			oRouter.stop();

			assert.equal(oTargetSuspendSpy.callCount, 1, "dynamic displayed target is suspended");
			assert.ok(oNestedRouter.isStopped, "nested router is also stopped");

			return oNestedRouter;
		})
		// Step3: initialize the router without parsing the hash and check the status of the nested router
		.then(function(oNestedRouter) {
			var oNestedInitializeSpy = that.spy(oNestedRouter, "initialize");
			oRouter.initialize(true);

			assert.ok(oNestedRouter.isInitialized(), "nested router is initialized");
			assert.equal(oNestedInitializeSpy.callCount, 1, "the 'initialize' method is called once");
			assert.equal(oNestedInitializeSpy.getCall(0).args[0], true, "The method is called with parameter 'true'");

			oNestedInitializeSpy.restore();
		});
	});

	QUnit.module("Router in IAsyncContentCreation with nested component", {
		beforeEach: function() {
			this.oEventProviderStub = sinon.stub(EventProvider.prototype.oEventPool, "returnObject");
			resetBrowserHash();
			var that = this;
			this.fnInitRouter = function() {
				UIComponent.prototype.init.apply(this, arguments);
				this._router = this.getRouter();
				this._router.initialize();
			};

			sap.ui.jsview("rootView1", {
				createContent : function() {
					return new VBox(this.createId("box"), {
						items: [
							new ShellSubstitute(this.createId("shell"))
						]
					});
				}
			});

			sap.ui.jsview("namespace1.footer" + count, {
				createContent : function() {
					return new Button({
						text: "abc"
					});
				}
			});

			var ParentComponent;
			ParentComponent = UIComponent.extend("namespace1.ParentComponent" + count, {
				metadata : {
					interfaces: ["sap.ui.core.IAsyncContentCreation"],
					rootView: {
						viewName: "rootView1",
						type: "JS"
					},
					routing:  {
						routes: [
							{
								pattern: "",
								name: "home",
								target: [ {
									name: "home",
									prefix: "child"
								}, "footer"]
							},
							{
								pattern: "category",
								name: "category"
							}
						],
						targets: {
							home: {
								name: "namespace1.ChildComponent" + count,
								type: "Component",
								clearControlAggregation: true,
								controlId: "shell",
								controlAggregation: "content",
								options: {
									manifest: false
								}
							},
							footer: {
								type: "View",
								viewType: "JS",
								name: "namespace1.footer" + count,
								controlId: "box",
								controlAggregation: "items"
							}
						}
					}
				},
				init : that.fnInitRouter
			});

			this.oNestedRouteMatchedSpy = sinon.spy();

			sap.ui.predefine("namespace1/ChildComponent" + count + "/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
				return UIComponent.extend("namespace1.ChildComponent" + count, {
					metadata : {
						routing:  {
							config: {
								async: true
							},
							routes: [
								{
									pattern: "product/{id}",
									name: "product"
								},
								{
									pattern: "",
									name: "nestedHome"
								}
							]
						}
					},
					init : function() {
						UIComponent.prototype.init.apply(this, arguments);
						var oRouter = this.getRouter();

						oRouter.attachRouteMatched(that.oNestedRouteMatchedSpy);
						oRouter.initialize();
					}
				});
			});

			this.oParentComponent = new ParentComponent("parent");
		},
		afterEach: function () {
			this.oParentComponent.destroy();
			this.oEventProviderStub.restore();
			count++;
		}
	});

	QUnit.test("Should load and instantiate the nested component when the home route is matched", function(assert) {
		var that = this,
			oRouter = this.oParentComponent.getRouter();

		return new Promise(function(resolve, reject) {
			oRouter.getRoute("home").attachMatched(function() {
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell");
				assert.equal(oShell.getContent().length, 1, "The nested component is loaded and placed into the aggregation");
				assert.ok(oShell.getContent()[0].isA("sap.ui.core.ComponentContainer"), "A component container is added to the target aggregation");

				var oNestedComponent = oShell.getContent()[0].getComponentInstance();
				assert.equal(oNestedComponent.getMetadata().getName(), "namespace1.ChildComponent" + count, "The correct component is loaded and instantiated");
				assert.equal(that.oNestedRouteMatchedSpy.callCount, 1, "Route is matched once inside the nested component");

				var oEvent = that.oNestedRouteMatchedSpy.args[0][0];
				assert.equal(oEvent.getParameter("name"), "nestedHome", "The route with empty string pattern is matched");
				oNestedComponent.destroy();
				resolve();
			});
		});
	});

	QUnit.module("navTo with nested components", {
		beforeEach: function() {
			this.buildNestedComponentStructure = function(level, suffix) {
				this.oEventProviderStub = sinon.stub(EventProvider.prototype.oEventPool, "returnObject");
				hasher.setHash("");
				HashChanger.getInstance().fireHashChanged("");
				var that = this;
				this.fnInitRouter = function() {
					UIComponent.prototype.init.apply(this, arguments);
					this._router = this.getRouter();
					this._router.initialize();
				};

				sap.ui.jsview("rootView1", {
					createContent : function() {
						return new ShellSubstitute(this.createId("shell"));
					}
				});

				sap.ui.jsview("notFound", {
					createContent : function() {
						return new Button({
							text: "Not Found"
						});
					}
				});

				var ParentComponent;

				ParentComponent = UIComponent.extend("namespace." + suffix + ".ParentComponent", {
					metadata : {
						rootView: {
							viewName: "rootView1",
							type: "JS",
							async: true
						},
						routing:  {
							config: {
								async: true
							},
							routes: [
								{
									pattern: "",
									name: "home",
									target: {
										name: "home",
										prefix: "child"
									}
								},
								{
									pattern: "category",
									name: "category"
								}
							],
							targets: {
								home: {
									name: "namespace." + suffix + ".ChildComponent0",
									type: "Component",
									controlId: "shell",
									controlAggregation: "content",
									options: {
										manifest: false
									}
								},
								notFound: {
									name: "notFound",
									type: "View",
									viewType: "JS",
									controlId: "shell",
									controlAggregation: "content"
								}
							}
						}
					},
					init : that.fnInitRouter
				});

				this.aNestedRouteMatchedSpies = [];
				var aLoopBase = [];
				Array.prototype.push.apply(aLoopBase, Array(level - 1));

				aLoopBase.forEach(function(value, i) {
					var oSpy = sinon.spy();
					that.aNestedRouteMatchedSpies.push(oSpy);

					var oMetadata;

					if (i === level - 2) {
						oMetadata = {
							routing:  {
								config: {
									async: true
								},
								routes: [
									{
										pattern: "product/{id}",
										name: "product"
									},
									{
										pattern: "",
										name: "nestedHome"
									}
								]
							}
						};
					} else {
						oMetadata = {
							rootView: {
								viewName: "rootView1",
								type: "JS",
								async: true
							},
							routing:  {
								config: {
									async: true
								},
								routes: [
									{
										pattern: "product/{id}",
										name: "product",
										target: {
											name: "nestedComp",
											prefix: "nestedComp" + (i + 1)
										}
									},
									{
										pattern: "",
										name: "nestedHome"
									}
								],
								targets: {
									nestedComp: {
										name: "namespace." + suffix + ".ChildComponent" + (i + 1),
										type: "Component",
										controlId: "shell",
										controlAggregation: "content",
										options: {
											manifest: false
										}
									}
								}
							}
						};
					}

					sap.ui.predefine("namespace/" + suffix + "/ChildComponent" + i + "/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
						return UIComponent.extend("namespace." + suffix + ".ChildComponent" + i, {
							metadata : oMetadata,
							init : function() {
								UIComponent.prototype.init.apply(this, arguments);
								var oRouter = this.getRouter();

								oRouter.attachRouteMatched(oSpy);
								oRouter.initialize();
							}
						});
					});
				});

				this.oParentComponent = new ParentComponent("parent");
			};
		},
		afterEach: function() {
			this.oParentComponent.destroy();
			this.oEventProviderStub.restore();
		}
	});

	QUnit.test("Call navTo with specific route and parameter for nested component", function(assert) {
		this.buildNestedComponentStructure(2, "NavTo2Levels");

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			iHomeRouteMatchCount = 0;

		var pHomeRouteMatched = new Promise(function(resolve, reject) {
			var fnMatched = function() {
				this.detachMatched(fnMatched);

				iHomeRouteMatchCount++;
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell"),
					oControl = oShell.getContent()[0];

				if (oControl.isA("sap.ui.core.ComponentContainer")) {
					resolve(oControl.getComponentInstance());
				}
			};
			oRouter.getRoute("home").attachMatched(fnMatched);
		});

		return pHomeRouteMatched.then(function(oNestedComponent) {
			assert.equal(iHomeRouteMatchCount, 1, "home route is matched once");
			var oNestedRouter = oNestedComponent.getRouter(),
				sId = "productA";

			oRouter.navTo("home", {}, {
				home: {
					route: "product",
					parameters: {
						id: sId
					}
				}
			});

			oRouter.getRoute("home").attachMatched(function() {
				assert.ok(false, "The home route shouldn't be matched again");
			});

			return new Promise(function(resolve, reject) {
				oNestedRouter.getRoute("product").attachMatched(function(oEvent) {
					assert.equal(iHomeRouteMatchCount, 1, "home route is still matched only once");

					var oParameters = oEvent.getParameter("arguments");
					assert.equal(oParameters.id, sId, "correct route is matched with parameter");

					// wait 100ms since the matched event from oRouter is fired after this call stack
					// to guarantee that no further matched event is fired on the home route in oRouter
					setTimeout(function() {
						resolve();
					}, 100);
				});
			});
		});
	});

	QUnit.test("Call navTo with specific route and parameter for deep nested component", function(assert) {
		this.buildNestedComponentStructure(3, "NavTo3Levels");

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			iHomeRouteMatchCount = 0;

		var pHomeRouteMatched = new Promise(function(resolve, reject) {
			oRouter.getRoute("home").attachMatched(function() {
				iHomeRouteMatchCount++;
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell"),
					oNestedComponent = oShell.getContent()[0].getComponentInstance();

				resolve(oNestedComponent);
			});
		});

		return pHomeRouteMatched.then(function(oNestedComponent) {
			assert.equal(iHomeRouteMatchCount, 1, "home route is matched once");
			var oNestedRouter = oNestedComponent.getRouter(),
				sId = "productA";

			return new Promise(function(resolve, reject) {
				oNestedRouter.getRoute("product").attachMatched(function(oEvent) {
					assert.equal(iHomeRouteMatchCount, 1, "home route is still matched only once");
					var oParameters = oEvent.getParameter("arguments"),
						aViews = oEvent.getParameter("views");

					assert.equal(oParameters.id, sId, "correct route is matched with parameter");

					assert.equal(aViews.length, 1, "A target instance is created");
					assert.ok(aViews[0] instanceof sap.ui.core.ComponentContainer, "The target instance is an ComponentContainer");

					var oNestedComponent = aViews[0].getComponentInstance(),
						oRouter = oNestedComponent.getRouter();

					var oGrandChildRouteMatchedSpy = that.aNestedRouteMatchedSpies[1];

					assert.equal(oGrandChildRouteMatchedSpy.callCount, 1, "A Route is matched in the grand child router");
					var oCall = oGrandChildRouteMatchedSpy.getCall(0);
					assert.strictEqual(oCall.thisValue, oRouter, "The correct spy is taken");
					assert.equal(oCall.args[0].getParameter("name"), "product", "The correct route is matched");

					assert.ok(oRouter.isInitialized(), "The router in nested component is started");
					assert.equal(oRouter._getLastMatchedRouteName(), "product", "The correct route is matched");

					resolve();
				});
				oRouter.navTo("home", {}, {
					home: {
						route: "product",
						parameters: {
							id: sId
						},
						componentTargetInfo: {
							nestedComp: {
								route: "product",
								parameters: {
									id: sId + "-nested"
								}
							}
						}
					}
				});
			});
		});
	});

	QUnit.test("navTo the same route after a manual Targets.display with a component should triger routeMatched event", function(assert) {
		this.buildNestedComponentStructure(2, "NavTo2LevelsWithTargetDisplay");

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			iHomeRouteMatchCount = 0;

		var pHomeRouteMatched = new Promise(function(resolve, reject) {
			var fnMatched = function() {
				this.detachMatched(fnMatched);

				iHomeRouteMatchCount++;
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell"),
					oControl = oShell.getContent()[0];

				if (oControl.isA("sap.ui.core.ComponentContainer")) {
					resolve(oControl.getComponentInstance());
				}
			};
			oRouter.getRoute("home").attachMatched(fnMatched);
		});

		return pHomeRouteMatched.then(function(oNestedComponent) {
			assert.equal(iHomeRouteMatchCount, 1, "home route is matched once");

			// display another target with in the top level router
			// this should reset the hash in its RouterHashChanger in order to allow
			// a navTo to the same route which is matched before displaying the notFound
			return oRouter.getTargets().display("notFound").then(function() {
				return oNestedComponent;
			});
		}).then(function(oNestedComponent) {
			var oNestedRouter = oNestedComponent.getRouter(),
				sId = "productA";

			var oNestedRouterMatched = new Promise(function(resolve, reject) {
				oNestedRouter.getRoute("product").attachMatched(function(oEvent) {
					var oParameters = oEvent.getParameter("arguments");
					assert.equal(oParameters.id, sId, "correct route is matched with parameter");

					resolve();
				});
			});

			var oRouterMatched = new Promise(function(resolve, reject) {
				oRouter.getRoute("home").attachMatched(function() {
					assert.ok(true, "home route is matched again");
					resolve();
				});
			});

			oRouter.navTo("home", {}, {
				home: {
					route: "product",
					parameters: {
						id: sId
					}
				}
			});

			return Promise.all([oRouterMatched, oNestedRouterMatched]);
		});
	});

	QUnit.test("Suspend nested routers after switch to other route", function(assert) {
		this.buildNestedComponentStructure(3, "NavTo3LevelsSwitch");

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			iHomeRouteMatchCount = 0;

		var pHomeRouteMatched = new Promise(function(resolve, reject) {
			oRouter.getRoute("home").attachMatched(function() {
				iHomeRouteMatchCount++;
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell"),
					oNestedComponent = oShell.getContent()[0].getComponentInstance();

				resolve(oNestedComponent);
			});
		});

		return pHomeRouteMatched.then(function(oNestedComponent) {
			assert.equal(iHomeRouteMatchCount, 1, "home route is matched once");
			var oNestedRouter = oNestedComponent.getRouter(),
				sId = "productA";

			return new Promise(function(resolve, reject) {
				oNestedRouter.getRoute("product").attachMatched(function(oEvent) {
					assert.equal(iHomeRouteMatchCount, 1, "home route is still matched only once");
					var oParameters = oEvent.getParameter("arguments"),
						aViews = oEvent.getParameter("views");

					assert.equal(oParameters.id, sId, "correct route is matched with parameter");

					assert.equal(aViews.length, 1, "A target instance is created");
					assert.ok(aViews[0] instanceof sap.ui.core.ComponentContainer, "The target instance is an ComponentContainer");

					var oNestedComponent = aViews[0].getComponentInstance(),
						oRouter = oNestedComponent.getRouter();

					assert.ok(oRouter.isInitialized(), "The router in nested component is started");
					assert.equal(oRouter._getLastMatchedRouteName(), "product", "The correct route is matched");

					resolve();
				});
				oRouter.navTo("home", {}, {
					home: {
						route: "product",
						parameters: {
							id: sId
						},
						componentTargetInfo: {
							nestedComp: {
								route: "product",
								parameters: {
									id: sId + "-nested"
								}
							}
						}
					}
				});
			});
		}).then(function() {
			return new Promise(function(resolve, reject) {
				// switch to another route in the top level router
				oRouter.getRoute("category").attachMatched(function(oEvent) {
					that.aNestedRouteMatchedSpies.forEach(function(oSpy) {
						assert.equal(oSpy.callCount, 0, "The nested routers are not matched again");
					});
					resolve();
				});
				// reset the call history of the routeMatched spies on the nested Routers
				that.aNestedRouteMatchedSpies.forEach(function(oSpy) {
					oSpy.resetHistory();
				});
				oRouter.navTo("category");
			});
		});
	});

	QUnit.test("Suspend nested routers after parent Router stops, initialize the nested routers after parent router initlaizes without parsing the current hash", function(assert) {
		this.buildNestedComponentStructure(3, "StopAndInitializeLevel3");

		var that = this,
			oRouter = this.oParentComponent.getRouter(),
			iHomeRouteMatchCount = 0;

		var pHomeRouteMatched = new Promise(function(resolve, reject) {
			oRouter.getRoute("home").attachMatched(function() {
				iHomeRouteMatchCount++;
				var oContainer = that.oParentComponent.getRootControl(),
					oShell = oContainer.byId("shell"),
					oNestedComponent = oShell.getContent()[0].getComponentInstance();

				resolve(oNestedComponent);
			});
		});

		return pHomeRouteMatched.then(function(oNestedComponent) {
			assert.equal(iHomeRouteMatchCount, 1, "home route is matched once");
			var oNestedRouter = oNestedComponent.getRouter(),
				sId = "productA";

			return new Promise(function(resolve, reject) {
				oNestedRouter.getRoute("product").attachMatched(function(oEvent) {
					assert.equal(iHomeRouteMatchCount, 1, "home route is still matched only once");
					var oParameters = oEvent.getParameter("arguments"),
						aViews = oEvent.getParameter("views");

					assert.equal(oParameters.id, sId, "correct route is matched with parameter");

					assert.equal(aViews.length, 1, "A target instance is created");
					assert.ok(aViews[0] instanceof sap.ui.core.ComponentContainer, "The target instance is an ComponentContainer");

					var oDeepNestedComponent = aViews[0].getComponentInstance(),
						oDeepNestedRouter = oDeepNestedComponent.getRouter();

					assert.ok(oDeepNestedRouter.isInitialized(), "The router in nested component is started");
					assert.equal(oDeepNestedRouter._getLastMatchedRouteName(), "product", "The correct route is matched");

					resolve([oRouter, oNestedRouter, oDeepNestedRouter]);
				});
				oRouter.navTo("home", {}, {
					home: {
						route: "product",
						parameters: {
							id: sId
						},
						componentTargetInfo: {
							nestedComp: {
								route: "product",
								parameters: {
									id: sId + "-nested"
								}
							}
						}
					}
				});
			});
		}).then(function(aRouterHierarchy) {
			aRouterHierarchy[0].stop();

			assert.ok(aRouterHierarchy[0].isStopped(), "top level router is stopped");
			assert.ok(aRouterHierarchy[1].isStopped(), "nested router is stopped");
			assert.ok(aRouterHierarchy[2].isStopped(), "deeply nested router is stopped");

			var oNestedRouterInitializeSpy = that.spy(aRouterHierarchy[1], "initialize");
			var oDeepNestedRouterInitializeSpy = that.spy(aRouterHierarchy[2], "initialize");

			aRouterHierarchy[0].initialize(true);

			assert.ok(aRouterHierarchy[0].isInitialized(), "top level router is initialized");
			assert.ok(aRouterHierarchy[1].isInitialized(), "nested router is initialized");
			assert.ok(aRouterHierarchy[2].isInitialized(), "deeply nested router is initialized");

			assert.equal(oNestedRouterInitializeSpy.callCount, 1, "the method 'initialize' is called once");
			assert.equal(oDeepNestedRouterInitializeSpy.callCount, 1, "the method 'initialize' is called once");

			assert.equal(oNestedRouterInitializeSpy.getCall(0).args[0], true, "the method 'initialize' is called with parameter true");
			assert.equal(oDeepNestedRouterInitializeSpy.getCall(0).args[0], true, "the method 'initialize' is called with parameter true");
		});
	});

	QUnit.module("Loading nested components through routing's targets with componentUsage settings", {
		beforeEach: function() {
			hasher.setHash("");
		}
	});

	// scenario1
	QUnit.test("Nested component is loaded when the corresponding route is matched", function(assert) {
		var pCreated = Component.create({
			name: "routing.scenario1"
		});

		return pCreated.then(function(oComponent) {
			assert.ok(oComponent, "Component instance is successfully created");

			var oRouter = oComponent.getRouter();

			assert.ok(oRouter, "Router in component is available");

			var oHomeRoute = oRouter.getRoute("home");
			var oRouteMatchedSpy = this.spy(oHomeRoute, "_routeMatched");
			var oCreateComponentSpy = this.spy(oComponent, "createComponent");

			oRouter.initialize();
			assert.equal(oRouteMatchedSpy.callCount, 1, "Home route should be matched");

			var oCall = oRouteMatchedSpy.getCall(0);
			return oCall.returnValue.then(function() {
				assert.equal(oCreateComponentSpy.callCount, 1, "createComponent is called once");

				var oArg = oCreateComponentSpy.getCall(0).args[0];
				assert.equal(oArg.usage, "child", "usage is given");
				assert.equal(oArg.id, oComponent.createId("childComponent"), "id option is given");
				assert.ok(oArg.settings, "The settings are given");
				assert.equal(oArg.settings.nickname, "Fancy Child Component", "The settings property 'nickname' is given");
				assert.ok(oArg.settings._routerHashChanger, "RouterHashChanger is given");
				assert.deepEqual(oArg.componentData, { foo: "bar" }, "componentData is given");

				var oRootView = oComponent.getRootControl();
				var aContent = oRootView.byId("page").getContent();
				assert.equal(aContent.length, 1, "The target is created and added to the aggregation");
				assert.ok(aContent[0] instanceof ComponentContainer, "The nested component is added to the aggregation");

				var oNestedComponent = aContent[0].getComponentInstance();
				var oNestedRouter = oNestedComponent.getRouter();
				assert.ok(oNestedRouter, "Router is created in nested component");
				assert.equal(oNestedRouter.isInitialized(), false, "The nested router isn't initialized yet");

				assert.equal(oNestedRouter.getHashChanger().parent, oRouter.getHashChanger(), "The hash changer is chained with the parent router's");
			}).finally(function(){
				oComponent.destroy();
			});

		}.bind(this));
	});

	QUnit.module("Routing Nested Components", {
		beforeEach: function() {
			this.oEventProviderStub = sinon.stub(EventProvider.prototype.oEventPool, "returnObject");
			this.oTitleChangedSpy = sinon.spy();
			hasher.setHash("");
			// ===== parentComponent =====
			sap.ui.jsview("parentRootView", {
				createContent : function() {
					return new Panel(this.createId("shell"));
				}
			});
			sap.ui.jsview("parentView1", {
				createContent : function() {
					return new Button(this.createId("button"));
				}
			});
			// ===== nestedComponent1 =====
			sap.ui.jsview("nestedRootView1", {
				createContent : function() {
					return new Panel(this.createId("nestedShell1"));
				}
			});
			sap.ui.jsview("nestedView1", {
				createContent : function() {
					return new Button(this.createId("button1"));
				}
			});
			sap.ui.jsview("nestedView2", {
				createContent : function() {
					return new Button(this.createId("button2"));
				}
			});
			// ===== nestedComponent2 =====
			sap.ui.jsview("nestedRootView2", {
				createContent : function() {
					return new Panel(this.createId("nestedShell2"));
				}
			});
			sap.ui.jsview("nestedView3", {
				createContent : function() {
					return new Button(this.createId("button3"));
				}
			});
			sap.ui.jsview("nestedView4", {
				createContent : function() {
					return new Button(this.createId("button4"));
				}
			});
			var ParentComponent;
			ParentComponent = UIComponent.extend("namespace1.ParentComponent", {
				metadata : {
					rootView: {
						viewName: "parentRootView",
						type: "JS",
						async: true
					},
					routing:  {
						config: {
							async: true,
							controlId: "shell",
							controlAggregation: "content",
							propagateTitle: true
						},
						routes: [
							{
								pattern: "",
								name: "home",
								target: {
									name: "home",
									prefix: "child"
								}
							},
							{
								pattern: "second",
								name: "second",
								target: {
									name: "second",
									prefix: "child"
								}
							},
							{
								pattern: "view1",
								name: "parentView1",
								target: "parentView1"

							}
						],
						targets: {
							home: {
								name: "namespace1.ChildComponent",
								type: "Component",
								id: "component1",
								title: "{/titleComponent1}",
								options: {
									manifest: false
								}
							},
							second: {
								name: "namespace2.ChildComponent",
								type: "Component",
								id: "component2",
								title: "TitleComponent2",
								options: {
									manifest: false
								}
							},
							parentView1: {
								name: "parentView1",
								title: "TitleParentView1",
								type: "View",
								viewType: "JS"
							}
						}
					}
				}
			});
			this.oParentComponent = new ParentComponent("parent");

			sap.ui.predefine("namespace1/ChildComponent/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
				return UIComponent.extend("namespace1.ChildComponent", {
					metadata : {
						rootView: {
							viewName: "nestedRootView1",
							type: "JS",
							async: true
						},
						routing:  {
							config: {
								async: true,
								controlAggregation: "content",
								controlId: "nestedShell1",
								viewType : "JS",
								type: "View"
							},
							routes: [
								{
									pattern: "",
									name: "nestedView1",
									target: {
										name: "nestedView1"
									}
								},
								{
									pattern: "view2",
									name: "nestedView2",
									target: "nestedView2"
								}
							],
							targets: {
								nestedView1: {
									name: "nestedView1",
									title: "TitleNestedView1"
								},
								nestedView2: {
									name: "nestedView2",
									title: "TitleNestedView2"
								}
							}
						}
					},
					init : function() {
						UIComponent.prototype.init.apply(this, arguments);
						this.setModel(new JSONModel({
							titleComponent1: "Title defined in model"
						}));
						var oRouter = this.getRouter();
						oRouter.initialize();
					}
				});
			});
			sap.ui.predefine("namespace2/ChildComponent/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
				return UIComponent.extend("namespace2.ChildComponent", {
					metadata : {
						rootView: {
							viewName: "nestedRootView2",
							type: "JS",
							async: true
						},
						routing:  {
							config: {
								async: true,
								controlAggregation: "content",
								controlId: "nestedShell2",
								viewType : "JS",
								type: "View"
							},
							routes: [
								{
									pattern: "",
									name: "nestedView3",
									target: "nestedView3"
								},
								{
									pattern: "view2",
									name: "nestedView4",
									target: "nestedView4"
								}
							],
							targets: {
								nestedView3: {
									name: "nestedView3",
									title: "TitleNestedView3"
								},
								nestedView4: {
									name: "nestedView4",
									title: "TitleNestedView4"
								}
							}
						}
					},
					init : function() {
						UIComponent.prototype.init.apply(this, arguments);
						var oRouter = this.getRouter();
						oRouter.initialize();
					}
				});
			});
		},
		afterEach: function() {
			this.oParentComponent.destroy();
			this.oEventProviderStub.restore();
			this.oTitleChangedSpy.resetHistory();
		}
	});

	QUnit.test("Order of routeMatched events in nested components", function(assert) {
		var done = assert.async(),
			oParentRouter = this.oParentComponent.getRouter();

		var oHomeRoute = oParentRouter.getRoute("home");
		var oHomeRouteMatchedSpy = sinon.spy(oHomeRoute, "_routeMatched");
		oParentRouter.initialize();

		var oRouterRouteMatchedSpy = sinon.spy(Router.prototype, "fireRouteMatched");

		oHomeRouteMatchedSpy.getCall(0).returnValue.then(function() {
			assert.equal(oRouterRouteMatchedSpy.callCount, 2, "fireRouteMatched should be called twice");
			assert.strictEqual(oRouterRouteMatchedSpy.getCall(1).thisValue, oParentRouter, "Should be the correct ");
			oRouterRouteMatchedSpy.restore();
			oRouterRouteMatchedSpy.resetHistory();
			done();
		});
	});

	QUnit.test("Propagate titleChange event from nested component", function(assert) {
		var done = assert.async(),
			that = this,
			oParentRouter = this.oParentComponent.getRouter();

		// Expected results
		var oExpected1 = {
			"history": [],
			"nestedHistory": [{
					"history": [{
						"hash": "",
						"title": "Title defined in model"
					}],
					"ownerComponentId": "parent"
				},
				{
					"history": [{
						"hash": "",
						"title": "TitleNestedView1"
					}],
					"ownerComponentId": "parent---component1"
				}
			],
			"propagated": true,
			"title": "TitleNestedView1"
		},
		oExpected2 = {
			"history": [{
				"hash": "",
				"title": "TitleNestedView1"
			}],
			"nestedHistory": [{
					"history": [{
						"hash": "",
						"title": "Title defined in model"
					}],
					"ownerComponentId": "parent"
				},
				{
					"history": [{
							"hash": "",
							"title": "TitleNestedView1"
						},
						{
							"hash": "view2",
							"title": "TitleNestedView2"
						}
					],
					"ownerComponentId": "parent---component1"
				}
			],
			"propagated": true,
			"title": "TitleNestedView2"
		},
		oExpected3 = {
			"history": [{
				"hash": "",
				"title": "Title defined in model"
			}],
			"nestedHistory": [{
					"history": [{
							"hash": "",
							"title": "Title defined in model"
						},
						{
							"hash": "second",
							"title": "TitleComponent2"
						}
					],
					"ownerComponentId": "parent"
				},
				{
					"history": [{
						"hash": "",
						"title": "TitleNestedView3"
					}],
					"ownerComponentId": "parent---component2"
				}
			],
			"propagated": true,
			"title": "TitleNestedView3"
		};

		oParentRouter.attachTitleChanged(this.oTitleChangedSpy);

		var oHomeRoute = oParentRouter.getRoute("home");
		var oHomeRouteMatchedSpy = sinon.spy(oHomeRoute, "_routeMatched");

		oParentRouter.initialize();

		oHomeRouteMatchedSpy.getCall(0).returnValue.then(function(oObject) {
			assert.equal(that.oTitleChangedSpy.callCount, 1, "initialize(): fireTitleChange should be called the first time");
			assert.deepEqual(that.oTitleChangedSpy.getCall(0).args[0].getParameters(), oExpected1, "initialize(): titleChange event object should be correct");

			var oNestedComponent1 = oObject.view.getComponentInstance(),
				oNestedComponent1Router = oNestedComponent1.getRouter();

			oNestedComponent1Router.navTo("nestedView2");
		}).then(function() {
			setTimeout(function() {
				assert.equal(that.oTitleChangedSpy.callCount, 2, "navTo('nestedView2'): fireTitleChange should be called the two times");
				assert.ok(that.oTitleChangedSpy.getCall(1).args[0].getParameters().propagated, "Navigation triggered by nested component, marked as propagated");
				assert.deepEqual(that.oTitleChangedSpy.getCall(1).args[0].getParameters(), oExpected2, "navTo('nestedView2'): titleChange event object should be correct");

				var oSecondRoute = oParentRouter.getRoute("second");
				var oSecondRouteMatchedSpy = sinon.spy(oSecondRoute, "_routeMatched");

				oParentRouter.navTo("second");
				oSecondRouteMatchedSpy.getCall(0).returnValue.then(function() {
					assert.equal(that.oTitleChangedSpy.callCount, 3, "navTo('second'): fireTitleChange should be called the three times");
					assert.deepEqual(that.oTitleChangedSpy.getCall(2).args[0].getParameters(), oExpected3, "navTo('second'): titleChange event object should be correct");

					var oParentView1Route = oParentRouter.getRoute("parentView1");
					var oParentView1RouteMatchedSpy = sinon.spy(oParentView1Route, "_routeMatched");

					oParentRouter.navTo("parentView1");
					oParentView1RouteMatchedSpy.getCall(0).returnValue.then(function() {
						assert.equal(oParentRouter.getTitleHistory().length, 3, "The number of history entries should be correct");
						done();
					});
				});
			});
		});
	});

	QUnit.module("Routing Nested Components with shared router", {
		beforeEach: function () {
			hasher.setHash("");

			// ===== RootView of Parent Component =====
			sap.ui.jsview("parentRootView", {
				createContent : function() {
					return new Panel(this.createId("shell"));
				}
			});

			// ===== View of home route of reuse router =====
			sap.ui.jsview("reuseRooterView", {
				createContent : function() {
					return new Button(this.createId("button1"));
				}
			});

			// ===== Root View of Child=====
			sap.ui.jsview("childRootView", {
				createContent : function() {
					return new Panel(this.createId("childShell"));
				}
			});
			var ParentComponent = UIComponent.extend("namespace.async.parent.ParentComponent", {
				metadata: {
					rootView: {
						viewName: "parentRootView",
						type: "JS",
						async: true
					},
					routing: {
						config: {
							async: true,
							propagateTitle: true
						},
						routes: [
							{
								pattern: "",
								name: "home",
								target: {
									name: "home",
									prefix: "child"
								}
							},
							{
								pattern: "second",
								name: "second"
							}
						],
						targets: {
							home: {
								name: "namespace.async.child.ChildComponent",
								type: "Component",
								id: "childComponent1",
								title: "My Child Title",
								controlId: "shell",
								controlAggregation: "content",
								options: {
									manifest: false
								}
							}
						}
					}
				}
			});

			sap.ui.predefine("namespace/async/child/ChildComponent/Component", ["sap/ui/core/UIComponent"], function (UIComponent) {
				return UIComponent.extend("namespace.async.child.ChildComponent", {
					metadata: {
						rootView: {
							viewName: "childRootView",
							type: "JS",
							async: true
						}
					}
				});
			});

			this.oParentComponent = new ParentComponent("parent");
		},
		afterEach: function () {
			this.oParentComponent.destroy();
		}
	});

	QUnit.test("NestedComponent has no routing enabled", function(assert){
		var oParentRouter = this.oParentComponent.getRouter(),
		oRouterInitializeSpy = sinon.spy(Router.prototype, "initialize");

		var oHomeRoute = oParentRouter.getRoute("home");
		var oHomeRouteMatchedSpy = sinon.spy(oHomeRoute, "_routeMatched");

		oParentRouter.initialize();
		assert.strictEqual(oHomeRouteMatchedSpy.callCount, 1, "The home route is matched once.");
		return oHomeRouteMatchedSpy.getCall(0).returnValue.then(function(){
			assert.equal(oRouterInitializeSpy.callCount, 1, "The initialize() method was called only once.");
			assert.strictEqual(oRouterInitializeSpy.getCall(0).thisValue._oOwner.getId(), "parent", "The initialize() method was called by the parent component.");
			oRouterInitializeSpy.resetHistory();
			oRouterInitializeSpy.restore();
		});
	});

	QUnit.test("NestedComponent is using router another router", function(assert){
		var oParentRouter = this.oParentComponent.getRouter(),
		oParentRouterInitializeSpy = sinon.spy(oParentRouter, "initialize"),
		oParentRouterStopSpy = sinon.spy(oParentRouter, "stop"),
		oGetRouterStub = sinon.stub(UIComponent.prototype, "getRouter").callsFake(function(){
			return oParentRouter;
		});

		var oHomeRoute = oParentRouter.getRoute("home");
		var oHomeRouteMatchedSpy = sinon.spy(oHomeRoute, "_routeMatched");

		var oSecondRoute = oParentRouter.getRoute("second");
		var oSecondRouteMatchedSpy = sinon.spy(oSecondRoute, "_routeMatched");

		oParentRouter.initialize();

		return oHomeRouteMatchedSpy.getCall(0).returnValue.then(function(oObject){
			var oRouter = oObject.view.getComponentInstance().getRouter();
			assert.equal(oParentRouterInitializeSpy.callCount, 1, "The initialize() method was called only once.");
			assert.strictEqual(oRouter, oParentRouter, "The router of the child component is correctly the parent router.");

			oParentRouterInitializeSpy.resetHistory();

			oRouter.navTo("second");

			assert.equal(oSecondRouteMatchedSpy.callCount, 1, "The second route is matched.");

			return oSecondRouteMatchedSpy.getCall(0).returnValue;
		}).then(function(){
			assert.equal(oParentRouterStopSpy.callCount, 0, "The router was not stopped.");
			oParentRouter.navTo("home");

			return oHomeRouteMatchedSpy.getCall(1).returnValue;

		}).then(function(){
			assert.equal(oParentRouterInitializeSpy.callCount, 0, "The initialize() method was not again.");

			oGetRouterStub.restore();
			oParentRouterInitializeSpy.restore();
			oParentRouterStopSpy.restore();
		});
	});

	QUnit.module("Configuration of title propagation", {
		before: function() {
			sap.ui.jsview("parentRootView", {
				createContent : function() {
					return new Panel(this.createId("shell"));
				}
			});
			sap.ui.jsview("parentView1", {
				createContent : function() {
					return new Button(this.createId("button"));
				}
			});
			// ===== nestedComponent1 =====
			sap.ui.jsview("nestedRootView1", {
				createContent : function() {
					return new Panel(this.createId("nestedShell1"));
				}
			});
			sap.ui.jsview("nestedView1", {
				createContent : function() {
					return new Button(this.createId("button1"));
				}
			});
			sap.ui.jsview("nestedView2", {
				createContent : function() {
					return new Button(this.createId("button2"));
				}
			});
			// ===== nestedComponent2 =====
			sap.ui.jsview("nestedRootView2", {
				createContent : function() {
					return new Panel(this.createId("nestedShell2"));
				}
			});
			sap.ui.jsview("nestedView3", {
				createContent : function() {
					return new Button(this.createId("button3"));
				}
			});
			sap.ui.jsview("nestedView4", {
				createContent : function() {
					return new Button(this.createId("button4"));
				}
			});

			// define nested component
			sap.ui.predefine("namespace/nested/ChildComponent/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
				return UIComponent.extend("namespace.nested.ChildComponent", {
					metadata : {
						rootView: {
							viewName: "nestedRootView1",
							type: "JS",
							async: true
						},
						routing:  {
							config: {
								async: true,
								controlAggregation: "content",
								controlId: "nestedShell1",
								viewType : "JS",
								type: "View"
							},
							routes: [
								{
									pattern: "",
									name: "nestedView1",
									target: {
										name: "nestedView1"
									}
								},
								{
									pattern: "view2",
									name: "nestedView2",
									target: "nestedView2"
								}
							],
							targets: {
								nestedView1: {
									name: "nestedView1",
									title: "TitleNestedView1"
								},
								nestedView2: {
									name: "nestedView2",
									title: "TitleNestedView2"
								}
							}
						}
					},
					init : function() {
						UIComponent.prototype.init.apply(this, arguments);
						this.getRouter().initialize();
					}
				});
			});

			this._createParentComponent = function(iIndexNamespace, bPropagateTitleGlobal, bPropagateTitleOfRoute1, bPropagateTitleOfRoute2, iIndexNamespaceChild1, iIndexNamespaceChild2, iTargetTitleChild1, iTargetTitleChild2) {
				return UIComponent.extend("namespace." + iIndexNamespace + ".ParentComponent", {
					metadata : {
						rootView: { viewName: "parentRootView", type: "JS",	async: true	},
						routing:  {
							config: {
								async: true,
								controlId: "shell",
								controlAggregation: "content",
								propagateTitle: bPropagateTitleGlobal
							},
							routes: [
								{ pattern: "", name: "home", target: { name: "home", prefix: "child", propagateTitle: bPropagateTitleOfRoute1 } },
								{ pattern: "second", name: "second", target: { name: "second", prefix: "child",	propagateTitle: bPropagateTitleOfRoute2	} },
								{ pattern: "third", name: "third", target: { name: "home", prefix: "child", propagateTitle: false } },
								{ pattern: "view1", name: "parentView1", target: "parentView1" }
							],
							targets: {
								home: { name: "namespace." + iIndexNamespaceChild1 + ".ChildComponent", type: "Component", id: "component" + iIndexNamespaceChild1, title: iTargetTitleChild1 !== undefined ? iTargetTitleChild1 : "TitleComponent" + iIndexNamespaceChild1, options: { manifest: false } },
								second: { name: "namespace." + iIndexNamespaceChild2 + ".ChildComponent", type: "Component", id: "component" + iIndexNamespaceChild2, title: iTargetTitleChild2 !== undefined ? iTargetTitleChild2 : "TitleComponent" + iIndexNamespaceChild2, options: { manifest: false } },
								parentView1: { name: "parentView1", title: "TitleParentView1", type: "View", viewType: "JS" }
							}
						}
					}
				});
			};

			this._createChildWithGlobalTitlePropagation = function(iIndexNamespace, bPropagateTitleGlobal, bPropagateTitleOfNestedComponent) {
				sap.ui.predefine("namespace/" + iIndexNamespace + "/ChildComponent/Component", ["sap/ui/core/UIComponent"], function(UIComponent) {
					return UIComponent.extend("namespace." + iIndexNamespace + ".ChildComponent", {
						metadata : {
							rootView: {
								viewName: "nestedRootView1",
								type: "JS",
								async: true
							},
							routing:  {
								config: {
									async: true,
									controlAggregation: "content",
									controlId: "nestedShell1",
									viewType : "JS",
									type: "View",
									propagateTitle: bPropagateTitleGlobal
								},
								routes: [
									{
										pattern: "",
										name: "nestedView1",
										target: {
											name: "nestedView1"
										}
									},
									{
										pattern: "view2",
										name: "nestedView2",
										target: "nestedView2"
									},
									{
										pattern: "component",
										name: "nestedComponent",
										target: {
											name: "nestedComponent",
											prefix: "child",
											propagateTitle: bPropagateTitleOfNestedComponent
										}
									}
								],
								targets: {
									nestedView1: {
										name: "nestedView1",
										title: "TitleNestedView1"
									},
									nestedView2: {
										name: "nestedView2",
										title: "TitleNestedView2"
									},
									nestedComponent: {
										name: "namespace.nested.ChildComponent", type: "Component", id: "componentNested", title: "TitleComponentNested", options: { manifest: false }
									}
								}
							}
						},
						init : function() {
							UIComponent.prototype.init.apply(this, arguments);
							this.getRouter().initialize();
						}
					});
				});
			};
		},
		beforeEach: function() {
			this.oEventProviderStub = sinon.stub(EventProvider.prototype.oEventPool, "returnObject");
			hasher.setHash("");
		},
		afterEach: function() {
			this.oEventProviderStub.restore();
		}
	});

	QUnit.test("Configuration of title propagation - Scenario 1", function(assert) {
		var done = assert.async(),
			oLevel0TitleChangedSpy = sinon.spy(),
			ParentComponent = this._createParentComponent(
				/*iIndexNamespace=*/4,
				/*bGlobal=*/undefined,
				/*bPropagateTitleOfRoute1=*/undefined,
				/*bPropagateTitleOfRoute2=*/true,
				/*iIndexNamespaceChild1=*/1,
				/*iIndexNamespaceChild2=*/2);

		this._createChildWithGlobalTitlePropagation(1);
		this._createChildWithGlobalTitlePropagation(2);

		var oLevel0Component = new ParentComponent("parent");
		var oLevel0Router = oLevel0Component.getRouter();

		oLevel0Router.attachTitleChanged(oLevel0TitleChangedSpy);

		var oLevel0HomeRouteMatchedSpy = sinon.spy(oLevel0Router.getRoute("home"), "_routeMatched");
		oLevel0Router.initialize();

		oLevel0HomeRouteMatchedSpy.getCall(0).returnValue.then(function () {
			var oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(0).args[0];
			assert.equal(oLevel0TitleChangedSpy.callCount, 1, "initialize(): fireTitleChange should be called the first time - Component title");
			assert.equal(oTitleChangedEvent.getParameter("title"), "TitleComponent1", "initialize(): title 'TitleComponent1' should be correct");
			assert.equal(oTitleChangedEvent.getParameter("propagated"), false, "initialize(): titleChanged event isn't propagated from nested router");
			assert.equal(oTitleChangedEvent.getParameter("history").length, 0, "initialize(): The history shouldn't have any entries");
			assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "initialize(): The nested history should be available");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 1, "initialize(): The nested history should have one entry");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "initialize(): The first nested history entry should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 1, "initialize(): The history of the nested history entry should have one entry");
			assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[0], {
				title: "TitleComponent1",
				hash: ""
			}, "initialize(): The history of the nested history entry should be correct");

			var oLevel0SecondRouteMatchedSpy = sinon.spy(oLevel0Router.getRoute("second"), "_routeMatched");
			oLevel0Router.navTo("second");
			oLevel0SecondRouteMatchedSpy.getCall(0).returnValue.then(function (oObject) {
				oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(1).args[0];
				assert.equal(oLevel0TitleChangedSpy.callCount, 2, "navTo('second'): fireTitleChange should be called the three times");
				assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView1", "navTo('second'): title 'TitleNestedView1' should be correct");
				assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "navTo('second'): titleChanged event isn't propagated from nested router");
				assert.equal(oTitleChangedEvent.getParameter("history").length, 1, "navTo('second'): The history should have one entry");
				assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "navTo('second'): The nested history should be available");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "navTo('second'): The nested history should have two entries");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "navTo('second'): The first entry should be correct");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 2, "navTo('second'): The history of the nested history entry should have one entry");
				assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history, [{
					title: "TitleComponent1",
					hash: ""
				},
				{
					title: "TitleComponent2",
					hash: "second"
				}], "navTo('second'): The nested history entries should be correct");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].history.length, 1, "navTo('second'): The history of the nested history entry should have one entry");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component2", "navTo('second'): The second nested history entry should be correct");
				assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[1].history[0], {
					title: "TitleNestedView1",
					hash: ""
				}, "navTo('second'): The history of the nested history entry should be correct");

				var oLevel1Component = oObject.view.getComponentInstance(),
					oLevel1Router = oLevel1Component.getRouter();
				var oLevel1ViewRouteMatchedSpy = sinon.spy(oLevel1Router.getRoute("nestedView2"), "_routeMatched");

				oLevel1Component.getRouter().navTo("nestedView2");
				oLevel1ViewRouteMatchedSpy.getCall(0).returnValue.then(function () {
					oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(2).args[0];
					assert.equal(oLevel0TitleChangedSpy.callCount, 3, "navTo('nestedView2'): fireTitleChange should be called the two times");
					assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView2", "navTo('nestedView2'): title 'TitleNestedView2' should be correct");
					assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "navTo('nestedView2'): titleChanged event is propagated from nested router");
					assert.equal(oTitleChangedEvent.getParameter("history").length, 1, "navTo('nestedView2'): The history should have one entry");
					assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "navTo('nestedView2'): The nested history should be available");
					assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "navTo('nestedView2'): The nested history should have two entries");
					assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "navTo('nestedView2'): The first nested history entry should be correct");
					assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 2, "navTo('nestedView2'): The history of the nested history entry should have two entries");
					assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history, [{
						title: "TitleComponent1",
						hash: ""
					},
					{
						title: "TitleComponent2",
						hash: "second"
					}], "navTo('nestedView2'): The nested history entries should be correct");
					assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component2", "navTo('nestedView2'): The second nested history entry should be correct");
					assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].history.length, 2, "navTo('nestedView2'): The history of the nested history entry should have two entries");
					assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[1].history, [{
						title: "TitleNestedView1",
						hash: ""
					},
					{
						title: "TitleNestedView2",
						hash: "view2"
					}], "navTo('nestedView2'): The history of the nested history entry should be correct");

					oLevel0Component.destroy();
					oLevel0HomeRouteMatchedSpy.restore();
					oLevel1ViewRouteMatchedSpy.restore();
					done();
				});
			});
		});
	});

	QUnit.test("Configuration of title propagation - Scenario 2", function(assert) {
		var done = assert.async(),
			oLevel0TitleChangedSpy = sinon.spy(),
			ParentComponent = this._createParentComponent(
				/*iIndexNamespace=*/2,
				/*bPropagateTitleGlobal=*/undefined,
				/*bPropagateTitleOfRoute1=*/true,
				/*bPropagateTitleOfRoute2=*/undefined,
				/*iIndexNamespaceChild1=*/3);

		this._createChildWithGlobalTitlePropagation(
			/*iIndexNamespace=*/3,
			/*bPropagateTitleGlobal=*/false,
			/*bPropagateTitleOfNestedComponent=*/true);

		var oLevel0Component = new ParentComponent("parent");
		var oLevel0Router = oLevel0Component.getRouter();
		var oLevel0HomeRouteMatchedSpy = sinon.spy(oLevel0Router.getRoute("home"), "_routeMatched");

		oLevel0Router.attachTitleChanged(oLevel0TitleChangedSpy);
		oLevel0Router.initialize();

		oLevel0HomeRouteMatchedSpy.getCall(0).returnValue.then(function (oObject) {
			assert.equal(oLevel0TitleChangedSpy.callCount, 1, "initialize(): fireTitleChange should be called the first time - Component title");

			var oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(0).args[0];
			assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView1", "initialize(): The title information should be correct");
			assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "initialize(): titleChanged event isn't propagated");
			assert.equal(oTitleChangedEvent.getParameter("history").length, 0, "initialize(): The history shouldn't have any entries");
			assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "initialize(): The nested history information should be available");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "initialize(): The nested history should two one entry");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "initialize(): The first nested history entry has the correct owner");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component3", "initialize(): The second nested history entry has the correct owner");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 1, "initialize(): The history of the nested history entry should have one entry");
			assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[0], {
				title: "TitleComponent3",
				hash: ""
			}, "initialize(): The nested history entries should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].history.length, 1, "initialize(): The history of the nested history entry should have one entry");
			assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[1].history[0], {
				title: "TitleNestedView1",
				hash: ""
			}, "initialize(): The nested history entries should be correct");

			var oLevel1Component = oObject.view.getComponentInstance();
			var oLevel1Router = oLevel1Component.getRouter();
			var oLevel1ViewRouteMatchedSpy = sinon.spy(oLevel1Router.getRoute("nestedView2"), "_routeMatched");
			var oLevel1ComponentRouteMatchedSpy = sinon.spy(oLevel1Router.getRoute("nestedComponent"), "_routeMatched");
			var oLevel1ComponentTitleChangedSpy = sinon.spy();
			oLevel1Router.attachTitleChanged(oLevel1ComponentTitleChangedSpy);

			oLevel1Router.navTo("nestedView2");
			oLevel1ViewRouteMatchedSpy.getCall(0).returnValue.then(function () {
				assert.equal(oLevel0TitleChangedSpy.callCount, 2, "navTo('nestedView2'): fireTitleChange should be called once");

				oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(1).args[0];
				assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView2", "navTo('nestedView2'): The title information should be correct");
				assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "navTo('nestedView2'):titleChanged event should be propagated");
				assert.equal(oTitleChangedEvent.getParameter("history").length, 1, "navTo('nestedView2'): The history should have one entry");
				assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "navTo('nestedView2'): The nested history should be available");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "navTo('nestedView2'): The nested history should have two entries");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "navTo('nestedView2'): The first nested history entry has the correct owner");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 1, "navTo('nestedView2'): The history of the nested history entry should have one entry");
				assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[0], {
					title: "TitleComponent3",
					hash: ""
				}, "navTo('nestedView2'): The nested history entries should be correct");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component3", "navTo('nestedView2'): The second nested history entry has the correct owner");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].history.length, 2, "navTo('nestedView2'): The history of the nested history entry should have two entries");
				assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[1].history, [{
					title: "TitleNestedView1",
					hash: ""
				},
				{
					title: "TitleNestedView2",
					hash: "view2"
				}], "navTo('nestedView2'): The nested history entries should be correct");

				oLevel1Router.navTo("nestedComponent");
				oLevel1ComponentRouteMatchedSpy.getCall(0).returnValue.then(function (oObject) {
					// router of component at level 0 should not be triggered
					assert.equal(oLevel0TitleChangedSpy.callCount, 3, "navTo('nestedComponent'): fireTitleChange should still be called once");

					// router of component at level 1 should be triggered
					assert.equal(oLevel1ComponentTitleChangedSpy.callCount, 2, "navTo('nestedComponent'): fireTitleChange should be called once");
					var oLevel1TitleChangedEvent = oLevel1ComponentTitleChangedSpy.getCall(1).args[0];

					assert.equal(oLevel1TitleChangedEvent.getParameter("title"), "TitleNestedView1", "navTo('nestedComponent'): The title information should be correct");
					assert.equal(oLevel1TitleChangedEvent.getParameter("propagated"), true, "navTo('nestedComponent'): titleChanged event isn't propagated from nested router");
					assert.equal(oLevel1TitleChangedEvent.getParameter("history").length, 2, "navTo('nestedComponent'): The history should have two entries");
					assert.ok(oLevel1TitleChangedEvent.getParameter("nestedHistory"), "navTo('nestedComponent'): The nested history should be available");
					assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory").length, 2, "navTo('nestedComponent'): The nested history should have two entries");
					assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent---component3", "navTo('nestedComponent'): The first nested history entry has the correct owner");
					assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory")[0].history.length, 3, "navTo('nestedComponent'): The history of the nested history entry should have two entries");
					assert.deepEqual(oLevel1TitleChangedEvent.getParameter("nestedHistory")[0].history, [{
						title: "TitleNestedView1",
						hash: ""
					},
					{
						title: "TitleNestedView2",
						hash: "view2"
					},
					{
						title: "TitleComponentNested",
						hash: "component"
					}], "navTo('nestedComponent'): The nested history entries should be correct");
					assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component3---componentNested", "navTo('nestedComponent'): The second nested history entry has the correct owner");
					assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory")[1].history.length, 1, "navTo('nestedComponent'): The history of the nested history entry should have one entry");
					assert.deepEqual(oLevel1TitleChangedEvent.getParameter("nestedHistory")[1].history[0], {
						title: "TitleNestedView1",
						hash: ""
					}, "navTo('nestedComponent'): The nested history entries should be correct");

					var oLevel2Component = oObject.view.getComponentInstance();
					var oLevel2Router = oLevel2Component.getRouter();
					var oLevel2RouteMatchedSpy = sinon.spy(oLevel2Router.getRoute("nestedView2"), "_routeMatched");

					oLevel2Router.navTo("nestedView2");
					oLevel2RouteMatchedSpy.getCall(0).returnValue.then(function () {

						// router of component at level 0 should not be triggered
						assert.equal(oLevel0TitleChangedSpy.callCount, 4, "fireTitleChange should still be called four times");

						// router of component at level 1 should be triggered
						var oLevel1TitleChangedEvent = oLevel1ComponentTitleChangedSpy.getCall(2).args[0];
						assert.equal(oLevel1ComponentTitleChangedSpy.callCount, 3, "navTo('nestedView2'): fireTitleChange should be called once");
						assert.equal(oLevel1TitleChangedEvent.getParameter("propagated"), true, "navTo('nestedView2'): titleChanged event is propagated from nested router");
						assert.equal(oLevel1TitleChangedEvent.getParameter("title"), "TitleNestedView2", "navTo('nestedView2'): titleChanged event is propagated from nested router");
						assert.equal(oLevel1TitleChangedEvent.getParameter("history").length, 1, "navTo('nestedView2'): The history should have one entry");
						assert.ok(oLevel1TitleChangedEvent.getParameter("nestedHistory"), "navTo('nestedView2'): The nested history should be available");
						assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory").length, 2, "navTo('nestedView2'): The nested history should have two entries");
						assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent---component3", "navTo('nestedView2'): The first nested history entry has the correct owner");
						assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory")[0].history.length, 3, "navTo('nestedView2'): The history of the nested history entry should have three entries");
						assert.deepEqual(oLevel1TitleChangedEvent.getParameter("nestedHistory")[0].history, [{
							title: "TitleNestedView1",
							hash: ""
						},
						{
							title: "TitleNestedView2",
							hash: "view2"
						},
						{
							title: "TitleComponentNested",
							hash: "component"
						}], "navTo('nestedView2'): The nested history entries should be correct");
						assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component3---componentNested", "navTo('nestedView2'): The second nested history entry has the correct owner");
						assert.equal(oLevel1TitleChangedEvent.getParameter("nestedHistory")[1].history.length, 2, "navTo('nestedView2'): The history of the nested history entry should have two entries");
						assert.deepEqual(oLevel1TitleChangedEvent.getParameter("nestedHistory")[1].history, [{
							title: "TitleNestedView1",
							hash: ""
						},
						{
							title: "TitleNestedView2",
							hash: "view2"
						}], "navTo('nestedView2'): The nested history entries should be correct");

						oLevel0Component.destroy();
						oLevel0HomeRouteMatchedSpy.restore();
						oLevel1ViewRouteMatchedSpy.restore();
						oLevel2RouteMatchedSpy.restore();
						done();
					});
				});
			});
		});
	});

	QUnit.test("Configuration of title propagation - Scenario 3", function(assert) {
		var done = assert.async(),
		ParentComponent = this._createParentComponent(
			1,
			/*bGlobal=*/undefined,
			/*bRoute1=*/true,
			/*bRoute2=*/undefined, 5), oLevel0TitleChangedSpy = sinon.spy();

		this._createChildWithGlobalTitlePropagation(5);

		var oLevel0Component = new ParentComponent("parent");
		var oLevel0Router = oLevel0Component.getRouter();

		oLevel0Router.attachTitleChanged(oLevel0TitleChangedSpy);

		var oLevel0HomeRouteMatchedSpy = sinon.spy(oLevel0Router.getRoute("home"), "_routeMatched");
		var oLevel0ThirdRouteMatchedSpy = sinon.spy(oLevel0Router.getRoute("third"), "_routeMatched");

		oLevel0Router.initialize();

		oLevel0HomeRouteMatchedSpy.getCall(0).returnValue.then(function(oObject) {
			var oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(0).args[0];
			assert.equal(oLevel0TitleChangedSpy.callCount, 1, "initialize(): fireTitleChange should be called the first time - Component title");
			assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView1", "initialize(): title 'TitleNestedView1' should be correct");
			assert.equal(oTitleChangedEvent.getParameter("history").length, 0, "initialize(): The history shouldn't have any entries");
			assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "initialize(): titleChanged event isn't propagated from nested router");
			assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "initialize(): The nested history should be available");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "initialize(): The nested history should have two entries");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "initialize(): The first nested history entry should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 1, "initialize(): The history of the nested history entry should have one entry");
			assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[0], {
				title: "TitleComponent5",
				hash: ""
			}, "initialize(): The nested history entries should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component5", "initialize(): The first nested history entry should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].history.length, 1, "initialize(): The history of the nested history entry should have one entry");
			assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[1].history[0], {
				title: "TitleNestedView1",
				hash: ""
			}, "initialize(): The nested history entries should be correct");

			var oLevel1Component = oObject.view.getComponentInstance();
			var oLevel1Router = oLevel1Component.getRouter();
			var oLevel1View2RouteMatchedSpy = sinon.spy(oLevel1Router.getRoute("nestedView2"), "_routeMatched");

			oLevel1Router.navTo("nestedView2");

			oLevel1View2RouteMatchedSpy.getCall(0).returnValue.then(function(){
				oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(1).args[0];
				assert.equal(oLevel0TitleChangedSpy.callCount, 2, "navTo('nestedView2'): fireTitleChange should be called the first time - Component title");
				assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView2", "navTo('nestedView2'): title 'TitleNestedView2' should be correct");
				assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "navTo('nestedView2'): titleChanged event isn't propagated from nested router");
				assert.equal(oTitleChangedEvent.getParameter("history").length, 1, "navTo('nestedView2'): The history should have one entry");
				assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "navTo('nestedView2'): The nested history should be available");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "navTo('nestedView2'): The nested history should have two entries");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "navTo('nestedView2'): The first nested history entry should be correct");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 1, "navTo('nestedView2'): The history of the nested history entry should have one entry");
				assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[0], {
					title: "TitleComponent5",
					hash: ""
				}, "navTo('nestedView2'): The nested history entries should be correct");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component5", "navTo('nestedView2'): The first nested history entry should be correct");
				assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].history.length, 2, "navTo('nestedView2'): The history of the nested history entry should have two entries");
				assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[1].history, [{
					title: "TitleNestedView1",
					hash: ""
				},
				{
					title: "TitleNestedView2",
					hash: "view2"
				}], "navTo('nestedView2'): The nested history entries should be correct");

				oLevel0Router.navTo("third");
				oLevel0ThirdRouteMatchedSpy.getCall(0).returnValue.then(function(){
					assert.equal(oLevel0TitleChangedSpy.callCount, 2, "navTo('third'): fireTitleChange shouldn't be called again");

					var oRouterHashChanger = oLevel0Router.getHashChanger();
					var oSetHashSpy = sinon.spy(oRouterHashChanger, "setHash");

					oLevel0Router.navTo("home", {}, {
						home: {
							route: "nestedView1"
						}
					});
					oSetHashSpy.getCall(0).returnValue.then(function() {
						oLevel0HomeRouteMatchedSpy.getCall(1).returnValue.then(function(){

							setTimeout(function(){
								assert.equal(oLevel0TitleChangedSpy.callCount, 3, "navTo('home') and route 'nestedView1' on level 1: fireTitleChange should be called again");

								oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(2).args[0];
								assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "navTo('home'): titleChanged event is propagated from nested router");
								assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView1", "navTo('home'): title property should be set correctly");
								assert.equal(oTitleChangedEvent.getParameter("history").length, 0, "navTo('home'): The history should have two entries");
								assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "navTo('home'): The nested history should be available");
								assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "navTo('home'): The nested history should have two entries");
								assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "navTo('home'): The first nested history entry should be correct");
								assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 1, "navTo('home'): The history of the nested history entry should have one entry");
								assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history, [{
									title: "TitleComponent5",
									hash: ""
								}], "navTo('home'): The nested history entries should be correct");
								assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component5", "navTo('home'): The first nested history entry should be correct");
								assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].history.length, 1, "navTo('home'): The history of the nested history entry should have two entries");
								assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[1].history, [{
									title: "TitleNestedView1",
									hash: ""
								}], "navTo('home'): The nested history entries should be correct");

								oLevel0Component.destroy();
								oLevel0HomeRouteMatchedSpy.restore();
								done();
							}, 0);
						});
					});

				});
			});
		});
	});

	QUnit.test("Configuration of title propagation - Scenario 4: multiple targets with the same title", function(assert) {
		var done = assert.async(),
		oLevel0TitleChangedSpy = sinon.spy(),
		ParentComponent = this._createParentComponent(
			/*iIndexNamespace=*/4,
			/*bGlobal=*/true,
			/*bPropagateTitleOfRoute1=*/undefined,
			/*bPropagateTitleOfRoute2=*/undefined,
			/*iIndexNamespaceChild1=*/6,
			/*iIndexNamespaceChild2=*/7,
			/*iTargetTitleChild1*/"MyTargetTitle",
			/*iTargetTitleChild2*/"MyTargetTitle");

		this._createChildWithGlobalTitlePropagation(6);
		this._createChildWithGlobalTitlePropagation(7);

		var oLevel0Component = new ParentComponent("parent");
		var oLevel0Router = oLevel0Component.getRouter();

		oLevel0Router.attachTitleChanged(oLevel0TitleChangedSpy);

		var oLevel0HomeRouteMatchedSpy = sinon.spy(oLevel0Router.getRoute("home"), "_routeMatched");
		var oLevel0SecondRouteMatchedSpy = sinon.spy(oLevel0Router.getRoute("second"), "_routeMatched");

		oLevel0Router.initialize();

		oLevel0HomeRouteMatchedSpy.getCall(0).returnValue.then(function(oObject) {
			assert.equal(oLevel0TitleChangedSpy.callCount, 1, "initialize(): fireTitleChange should be called the first time - Component title");
			var oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(0).args[0];
			assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView1", "initialize(): title 'TitleNestedView1' should be correct");
			assert.equal(oTitleChangedEvent.getParameter("history").length, 0, "initialize(): The history shouldn't have any entries");
			assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "initialize(): titleChanged event is propagated from nested router");
			assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "initialize(): The nested history should be available");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "initialize(): The nested history should have two entries");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "initialize(): The first nested history entry should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 1, "initialize(): The history of the nested history entry should have one entry");
			assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[0], {
				title: "MyTargetTitle",
				hash: ""
			}, "initialize(): The nested history entries should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component6", "initialize(): The first nested history entry should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].history.length, 1, "initialize(): The history of the nested history entry should have one entry");
			assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[1].history[0], {
				title: "TitleNestedView1",
				hash: ""
			}, "initialize(): The nested history entries should be correct");

			oLevel0Router.navTo("second");
			oLevel0SecondRouteMatchedSpy.getCall(0).returnValue.then(function(oObject) {
				assert.equal(oLevel0TitleChangedSpy.callCount, 2, "navTo('second'): fireTitleChange should be called the second time - Component title");
				try {
					oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(1).args[0];
					assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView1", "navTo('second'): title 'TitleNestedView1' should be correct");
					assert.equal(oTitleChangedEvent.getParameter("history").length, 1, "navTo('second'): The history should have one entry");
					assert.strictEqual(oTitleChangedEvent.getParameter("history")[0].title, "MyTargetTitle", "navTo('second'): The title of the first history entry should be 'MyTargetTitle'");
					assert.strictEqual(oTitleChangedEvent.getParameter("history")[0].hash, "", "navTo('second'): The hash of the first history entry should be empty");
					assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "navTo('second'): titleChanged event is propagated from nested router");
					assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "navTo('second'): The nested history should be available");
					assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "navTo('second'): The nested history should have two entries");
					assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "navTo('second'): The first nested history entry should be correct");
					assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 2, "navTo('second'): The history of the nested history entry should have one entry");
					assert.strictEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[0].title, "MyTargetTitle", "navTo('second'): The title of the first history entry of the first nested history entry should be 'MyTargetTitle'");
					assert.strictEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[0].hash, "", "navTo('second'): The hash of the first history entry of the first nested history entry should be empty");
					assert.strictEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[1].title, "MyTargetTitle", "navTo('second'): The title of the second history entry of the first nested history entry should be 'MyTargetTitle'");
					assert.strictEqual(oTitleChangedEvent.getParameter("nestedHistory")[0].history[1].hash, "second", "navTo('second'): The hash of the second history entry of the first nested history entry should be empty");
				} finally {
					oLevel0Component.destroy();
					oLevel0HomeRouteMatchedSpy.restore();
					done();
				}
			});

		});
	});

	QUnit.test("Configuration of title propagation - Scenario 5: parent target has no title but nested component target - attach to event after initialize of the router", function(assert) {
		var done = assert.async(),
		oLevel0TitleChangedSpy = sinon.spy(),
		ParentComponent = this._createParentComponent(
			/*iIndexNamespace=*/5,
			/*bGlobal=*/true,
			/*bPropagateTitleOfRoute1=*/undefined,
			/*bPropagateTitleOfRoute2=*/undefined,
			/*iIndexNamespaceChild1=*/8,
			/*iIndexNamespaceChild2=*/9,
			/*iTargetTitleChild1*/null,
			/*iTargetTitleChild2*/"MyTargetTitle");

		this._createChildWithGlobalTitlePropagation(8);
		this._createChildWithGlobalTitlePropagation(9);

		var oLevel0Component = new ParentComponent("parent");
		var oLevel0Router = oLevel0Component.getRouter();

		var oLevel0HomeRouteMatchedSpy = sinon.spy(oLevel0Router.getRoute("home"), "_routeMatched");
		var oFireTitleChangedSpy = sinon.spy(Router.prototype, "fireTitleChanged");
		var oFireRouteMatchedSpy = sinon.spy(Router.prototype, "fireRouteMatched");
		oLevel0Router.initialize();

		oLevel0Router.attachTitleChanged(oLevel0TitleChangedSpy);

		oLevel0HomeRouteMatchedSpy.getCall(0).returnValue.then(function(oObject) {
			assert.equal(oFireRouteMatchedSpy.callCount, 2, "The method 'fireRouteMatched' is called twice");
			assert.equal(oFireTitleChangedSpy.callCount, 2, "The method 'fireTitleChanged' is called twice");
			assert.ok(oFireRouteMatchedSpy.getCall(1).calledBefore(oLevel0TitleChangedSpy.getCall(0)), "The route matched event is called before the title changed event");
			assert.equal(oLevel0TitleChangedSpy.callCount, 1, "initialize(): fireTitleChange should be called the first time - Component title");
			var oTitleChangedEvent = oLevel0TitleChangedSpy.getCall(0).args[0];
			assert.equal(oTitleChangedEvent.getParameter("title"), "TitleNestedView1", "initialize(): title 'TitleNestedView1' should be correct");
			assert.equal(oTitleChangedEvent.getParameter("history").length, 0, "initialize(): The history shouldn't have any entries");
			assert.equal(oTitleChangedEvent.getParameter("propagated"), true, "initialize(): titleChanged event is propagated from nested router");
			assert.ok(oTitleChangedEvent.getParameter("nestedHistory"), "initialize(): The nested history should be available");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory").length, 2, "initialize(): The nested history should have two entries");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].ownerComponentId, "parent", "initialize(): The first nested history entry should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[0].history.length, 0, "The history of the first nested history entry should have no entries");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].ownerComponentId, "parent---component8", "initialize(): The second nested history entry should be correct");
			assert.equal(oTitleChangedEvent.getParameter("nestedHistory")[1].history.length, 1, "initialize(): The history of the second nested history entry should have one entry");
			assert.deepEqual(oTitleChangedEvent.getParameter("nestedHistory")[1].history[0], {
				title: "TitleNestedView1",
				hash: ""
			}, "initialize(): The nested history entries should be correct");

			oLevel0Component.destroy();
			oLevel0HomeRouteMatchedSpy.restore();
			oFireTitleChangedSpy.restore();
			oFireRouteMatchedSpy.restore();
			done();
		});
	});
});
