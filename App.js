/*global console, Ext */
var renderUSDate = function(value) {
    var display_value = "";
    if ( value ) {
        display_value = Rally.util.DateTime.format( value, 'm/d/Y');
    }
    return display_value;
};
var renderFieldName = function(value) {
    var display_value = "";
    if ( value ) {
        display_value = value._refObjectName;
    }
    return display_value;
};
    
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    field_to_sum: 'FeatureEstimate',
    columns: [
        { xtype: 'rallyrankcolumn' },
        { text: 'ID', dataIndex: 'FormattedID' },
        { text: 'Name', dataIndex: 'Name', editor: 'rallytextfield', flex: 1 },
        { text: 'Running Total', dataIndex: 'RunningTotal' },
        { text: 'Feature Estimate', dataIndex: 'FeatureEstimate', editor: 'rallynumberfield' },
        { text: 'Planned Start', dataIndex: 'PlannedStartDate', renderer: renderUSDate },
        { text: 'Planned End', dataIndex: 'PlannedEndDate', renderer: renderUSDate },
        { text: 'State', dataIndex: 'State', renderer: renderFieldName },
        { text: 'Owner', dataIndex: 'Owner', renderer: renderFieldName },
        { text: 'Parent', dataIndex: 'Parent', renderer: renderFieldName }
    ],
    componentCls: 'app',
    items: [{ xtype: 'container', itemId: 'grid_box' }],
    launch: function() {
        window.console && console.log( "launch" );
    	this._getPIModel();
    },
    _getPIModel: function() {
    	Rally.data.ModelFactory.getModel({
    		type: 'PortfolioItem/Feature',
    		success: function(our_model) {
    			this.model = our_model;
    			this._getData();
    		},
    		scope: this
    	});
    },
    _getFetchFields: function() {
        var fields = [];
        Ext.Array.each( this.columns, function( col ) {
        	if ( col && col.dataIndex ) {
        		fields.push( col.dataIndex );
        	}
        });
        return fields;
    },
    _getData: function() {
    	var that = this;
    	this.pi_store = Ext.create('Rally.data.WsapiDataStore', {
    		autoLoad: true,
    		model: that.model,
            sorters: [ { property: 'Rank', direction: 'ASC' } ],
    		listeners: {
    			load: function(store,data,success) {
                    window.console && console.log( "load" );
                    var records = store.getRecords();
                    var running_total = 0;
                    for ( var i=0; i<records.length; i++ ) {
                        var record = records[i];
                        var value = record.data[this.field_to_sum] || 0;
                        running_total += value;
                        record.data.RunningTotal = running_total;
                    }
                    
    				this._addPIGrid();
    			},
                datachanged: function( store, opts ) {
                    window.console && console.log( "datachanged" );
                    var records = store.getRecords();
                    var running_total = 0;
                    for ( var i=0; i<records.length; i++ ) {
                        var record = records[i];
                        var value = record.data[this.field_to_sum] || 0;
                        running_total += value;
                        record.set( "RunningTotal", running_total);
                        //record.data.RunningTotal = running_total;
                    }
                },
    			scope: this
    		},
    		fetch: that._getFetchFields()
    	});    
	},
    _addPIGrid: function() {
        window.console && console.log( "_addPIGrid" );
    	if ( this.model ) {
            if ( this.pi_grid ) { 
                window.console && console.log( "Already has a pi_grid" );
            } else {
	    		this.pi_grid = Ext.create( 'Rally.ui.grid.Grid', {
	    			model: this.model,
	    			height: 500,
	    			/*enableRanking: true,*/
	    			viewConfig: {
	    				plugins: [
	    					{ ptype: 'rallydragdrop2' }
	    				]
	    			},
		    		columnCfgs: this.columns,
		    		store: this.pi_store
	    		});
	    	  this.down('#grid_box').add(this.pi_grid);
            }
    	}
    }
});
