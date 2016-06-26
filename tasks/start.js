module.exports = function(grunt) {
    grunt.registerTask('start', 'Starts local server.', function() {
        if (grunt.option('watch') === true) {
            grunt.task.run('watch:server');
        } else {
            grunt.task.run('express:server', 'wait');
        }
    });
};