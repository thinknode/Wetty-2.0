module.exports = function (grunt) {
    grunt.registerTask('update-hterm', ['mkdir:tmp', 'gitclone:hterm', 'shell:build_hterm', 'clean']);
};