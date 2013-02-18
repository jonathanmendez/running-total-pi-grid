/*
 * An attempt to control the flair stuff
 */
Ext.define('PXSDrag',{
	extend: 'Rally.ui.grid.plugin.DragDrop',
	requires: ['PXSRanker'],
	alias: 'plugin.pxsdragdrop',
	init: function() {
		this.callParent(arguments);
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