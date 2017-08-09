/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

var fs = require('fs');
var path = require('path');
var env = require('../generators/app/env');
var fallbackVersion = require('../generators/app/env-fallback').vsCodeEngine;

env.getLatestVSCodeVersion().then(function (version) {
    if (version !== fallbackVersion) {
        var fallbackFileName = path.join(__dirname, '../generators/app/env-fallback.js');
        fs.writeFileSync(fallbackFileName, 'module.exports.vsCodeEngine = "' + version + '";');
    }
});

