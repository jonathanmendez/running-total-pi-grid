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
        { text: 'ID', dataIndex: 'FormattedID' },
        { text: 'Name', dataIndex: 'Name', flex: 1 },
        { text: 'Running Total', dataIndex: 'RunningTotal' },
        { text: 'Feature Estimate', dataIndex: 'FeatureEstimate' },
        { text: 'Planned Start', dataIndex: 'PlannedStartDate', renderer: renderUSDate },
        { text: 'Planned End', dataIndex: 'PlannedEndDate', renderer: renderUSDate },
        { text: 'State', dataIndex: 'State', renderer: renderFieldName },
        { text: 'Owner', dataIndex: 'Owner', renderer: renderFieldName },
        { text: 'Parent', dataIndex: 'Parent', renderer: renderFieldName }
    ],
    componentCls: 'app',
    items: [{ xtype: 'container', itemId: 'grid_box', height: 500 }],
    launch: function() {
    	this._getPIModel();
    },
    _getPIModel: function() {
    	Rally.data.ModelFactory.getModel({
    		type: 'PortfolioItem/Feature',
    		success: function(userStoryModel) {
    			this.model = userStoryModel;
    			this._addPIGrid();
    		},
    		scope: this
    	});
    },
    _addPIGrid: function() {
    	if ( this.model ) {
    		this.pigrid = Ext.create( 'Rally.ui.grid.Grid', {
    			model: this.model,
    			enableRanking: true,
	    		columnCfgs: this.columns,
                storeConfig: {
                    sorters: [ { property: 'Rank', direction: 'ASC' } ],
                    listeners: {
                        datachanged: function( store, opts ) {
                            console.log( "datachanged", store.getRecords() );
                            var records = store.getRecords();
                            var running_total = 0;
                            for ( var i=0; i<records.length; i++ ) {
                                var record = records[i];
                                var value = record.data[this.field_to_sum] || 0;
                                running_total += value;
                                record.data.RunningTotal = running_total;
                            }
                        },
                        scope: this
                    }
                }

    		});
	    	this.down('#grid_box').add(this.pigrid);
    	}
    }
});
