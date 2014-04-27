var mountFolder = function (connect, dir) {
	return connect.static(require('path').resolve(dir));
};
module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				separator: "\n\n"
			},
			dist: {
				src: [
					'src/main.js'
				],
				dest: 'dist/<%= pkg.name.replace(".js", "") %>.js'
			}
		},

		connect: {
      options: {
        port: 9001,
				hostname: 'localhost'
      },
		  dev: {
		    options: {
		      middleware: function (connect) {
		        return [
		          require('connect-livereload')(),
		          mountFolder(connect, './')
		        ];
		      }
		    }
		  }
	  },

	  open : {
	  	dev:{
	    	path: 'http://<%= connect.options.hostname %>:<%= connect.options.port %>/demo'
	  	}
    },

		uglify: {
			options: {
				banner: '/*! <%= pkg.name.replace(".js", "") %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'dist/<%= pkg.name.replace(".js", "") %>.min.js': ['<%= concat.dist.dest %>']
				}
			}
		},

		compass: {
			dev: {
				options: {
					sassDir: 'demo/assets/sass',
					cssDir: 'demo/assets',
					watch: true
				}
			},
			dist: {
				options: {
					sassDir: 'demo/assets/sass',
					cssDir: 'demo/assets'
				}
			}
		},

		jshint: {
			files: ['dist/FloatingMenu.js'],
			options: {
				globals: {
					console: true,
					module: true,
					document: true
				},
				jshintrc: '.jshintrc'
			}
		},

		watch: {
			sass: {
          files: ['**/sass/*.scss'],
          tasks: ['compass:dist'],
          options: {
						livereload: true
          }
      },
      others:{
				files: ['./src/*.js', '*/**.html'],
				tasks: ['concat'],
				options: {
					livereload: true
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-open');

	grunt.registerTask('serve', ['connect:dev', 'open', 'watch']);
	grunt.registerTask('default', ['concat', 'jshint', 'uglify', 'compass']);

};
