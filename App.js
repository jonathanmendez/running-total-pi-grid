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
    componentCls: 'app',
    items: [
        { xtype: 'container',  layout: { type: 'hbox' }, items: [ 
            { xtype: 'container', margin: 5, itemId: 'date_box' }, 
            { xtype: 'container', margin: 5, itemId: 'button_box' } 
        ]},
        { xtype: 'container', itemId: 'grid_box' }
    ],
    launch: function() {
        window.console && console.log( "launch" );
        this._addDatePicker();
        this._addPrintButton();
        this._setColumns();
    	this._getPIModel();
    },
    _setColumns: function() {
        this.columns = [
	        { xtype: 'rallyrankcolumn' },
	        { text: 'ID', dataIndex: 'FormattedID', flex: 0.25 },
	        { text: 'Name', dataIndex: 'Name', editor: 'rallytextfield', flex: 2.5 },
	        { text: 'Running Total', dataIndex: 'RunningTotal', flex: 0.5  },
	        { text: 'Feature Estimate', dataIndex: 'FeatureEstimate', editor: 'rallynumberfield', flex: 0.5 },
	        { text: 'Planned Start', dataIndex: 'PlannedStartDate', editor: 'rallydatefield', renderer: renderUSDate, flex: 0.75 },
	        { text: 'Planned End', dataIndex: 'PlannedEndDate', editor: 'rallydatefield', renderer: renderUSDate, flex: 0.75 },
	        { text: 'State', dataIndex: 'State', editor: this._getStateEditor(), renderer: renderFieldName, flex: 1.25 },
	        { text: 'Owner', dataIndex: 'Owner', renderer: renderFieldName, flex: 0.75 },
	        { text: 'Parent', dataIndex: 'Parent', renderer: renderFieldName, flex: 2 }
	    ];
    },
    _addDatePicker: function() {
        window.console && console.log( "_addDatePicker" );
        this.date_picker = Ext.create( 'Rally.ui.DateField',{
            fieldLabel: 'Planned Items After ',
            labelWidth: 125,
            value: Rally.util.DateTime.add( new Date(), "month", -1 ),
            listeners: {
                change: function( field, newValue, oldValue, eOpts ) {
                    this._getData();
                },
                scope: this
            }
        } );
        this.down("#date_box").add(this.date_picker);
    },
    _addPrintButton: function() {
        window.console && console.log( "_addPrintButton" );
        this.down('#button_box').add(Ext.create('Rally.ui.Button', { 
            text: 'Do Nothing'
        }));
        
    },
    _getStateEditor: function() {
        var editor = {
            xtype: 'rallycombobox',
            displayField: 'Name',
            valueField: '_ref',
            storeConfig: {
		        autoLoad: true,
		        model: 'State',
                filters: [{ property: 'TypeDef.Name', operator: 'contains', value: 'Feature' }]
		    }
        };
        return editor;
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
        window.console && console.log( this.date_picker.getValue() );
        var filters = [ { property: 'ObjectID', operator: '>', value: '0' }];
        if ( this.date_picker.getValue() ) {
            var iso_value = Rally.util.DateTime.toIsoString( this.date_picker.getValue() );
            filters = Ext.create('Rally.data.QueryFilter',
                { property: 'PlannedEndDate', operator: '=', value: "null" }).or( Ext.create( 'Rally.data.QueryFilter',
                { property: 'PlannedEndDate', operator: '>', value: iso_value }));
            window.console && console.log( filters.toString() );
            
        }
    	this.pi_store = Ext.create('Rally.data.WsapiDataStore', {
    		autoLoad: true,
    		model: that.model,
            filters: filters,
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
                this.pi_grid.destroy();
            } 
    		this.pi_grid = Ext.create( 'Rally.ui.grid.Grid', {
    			model: this.model,
    			height: 475,
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
});
