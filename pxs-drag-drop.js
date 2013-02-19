/*
 * An attempt to control the flair stuff
 */
Ext.define('PXSDrag',{
	extend: 'Rally.ui.grid.plugin.DragDrop',
	requires: ['PXSRanker'],
	alias: 'plugin.pxsdragdrop',
	init: function() {
		this.callParent(arguments);
		this.enable();  // assuming we're starting ranked.  Data load isn't kicking this off!
	},
	/* not sure why the thumbs are failing without this */
    _showRankColumn: function() {
        if ( this.view && this.view !== null ) {
	        if (!this.view.hasCls(this.rankEnabledCls)) {
	            this.view.addCls(this.rankEnabledCls);
	        }
        }
    },
    _setupViewScroll: function() {
        var el = this.view.getEl();

        el.ddScrollConfig = {
            vthresh: 20,
            hthresh: -1,
            frequency: 50,
            increment: 500
        };
        Ext.dd.ScrollManager.register(el);
    },
	_getRanker: function() {
        if (!this.ranker) {
            var store = this.view.getStore(),
                config = {store: store};

            if (store.model.elementName === 'Task') {
                config.rankField = 'TaskIndex';
                config.relativeRankPrefix = 'taskIndex';
            }
            this.ranker = Ext.create('PXSRanker', config);
        }

        return this.ranker;
    }
});