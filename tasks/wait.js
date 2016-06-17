/*
 * Wait Task
 *
 * Copyright (c) 2015 Thinknode Labs, LLC. All rights reserved.
 */


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export task

module.exports = function(grunt) {

    /**
     * @summary Grunt task that never finishes (i.e., waits forever).
     * @description
     * This task performs no tasks and simply waits forever. This task is used in conjunction
     * with other tasks that would otherwise pass control flow back to grunt (like express).
     */
    grunt.registerTask('wait', 'Waits forever (used with express tasks).', function() {
        this.async();
    });
};