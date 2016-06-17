/*
 * Watch Configuration
 *
 * Copyright (c) 2015 Thinknode Labs, LLC. All rights reserved.
 */

module.exports = {
    server: {
        options: {
            atBegin: true,
            spawn: false
        },
        files: [
            'public/**/*.js',
            'public/**/*.html',
            "app.js"
        ],
        tasks: ['express:server']
    }
};
