Ext.define('PXSCellEdit',{
	extend: 'Rally.ui.grid.plugin.CellEditing',
	alias: 'plugin.pxscellediting',
	init: function() {
		this.callParent(arguments);
	},
	/* 
	 * at some point, the base plugin started putting the rally-edit-cell-over 
	 * class on the cell whether it was editable or not
	 * 
	 */
    _onUiEvent: function(type, view, cell, rowIndex, cellIndex, e) {
    	window.console && console.log( "_onUIEvent", type, rowIndex, cellIndex );
    	window.console && console.log( "gridview", this.grid.getView() );
    	window.console && console.log("record", this.grid.getView().getStore().getAt(rowIndex));
    	window.console && console.log( "column?", this.grid.columns[cellIndex]);
    	
    	
    	//window.console && console.log( "Editable? ", this.isCellEditable( {}, "" ));
    	if ( this.grid.columns[cellIndex] && this.grid.columns[cellIndex].editor ) {
	        var cellEl = Ext.fly(cell);
	        if (cellEl) {
	            if (type === 'mouseover') {
	                cellEl.addCls('rally-edit-cell-over');
	            } else if (type === 'mouseout') {
	                cellEl.removeCls('rally-edit-cell-over');
	            }
	        }
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
                        this.publish(Rally.Message.objectUpdate, records, this);
                        this.publish(Rally.Message.recordUpdateSuccess, records);
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
    }
});