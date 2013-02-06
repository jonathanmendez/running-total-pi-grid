/**
 * @private
 * Plugin for grid drag and drop // hacked to change the responsiveness
 */
Ext.define('Rally.ui.grid.plugin.DragDrop2', {
    requires: ['Rally.data.Ranker', 'Rally.ui.grid.dragdrop.DragZone', 'Rally.ui.grid.dragdrop.DropZone'],
    extend : 'Ext.grid.plugin.DragDrop',
    alias : 'plugin.rallydragdrop2',

    rankEnabledCls: 'rank-enabled',

    clientMetrics: [
        {
            event: 'drop',
            defaultUserAction: 'artifact ranked by drag/drop'
        },
        {
            method: '_onInitDrag',
            defaultUserAction: 'artifact drag rank start'
        }
    ],

    init: function(view) {
    	window.console && console.log( "rdd2.init" );
        this.view = view;
        this.view.mon(this.view.getStore(), 'load', this._onStoreLoad, this);
        this.view.mon(this.view, 'drop', this._onDrop, this);
        this.view.headerCt.mon(this.view.headerCt, 'columnshow', this._setupRankColumn, this);
        this.callParent(arguments);
        this.enable();  // assuming we're starting ranked.  Data load isn't kicking this off!
    },

    destroy: function() {
        Ext.dd.ScrollManager.unregister(this.view.getEl());
        this.callParent(arguments);
    },

    enable: function() {
        this._showRankColumn();
        this.callParent(arguments);
    },

    disable: function() {
        this._hideRankColumn();
        this.callParent(arguments);
    },

    onViewRender: function() {
        this._setupViewScroll();
        this._setupRankColumn();
        this._enableDragDrop();
    },

    _setupViewScroll: function() {
        window.console && console.log(2);
        var el = this.view.getEl();

        el.ddScrollConfig = {
            vthresh: 20,
            hthresh: -1,
            frequency: 50,
            increment: 500
        };
        Ext.dd.ScrollManager.register(el);
    },

    _setupRankColumn: function() {
        var rankCol = this._getRankColumn();
        if (rankCol) {
            var rankField = this._getRanker().rankField;
            rankCol.getSortParam = function() {return rankField;};
        }
    },

    _enableDragDrop: function() {
        var _onBeforeDrag = Ext.bind(this._onBeforeDrag, this),
            onBeforeDrag = function() {
                if (this.callParent(arguments) === false || _onBeforeDrag.apply(this, arguments) === false) {
                    return false;
                }
            };

        this.dragZone = new Rally.ui.grid.dragdrop.DragZone({
            view: this.view,
            ddGroup: this.dragGroup || this.ddGroup,
            dragText: this.dragText,
            onBeforeDrag: onBeforeDrag
        });

        this.dropZone = new Rally.ui.grid.dragdrop.DropZone({
            view: this.view,
            ddGroup: this.dropGroup || this.ddGroup
        });
    },

    _getRankColumn: function() {
        var rankCol = this.view.headerCt.items.getAt(0);
        if (rankCol instanceof Rally.ui.grid.RankColumn) {
            return rankCol;
        }
        return null;
    },

    _userDraggingRankCell: function(event) {
        var rankCol = this._getRankColumn();
        if (rankCol && event.getTarget('.' + rankCol.tdCls)) {
            return true;
        }
        return false;
    },

    _setConstraints: function() {
        var dragDrop = this.dragZone;

        dragDrop.setInitPosition();

        var el = this.view.getEl(),
            gridCmp = Ext.ComponentQuery.query('#' + el.up('.rally-grid').id)[0],
            headerEl = gridCmp.headerCt.getEl(),
            xy = el.getXY(),
            top = dragDrop.initPageY - xy[1],
            padding = 3;

        dragDrop.setXConstraint(0, 0);
        dragDrop.setYConstraint(top, el.getHeight() - top - headerEl.getHeight() - padding);
    },

    _showRankColumn: function() {
        if ( this.view && this.view !== null ) {
	        if (!this.view.hasCls(this.rankEnabledCls)) {
	            this.view.addCls(this.rankEnabledCls);
	        }
        }
    },

    _hideRankColumn: function() {
        this.view.removeCls(this.rankEnabledCls);
    },

    _getRanker: function() {
        if (!this.ranker) {
            var store = this.view.getStore(),
                config = {store: store};

            if (store.model.elementName === 'Task') {
                config.rankField = 'TaskIndex';
                config.relativeRankPrefix = 'taskIndex';
            }
            this.ranker = Ext.create('Rally.data.Ranker', config);
        }

        return this.ranker;
    },

    _onBeforeDrag: function(dragData) {
        if (!this._userDraggingRankCell(dragData.event)) {
            return false;
        }

        this._onInitDrag();
    },

    _onInitDrag: function() {
        if (this.dropZone) {
            this.dropZone.onInitDrag(this.dragZone);
        }

        this._setConstraints();
    },

    _onStoreLoad: function() {
        if (this._getRanker().isRankable()) {
            this.enable();
        } else {
            this.disable();
        }
    },

    _onDrop: function(rowEl, dropData, overModel, dropPosition, opts) {
        var ranker = this._getRanker(),
            rankConfig = {
                recordToRank: dropData.records[0],
                relativeRecord: overModel,
                position: dropPosition,
                saveOptions: {
                    callback: this._onRank,
                    scope: this
                }
            };

        this.view.ownerCt.setLoading(true);
        ranker.rankRelative(rankConfig);
    },

    _onRank: function(record, operation) {
        this.view.ownerCt.setLoading(false);
        this.view.publish(Rally.Message.objectUpdate, record, this.view);
        Rally.ui.flair.FlairManager.hideAllFlairMessages();
    }
});
