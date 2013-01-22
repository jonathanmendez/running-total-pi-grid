/*
 * A dialog that allows the user to pick a field and a value
 * 
 * @example
 * Ext.create('Rally.pxs.dialog.FieldEditDialog, {
 *      fieldCfgs: [ { label: 'FieldName', editor: 'rallytextfield' } ],
 *      saveLabel: 'Save',
 *      saveFn: function() {
 *          // do something awesome
 *      }
 * }).show();
 */
 Ext.define( 'Rally.pxs.dialog.FieldEditDialog', {
    extend: 'Rally.ui.dialog.Dialog',
    alias: 'widget.pxsfieldeditdialog',
    width: 350,
    closable: true,
    config: {
        /**
         * @cfg {String}
         * Title to give to the dialog
         */
         title: 'Apply Change To All Selected Records',
         
         /**
          * @cfg {String}
          * The label for the save button
          */
          saveLabel: 'Save',
          
          /**
           * @cfg {Function}
           * Function called when the save button is pushed
           * @param {Rally.pxs.dialog.FieldEditDialog} this
           * @param {String} newValue
           */
           saveFn: Ext.emptyFn,
           
           /**
            * @cfg {Function}
            * Function called when the cancel button is pushed
            */
            cancelFn: Ext.emptyFn,
            
            /**
             * @cfg {Object}
             * Scope to call the functions with
             */
             scope: undefined,
             
             /**
              * @cfg {Object}
              * An array of objects with two fields: label: label to show, editor: same as column editor
              */
              fieldCfgs: []
    },
    items: {
        xtype: 'panel',
        border: false,
        items: [
            { xtype: 'container', layout: 'hbox', defaults: {padding: 10}, items: [
	            { xtype: 'container', itemId: 'field_selector' },
	            { xtype: 'container', itemId: 'field_editor' }
            ] }
        ]
    },
    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent(arguments);
    },
    initComponent: function() {
        this.callParent(arguments);

        this._addButtons();
        this._createFieldSelector();
    },
    _createFieldSelector: function() {
        if ( this.config.fieldCfgs.length === 0 ) {
            throw "no fieldCfgs provided to 'pxsfieldeditdialog";
        }
        var store = Ext.create('Ext.data.Store', {
            fields: [ 'label', 'editor' ],
            data: this.config.fieldCfgs
        });
        this.field_selector = Ext.create('Ext.form.field.ComboBox', {
            store: store,
            queryMode: 'local',
            displayField: 'label',
            valueField: 'editor',
            listeners: {
                scope: this,
                change: function(field,newValue) {
                    if ( this.down('#field_box') ) { 
                        this.down('#field_box').destroy(); 
                    }
                    if ( typeof(newValue) === "string" ) {
                       this.down('#field_editor').add({ 
	                        xtype: newValue,
                            itemId: "field_box"
	                    }); 
                    } else {
                        newValue["itemId"] = "field_box";
                        this.down('#field_editor').add(newValue);
                    }
                    
                }
            }
        });
        
        this.down('#field_selector').add(this.field_selector);
    },
    _addButtons: function() {
        var that = this;
        this.down('panel').addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            padding: '0 0 10 0',
            layout: {
                pack: 'center'
            },
            ui: 'footer',
            items: [
            {
                xtype: 'rallybutton',
                text: this.config.saveLabel,
                handler: function() {
                    this.config.saveFn.call(this.config.scope, this, this.field_selector.getRawValue(),  this.down('#field_box').getValue());
                    this.close();
                },
                scope: this
            },
            {
                xtype: 'rallybutton',
                text: 'Cancel',
                handler: function() {
                    this.config.cancelFn.call(this.config.scope);
                    this.close();
                },
                scope: this,
                ui: 'link'
            }
            ]
        });
    }
 });