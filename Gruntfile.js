module.exports = function (grunt) {

    require('load-grunt-config')(grunt, {
        jitGrunt: {
            customTasksDir: 'tasks',
            staticMappings: {
                configureProxies: 'grunt-connect-proxy',
                express: 'grunt-express-server',
                gitclone: 'grunt-git'
            }
        }
    });
};
