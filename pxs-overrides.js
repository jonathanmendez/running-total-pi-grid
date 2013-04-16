/*
 * Overriding the _setOpacity because the IE workaround is breaking
 */
Ext.override(Rally.ui.grid.dragdrop.DragDropRowProxy,{
    
    _setOpacity: function(trEl, opacity) {
        trEl.setOpacity(opacity);
        if (Ext.isIE) {
            /*trEl.query('td').each(function(tdDom) {
                Ext.fly(tdDom).setOpacity(opacity);
            });*/
        }
    }
});
