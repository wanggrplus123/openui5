/* global QUnit */

sap.ui.define([
	"sap/ui/thirdparty/sinon-4",
	"sap/ui/fl/write/api/LocalResetAPI",
	"sap/ui/fl/write/api/PersistenceWriteAPI",
	"sap/ui/fl/write/api/ChangesWriteAPI",
	"sap/ui/fl/Layer",
	"sap/ui/fl/Change",
	"sap/ui/fl/ChangePersistence",
	"sap/ui/fl/ChangePersistenceFactory",
	"sap/m/VBox",
	"sap/ui/fl/Utils"
], function(
	sinon,
	LocalResetAPI,
	PersistenceWriteAPI,
	ChangesWriteAPI,
	Layer,
	Change,
	ChangePersistence,
	ChangePersistenceFactory,
	VBox,
	FlUtils
) {
	"use strict";

	var sandbox = sinon.sandbox.create();

	function createChange (sChangeId, sSelectorId, oCustomDef) {
		return new Change(Object.assign(
			{
				fileName: sChangeId,
				fileType: "change",
				layer: Layer.CUSTOMER,
				selector: {
					id: sSelectorId
				}
			},
			oCustomDef
		));
	}

	QUnit.module("Reset/Restore", {
		beforeEach: function () {
			this.oFooElement = new VBox("fooElement");
			this.oBarElement = new VBox("barElement");
			this.oElement = new VBox("parentElement", {
				items: [
					this.oFooElement,
					this.oBarElement
				]
			});
			this.oComponent = {
				name: "MyComponent"
			};
			this.oChangePersistence = new ChangePersistence(this.oComponent);
			var aChanges = [
				createChange("foo", "fooElement"),
				createChange("foo2", "fooElement")
			];
			aChanges[0].setState(Change.states.PERSISTED);
			this.oChangePersistence.addChangeAndUpdateDependencies(this.oComponent, aChanges[0]);
			this.oChangePersistence.addDirtyChange(aChanges[1]);
			sandbox.stub(ChangePersistenceFactory, "getChangePersistenceForControl").returns(this.oChangePersistence);
		},
		afterEach: function () {
			sandbox.restore();
			this.oElement.destroy();
		}
	}, function () {
		QUnit.test("when the isEnabled check is called", function (assert) {
			assert.ok(
				LocalResetAPI.isResetEnabled(this.oFooElement, {
					layer: Layer.CUSTOMER
				}),
				"then it returns true if at least one change exists"
			);

			assert.notOk(
				LocalResetAPI.isResetEnabled(this.oBarElement, {
					layer: Layer.CUSTOMER
				}),
				"then it returns false if no change exists"
			);
		});

		QUnit.test("when changes are reset", function (assert) {
			var aNestedChanges = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER
			});
			var oRemoveStub = sandbox.stub(PersistenceWriteAPI, "remove");
			var oRevertStub = sandbox.stub(ChangesWriteAPI, "revert").resolves();
			return LocalResetAPI.resetChanges(aNestedChanges, this.oComponent).then(function () {
				assert.strictEqual(oRemoveStub.callCount, 2, "Then all changes are removed");
				assert.strictEqual(oRevertStub.callCount, 2, "Then all changes are reverted");
				assert.strictEqual(
					oRevertStub.firstCall.args[0].change.getFileName(),
					"foo2",
					"then the changes are reverted in the correct order"
				);
			});
		});

		QUnit.test("when a reset is restored", function (assert) {
			var aNestedChanges = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER
			});
			sandbox.stub(PersistenceWriteAPI, "remove").callsFake(function (aArguments) {
				// Simulate deletion to validate that the state is restored
				this.oChangePersistence.deleteChange(aArguments.change);
			}.bind(this));
			sandbox.stub(ChangesWriteAPI, "revert").resolves();

			return LocalResetAPI.resetChanges(aNestedChanges, this.oComponent).then(function () {
				var oAddStub = sandbox.stub(PersistenceWriteAPI, "add");
				var oApplyStub = sandbox.stub(ChangesWriteAPI, "apply").resolves();

				return LocalResetAPI.restoreChanges(aNestedChanges, this.oComponent).then(function () {
					assert.strictEqual(oAddStub.callCount, 2, "Then all changes are added again");
					assert.strictEqual(oApplyStub.callCount, 2, "Then all changes are applied again");
					assert.strictEqual(
						oApplyStub.firstCall.args[0].change.getFileName(),
						"foo",
						"then the changes are applied in the correct order"
					);
					assert.deepEqual(
						aNestedChanges.map(function (oChange) {
							return oChange.getState();
						}),
						[Change.states.PERSISTED, Change.states.NEW],
						"then the original change states are restored"
					);
					assert.notOk(
						this.oChangePersistence.getDirtyChanges().includes(aNestedChanges[0]),
						"then dirty changes from deletion are removed"
					);
				}.bind(this));
			}.bind(this));
		});
	});

	QUnit.module("Nested change collection", {
		beforeEach: function () {
			this.oElement = new VBox("element", {
				items: [
					new VBox("childElement")
				]
			});
			this.oParentElement = new VBox("parentElement", {
				items: [
					this.oElement,
					new VBox("siblingElement")
				]
			});
			var oComponent = {
				name: "MyComponent"
			};
			this.oChangePersistence = new ChangePersistence(oComponent);
			sandbox.stub(FlUtils, "getComponentClassName").returns(oComponent.name);
		},
		afterEach: function () {
			sandbox.restore();
			this.oParentElement.destroy();
		}
	}, function () {
		QUnit.test("when the checked control is the selector of a change", function (assert) {
			var aChanges = [createChange("foo", "element")];
			sandbox.stub(ChangePersistence.prototype, "getAllUIChanges").returns(aChanges);
			var aNestedChanges = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER
			});

			assert.strictEqual(
				aNestedChanges.length,
				1,
				"then the change is detected as a nested change"
			);
		});

		QUnit.test("when the selector of a change is part of the searched control tree", function (assert) {
			var aChanges = [
				createChange("foo", "element"),
				createChange("bar", "childElement")
			];
			sandbox.stub(ChangePersistence.prototype, "getAllUIChanges").returns(aChanges);
			var aNestedChanges = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER
			});

			assert.strictEqual(
				aNestedChanges.length,
				2,
				"then the change is detected as a nested change"
			);
		});

		QUnit.test("when a dependent selector of a change is part of the searched control tree", function (assert) {
			var aChanges = [createChange("foo", "element", {
				dependentSelector: {
					someDependentSelector: {
						id: "childElement"
					}
				}
			})];
			sandbox.stub(ChangePersistence.prototype, "getAllUIChanges").returns(aChanges);
			var aNestedChanges = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER
			});

			assert.strictEqual(
				aNestedChanges.length,
				1,
				"then the change is detected as a nested change"
			);
		});

		QUnit.test("when a change was already deleted", function (assert) {
			var aChanges = [createChange("foo", "element")];
			aChanges[0].setState(Change.states.DELETED);
			sandbox.stub(ChangePersistence.prototype, "getAllUIChanges").returns(aChanges);
			var aNestedChanges = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER
			});

			assert.strictEqual(
				aNestedChanges.length,
				0,
				"then the change is not detected as a nested change"
			);
		});

		function getFilenamesForChanges (aChanges) {
			return aChanges.map(function (oChange) {
				return oChange.getFileName();
			});
		}

		QUnit.test("when a variant reference is specified", function (assert) {
			var aChanges = [
				createChange("foo", "element", {
					variantReference: "fooVariant"
				}),
				createChange("bar", "element", {
					variantReference: "someOtherVariantManagementId"
				}),
				createChange("baz", "element")
			];
			sandbox.stub(ChangePersistence.prototype, "getAllUIChanges").returns(aChanges);

			var aNestedChangesForFooVariant = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER,
				currentVariant: "fooVariant"
			});
			assert.deepEqual(
				getFilenamesForChanges(aNestedChangesForFooVariant),
				["foo"],
				"then the foo change is detected as a nested change of foo variant"
			);

			var aNestedChangesWithoutVariant = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER
			});
			assert.deepEqual(
				getFilenamesForChanges(aNestedChangesWithoutVariant),
				["baz"],
				"then the baz change is detected as a nested change without variant"
			);
		});

		QUnit.test("when the selector of a change is the parent of the searched element", function (assert) {
			var aChanges = [createChange("foo", "parentElement")];
			sandbox.stub(ChangePersistence.prototype, "getAllUIChanges").returns(aChanges);
			var aNestedChanges = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER
			});

			assert.strictEqual(
				aNestedChanges.length,
				0,
				"then the change is not detected as a nested change"
			);
		});

		QUnit.test("when the selector of a change is a sibling of the searched element", function (assert) {
			var aChanges = [createChange("foo", "siblingElement")];
			sandbox.stub(ChangePersistence.prototype, "getAllUIChanges").returns(aChanges);
			var aNestedChanges = LocalResetAPI.getNestedUIChangesForControl(this.oElement, {
				layer: Layer.CUSTOMER
			});

			assert.strictEqual(
				aNestedChanges.length,
				0,
				"then the change is not detected as a nested change"
			);
		});
	});

	QUnit.done(function () {
		jQuery("#qunit-fixture").hide();
	});
});