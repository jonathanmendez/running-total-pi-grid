/*global console, Ext */
Ext.override(Rally.env.Server, {
    getWsapiUrl: function(version) {
        return this.getContextUrl() + "/webservice/1.43";
    }
});
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
var renderRank = function(value, metaData, record, rowIndex, colIndex, store, view) {
    return rowIndex + 1;  
};
    
var renderId = function(value, metaData, record, rowIndex, colIndex, store, view) {
    var item = record.getData();
    var url = Rally.util.Navigation.createRallyDetailUrl(item);
    var formatted_string = "<a target='_top' href='" + url + "'>" + item.FormattedID + "</a>";
    return formatted_string;  
};

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    field_to_sum: 'LeafStoryPlanEstimateTotal',
    componentCls: 'app',
    items: [
        { xtype: 'container', itemId: 'grid_box', autoScroll: true },      
        { xtype: 'container',  
            layout: { 
                type: 'hbox'
            }, 
            items: [ 
                { xtype: 'container', margin: 5, layout: { type: 'hbox' }, items: [
		            { xtype: 'container', margin: 5, itemId: 'print_box' } 
                ]}
        ]}
    ],
    selected_rows: 0,
    launch: function() {
        window.console && console.log( "launch" );
        this._addPrintButton();
        this._setColumns();
    	this._getPIModel();
    },
    _getBaseURL: function() {
        var base_url = this.getContext().getWorkspace()._ref.replace(/slm[\w\W]*/,"");
        return base_url;
    },
    _setColumns: function() {
        var that = this;
        this.columns = [
	        { xtype: 'rallyrankcolumn', sortable: false },
          { text: ' ', dataIndex: 'Rank', width: 45, renderer: renderRank, sortable: false },
	        { text: 'ID', dataIndex: 'FormattedID', width: 50, renderer: renderId, sortable: false },
	        { text: 'Name', dataIndex: 'Name', editor: 'rallytextfield', flex: 2.5, sortable: false },
	        { text: 'Running Total', dataIndex: 'RunningTotal', flex: 0.5, sortable: false  },
	        { text: 'Feature Estimate', dataIndex: 'LeafStoryPlanEstimateTotal', flex: 0.5, sortable: false },
          { text: 'Commitment', dataIndex: 'Commitment', flex: 0.5, sortable: false },
          { text: 'Desired Commitment', dataIndex: 'DesiredCommitment', flex: 0.5, sortable: false },
          { text: 'Release', dataIndex: 'Release', renderer: renderFieldName, flex: 0.75, sortable: false },
          { text: 'Desired Release', dataIndex: 'DesiredRelease', flex: 0.75, sortable: false }
	    ];
    },
    _addPrintButton: function() {
        window.console && console.log( "_addPrintButton" );
        this.down('#print_box').add(Ext.create('Rally.ui.Button', { 
            text: 'Print',
            listeners: {
                click: {
                    fn: function() { this._print('grid_box'); },
                    scope: this
                }
            }
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
                filters: [
                    { property: 'TypeDef.Name', operator: 'contains', value: 'Feature' },
                    { property: 'Enabled', operator: '=', value: 'true' }
                    ]
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
    _getFilters: function() {
        var notDoneFilter = Ext.create('Rally.data.QueryFilter',
            { property: 'State.Name', operator: '!=', value: 'Done' });
        return notDoneFilter;
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
	            filters: that._getFilters(),
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
                            record.data._Selected = false;
	                    }
	                    
	    				this._addPIGrid();
	    			},
	                datachanged: function( store, opts ) {
	                    window.console && console.log( "data changed" );
	                    var records = store.getRecords();
	                    var running_total = 0;
	                    for ( var i=0; i<records.length; i++ ) {
	                        var record = records[i];
	                        var value = record.data[this.field_to_sum] || 0;
	                        running_total += value;
	                        record.set( "RunningTotal", running_total);
	                    }
                        window.console && console.log( "done data changed");
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
                autoScroll: true,
    			height: 675,
                enableEditing: false, /* cell editing puts the class on every column whether editable or not!*/
               /* selType: 'rallyrowmodel',
                selModel: {
                    selType: 'rallyrowmodel'
                },*/
    			viewConfig: {
    				plugins: [
    					{ ptype: 'pxsdragdrop' }
    				]
    			},
                plugins: [ { ptype: 'pxscellediting' } ],
	    		columnCfgs: this.columns,
	    		store: this.pi_store
    		});
    	    this.down('#grid_box').add(this.pi_grid);
    	}
    },
    _print: function() {
        var that = this;
        
        cols = that.columns;
        var hidden_window = Ext.create( 'Ext.window.Window', {
            title: '',
            width: 1048,
            height: 200,
            overflowX: 'hidden',
            layout: 'fit',
            items: [ { xtype: 'container', itemId: 'grid_box' } ]
        }).show();
        
        print_store = Ext.create('Rally.data.WsapiDataStore', {
            autoLoad: true,
            model: that.model,
            filters: that._getFilters(),
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
                    var hidden_grid = Ext.create( 'Rally.ui.grid.Grid', {
			            model: this.model,
			            // columnCfgs: this.columns.slice(1,this.columns.length),
                        columnCfgs: cols,
			            store: print_store,
                        overflowX: 'hidden',
                        margin: 5,
                        layout: 'fit',
			            showPagingToolbar: false,
			            listeners: {
			                viewready: function( grid, options ) {
                                window.console && console.log( "print grid view_ready" );
			                    var print_window = window.open('','', 'width=800,height=200');
			                    print_window.focus();
			                    print_window.document.write( '<html><head>');
			                    print_window.document.write('<title>Feature Print</title>');
			                    print_window.document.write('<link rel="Stylesheet" type="text/css" href="' + that._getBaseURL() + 'apps/2.0p5/rui/resources/css/rui.css" />');
			                    print_window.document.write('</head>');
			                    print_window.document.write('<body>');
			                    print_window.document.write( hidden_grid.getEl().getHTML() );
			                    print_window.document.write('</body>');
			                    print_window.document.write('</html>'); 
			                    
			                    hidden_window.hide();
			                    print_window.print();
                                print_window.close();
			                }
			            }
			        });
                    hidden_window.down('#grid_box').add( hidden_grid );
                },
                scope: this
            },
            fetch: that._getFetchFields()
        });  
    }
});
