/*
 * Same as ranker, but won't show the flair when done!
 */
Ext.define('PXSRanker', {
	extend: 'Rally.data.Ranker',
	init: function() {
		this.callParent(arguments);
	},
	 /**
     * @param {Object} config Config object with the following parameters:
     *  recordToRank {Ext.data.Model} - the record being reranked
     *  relativeRecord {Ext.data.Model} - the record that recordToRank is being ranked before or after
     *  position {String} - the relative position ('before' or 'after')
     *  saveOptions {Object} - config object for {Ext.data.Operation}
     */
    rankRelative: function(config) {
        var saveOptions = Ext.merge({}, config.saveOptions),
            rankParamName = this.relativeRankPrefix + (config.position === 'after' ? 'Below' : 'Above');

        saveOptions.params = saveOptions.params || {};
        saveOptions.params[rankParamName] = config.relativeRecord.get('_ref');
        saveOptions.originalCallback = saveOptions.callback;
        saveOptions.callback = Ext.bind(this._rankRelativeCallback, this, [saveOptions], true);

        /* Rally.ui.flair.FlairManager.showStatusFlair({message: 'Moving...'}); */
        config.recordToRank.save(saveOptions);
    },

    _rankRelativeCallback: function(record, operation, saveOptions) {
        var formattedId = record.get('FormattedID'),
            name = record.get('Name'),
            recordText = '"' + (Ext.isEmpty(formattedId) ? '' : formattedId + ': ') + name + '"';

        if (operation.success) {
            /*Rally.ui.flair.FlairManager.showFlair({message: Ext.String.format('{0} has been moved.', recordText)}); */
        } else {
            /*Rally.ui.flair.FlairManager.showErrorFlair({message: Ext.String.format('Error moving {0}.', recordText)}); */
        }

        if (saveOptions.originalCallback) {
            saveOptions.originalCallback.call(saveOptions.scope || this, record, operation);
        }
    }
});