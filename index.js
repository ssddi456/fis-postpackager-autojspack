var path = require('path');
var main = function( ret, conf, settings, opt ) {
    var ns = fis.config.get('namespace');
    var root = fis.project.getProjectPath();
    var pkgs = [];
    var index = 0;

    var map = ret.map;

    var src = ret.src;
    var pkg = ret.pkg;

    var res = map.res;

    var mpkg = map.pkg;

    var aio = map.aio = {};

    var deps_map = {};
    function get_d_node(k) {
        deps_map[k] = deps_map[k] || { deps_by : {}};
        return deps_map[k];
    }

    src = (function(src){
        var ret = {};
        Object.keys(src).forEach(function( k ) {
            var node = src[k];
            ret[node.id] = node;
        });
        return ret;
    })(src);

    // 
    // walk through the map,  collect the deps
    // 
    Object.keys(res).forEach(function(k) {
        var node = res[k];
        if( node.type !== 'js' ){
            return;
        }

        var d_node = get_d_node(k);
        var deps = node.deps;
        if( !deps ){
            return;
        }
        var set_deps = false;

        deps.forEach(function(t) {
            var t_res_node = res[t];

            if(t_res_node && t_res_node.type === 'js'){

                // console.log('add deps_by', t, k);

                var t_node = get_d_node(t);

                t_node.deps_by[k] = 1;
                set_deps = true;
            }
        });

    });

    var entrans = Object.keys(deps_map)
                    .filter(function(k) {
                        return !Object.keys(deps_map[k].deps_by).length;
                    });

    function walk_dep_tree(cur_node, add_to_deps) {
        if(cur_node && cur_node.deps){
            cur_node.deps.forEach(function( dep ) {
                add_to_deps(dep);
                walk_dep_tree(res[dep], add_to_deps);
            });
        }
    }

    fis.log.warning( 'entrans plz check: \n' + JSON.stringify(entrans,null,2));

    entrans.forEach(function(k) {
        var e_node = res[k];
        var s_node = src[k];
        var deps = [];

        function add_to_deps(k) {
            var idx = deps.indexOf(k);
            // move this dep to the start of pack
            if(idx != -1){
                deps.splice(idx,1);
            }
            deps.push(k);
        }

        walk_dep_tree(e_node, add_to_deps);

        deps = deps.reverse();
        deps.push(k);

        var aio_f = fis.file(root, 
                        ns + '/static/aio/' 
                        + path.basename(s_node.basename, path.extname(s_node.basename)) 
                        +  '_aio.js');
        if( aio[aio_f.id] ){
            fis.log.warning('duplicate aio file : ' +  s_node.basename + ' with id : '+aio_f.id );
            return;
        }

        aio[aio_f.id] = {
            uri  : aio_f.getUrl(opt.hash, opt.domain),
            type : 'js',
            has  : deps
        };

        var content = '';

        deps.forEach(function( k ) {
            if(!src[k]){
                fis.log.warning('dep cannot found id: ' + k + ' with package :' + aio_f.id);
                return;
            }
            content += src[k].getContent() + '\n'; 
        });

        var assert = require('assert');
        assert(content != '', 'content must not be empty:\n' 
                                + JSON.stringify(aio_f,null,2) + '\n' 
                                + JSON.stringify(deps, null, 2));

        aio_f.setContent( content );
        pkg[aio_f.subpath] = aio_f;
    });

};

module.exports = function() {
    console.log('');// create an empty line for
    try{
        main.apply(null,[].slice.call(arguments));
    } catch(e){
        console.log( e );
        console.log( e.stack );
        throw e;
    }
};