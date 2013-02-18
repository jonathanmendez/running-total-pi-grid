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
    }
});