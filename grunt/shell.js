module.exports = {
    build_hterm: {
        command: 'LIBDOT_SEARCH_PATH=$(pwd) ./libdot/bin/concat.sh -i ./hterm/concat/hterm_all.concat -o ../../public/wetty/hterm_all.js',
        options: {
            execOptions: {
                cwd: './tmp/libapps'
            }
        }
    }
};