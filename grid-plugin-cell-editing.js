/**
 * Temporary hack to remove publishing message so that editing in-line 
 * doesn't refresh the whole app
 */

/**
 * @private
 * Plugin for grid cell editing
 */
Ext.define('Rally.ui.grid.plugin.CellEditing', {
    requires: ['Rally.ui.grid.OwnerEditor'],
    extend: 'Ext.grid.plugin.CellEditing',
    alias: 'plugin.rallycellediting',

    mixins: {
        messageable: 'Rally.Messageable'
    },

    triggerEvent: 'triggeredit',

    //=============================
    // Private method override danger zone
    //
    onEnterKey: Ext.emptyFn,

    onEscKey: function() {
        this.callParent(arguments);

        //Need to return true to prevent underlying key map
        //from stopping the escape key event in case other components need to handle it
        return true;
    },

    //
    // End private method override danger zone
    //=============================

    /**
     * @event recordupdatesuccess
     * Publishes the global {@link Rally.Message#recordUpdateSuccess} message when a record
     * is successfully updated via inline-editing
     * @param {Object[]} records The updated records
     */
    /**
     * @event recordupdatefailure
     * Publishes the global {@link Rally.Message#recordUpdateFailure} message when a record
     * is unsuccessfully updated via inline-editing
     */

    init: function() {
        this.callParent(arguments);

        this.grid.addEvents(
                /**
                 * @event
                 * Fires after an inline edit occurs
                 * @param {Rally.ui.grid.Grid} this
                 * @param {Ext.grid.plugin.Editing} editor The editor object from Ext.grid.plugin.CellEditing#edit
                 * @param {Object} event The e object from Ext.grid.plugin.CellEditing#edit
                 */
                'inlineEdit',
                /**
                 * @event
                 * Fires when an inline edit has been saved
                 * @param {Rally.ui.grid.Grid} this
                 * @param {Ext.data.Model[]} records The records array from Ext.data.Operation#callback
                 * @param {Ext.data.Operation} operation See Ext.data.Operation#callback
                 * @param {Ext.data.Model} record The original record that was updated
                 * @param {Ext.grid.column.Column) The column that was updated
                 */
                'inlineEditSaved'
        );

        this.mon(this.grid, 'edit', this._saveInlineEdit, this);
        this.mon(this.grid.getView(), 'uievent', this._onUiEvent, this);
        this.mon(this.grid, 'beforeedit', this._onBeforeEdit, this);
    },

    getEditor: function(record, column) {
        var editor = this.callParent(arguments);
        editor.completeOnEnter = false;
        return editor;
    },

    showEditor: function(ed, context, value) {
        this._onPossibleGridHeightChange();

        if (Ext.isFunction(ed.prepareEditor)) {
            var superclassShowEditorFn = Ext.bind(this.superclass.showEditor, this, [ed, context, value]);
            ed.prepareEditor(context, superclassShowEditorFn);
        } else {
            this.callParent(arguments);
        }

    },

    onSpecialKey: function(editor, field, event) {
        var keyCode = event.getKey(),
            sm;

        if (keyCode === event.ENTER && !editor.completeOnEnter) {
            event.stopEvent();
            this._preventExtFromDeferringOnBlur(field, editor);

            sm = this.grid.getSelectionModel();
            sm.onEditorEnter(this, field, event);
        }

        this.callParent(arguments);
    },

    cancelEdit: function() {
        var isEditorActive = this.getActiveEditor();
        this.callParent(arguments);
        if (isEditorActive) {
            this._onPossibleGridHeightChange();
        }
    },

    _saveInlineEdit: function(editor, event) {
        if (Ext.Object.getSize(event.record.getChanges()) > 0) {
            var grid = this.grid,
                record = this.context.record,
                column = this.context.column;

            grid.fireEvent('inlineEdit', this, editor, event);

            event.record.save({
                callback: function(records, operation) {
                    var success = operation.success;
                    if (success) {
//                        this.publish(Rally.Message.objectUpdate, records, this);
//                        this.publish(Rally.Message.recordUpdateSuccess, records);
                    } else {
                        this.publish(Rally.Message.recordUpdateFailure);
                    }

                    if(this.grid){
                        this.grid.fireEvent('inlineeditsaved', this, records, operation, record, column);
                        this._onPossibleGridHeightChange();
                        if(success){
                            Ext.each(records, function(record) {
                                this.grid.highlightRowForRecord(record);
                            }, this);
                        }
                    }
                },
                scope: this,
                params: {
                    fetch: grid.getAllFetchFields()
                }
            });
        }else{
            this._onPossibleGridHeightChange();
        }
    },

    _onPossibleGridHeightChange: function(){
        this.grid.doLayout();
    },

    _onUiEvent: function(type, view, cell, rowIndex, cellIndex, e) {
        var cellEl = Ext.fly(cell);
        if (cellEl) {
            if (type === 'mouseover') {
                cellEl.addCls('rally-edit-cell-over');
            } else if (type === 'mouseout') {
                cellEl.removeCls('rally-edit-cell-over');
            }
        }
    },

    _onBeforeEdit: function(editor, object, eOpts) {
        var cell = editor.grid.getView().getCell(object.record, object.column),
            cellEl = Ext.fly(cell);
        if (cellEl) {
            cellEl.removeCls('rally-edit-cell-over');
        }
    },

    _preventExtFromDeferringOnBlur: function (field, editor) {
        // Ext defers the handling of the onBlur event by 10 milliseconds for fields
        // inside of editors. This is breaking our own grid keyboard navigation when
        // pressing enter to go to the next row. So we need to use the base onBlur
        // method (because it is not deferred) just for our enter key handling. We
        // put back the original ext onBlur handler once we are done.
        var focusEl = field.getFocusEl(),
            nonDeferredOnBlur = function() {
                Ext.AbstractComponent.prototype.onBlur.call(field);
                focusEl.on('blur', field.onBlur, field);
            },
            nonDeferredFieldBlur = function(x, event) {
                editor.onFieldBlur.apply(editor, [field, event]);
                editor.mon(field, {
                    blur: {
                        fn: editor.onFieldBlur,
                        delay: 1
                    },
                    scope: editor
                });
            };

        // unregister the handlers that have delays and then register
        // handlers that doesn't have the delay
        focusEl.un('blur', field.onBlur, field);
        this.mon(focusEl, 'blur', nonDeferredOnBlur, field, {single:true});

        editor.mun(field, 'blur', editor.onFieldBlur, editor);
        editor.mon(field, 'blur', nonDeferredFieldBlur, editor, {single: true});
    }
});