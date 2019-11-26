const gulp = require('gulp');
const cssnano = require('gulp-cssnano');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const beautify = require('gulp-beautify');
const babel = require('gulp-babel');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const pug = require('gulp-pug');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const merge = require('merge2');

// to read/create file
const fs = require('fs');
const { join } = require('path')
const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(join(p, f)).isDirectory())
const masterDirectory = 'dist/landingPage';
const createHTML = require('create-html');

// error handling
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');



/*** *** *** *** ***
	SASS
*** *** *** *** ***/
function style(){
	return gulp.src('app/style/*.scss')
	.pipe(sass())
	.pipe(gulp.dest('dist/style'))
	.pipe(browserSync.stream())
}

exports.style = style;


gulp.task('sass', function(){
   return gulp.src('app/style/*.scss')
       .pipe(autoprefixer({
            cascade: false,
            overrideBrowserslist: ['last 3 versions', 'ie > 9']
        }))   
      .pipe(sass())
      .pipe(cssnano())
      .pipe(concat('combined.min.css'))
      .pipe(gulp.dest('dist/style'));
});

gulp.task('minified', function(){
	return gulp.src('app/style/*.css')
       .pipe(autoprefixer({
            cascade: false,
            overrideBrowserslist: ['last 3 versions', 'ie > 9']
        }))
		.pipe(cssnano())
		//.pipe(concat('landing-min-3-1.css'))
		.pipe(gulp.dest('dist/style'));		
})

/*** *** *** *** ***
	BABEL
*** *** *** *** ***/ 
gulp.task('js', function(){
   return gulp.src(['app/js/*/*.js', 'app/js/*.js'])
        .pipe(babel({
            presets: ['@babel/env']
        })) 
      //  .pipe(concat('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js/'))
});

/*** *** *** *** ***
	Typescript
*** *** *** *** ***/

var tsProject = ts.createProject({
    declaration: true
});

gulp.task('typescript', function() {

return gulp.src('app/js/*.ts')
        .pipe(tsProject())
        .pipe(gulp.dest('script/js'));
});
 
gulp.task('ts', function () {
	gulp.watch(['app/js/**/*.ts', 'app/js/*.ts'], gulp.series('typescript'));
});


gulp.task('typescript2', function() {
    var tsResult = gulp.src('app/js/*.ts')
        .pipe(ts({
            declaration: true
        }));
 
	return merge([
        tsResult.dts.pipe(gulp.dest('dist/script/definitions')),
        tsResult.js.pipe(gulp.dest('dist/script/js'))
    ]);
});


/*** *** *** *** ***
	Landing Page 
*** *** *** *** ***/

function buildIndex() {
	console.log("here");
	const target = dirs(masterDirectory);
    let text = '';
			target.forEach(function(folder) {
			text += `<div class='folder'>`;  
			text += `<h1 class='folder folder--title'>${folder}</h1>
					  <br>`;
			
			// get all files into directory
			fs.readdirSync(masterDirectory+'/'+folder).forEach(file => {
			  text += `<a class='folder folder--link' href='${folder + '/' + file}'>
						 <h4 class='folder folder--title sub'>${file}</h4>
					  </a>
				 <br>`;
			});
			
			text += `</div>`;  
		});

		var html = createHTML({
		  title: 'Quick Links',
		  lang: 'en',
		  dir: 'ltl',
		  head: '<meta name="description" content="example">',
		  body: '<p>'+text+'</p>'
		})
		 
		fs.writeFile('dist/landingPage/index.html', html, function (err) {
		  if (err) console.log(err)
		})
}

gulp.task('buildIndex', function(done) {
  buildIndex()
  done();
});



gulp.task('views', function buildHTML() {
  return gulp.src('app/views/*.pug')
  .pipe(pug({
    // Your options in here.view
  }))
  .pipe(beautify.html({ indent_size: 2 }))
  .pipe(gulp.dest('dist/views/page/'))
});


// landing page task
gulp.task('viewsLP', function buildHTML() {
  return gulp.src(['app/views/*.pug', 'app/views/landing/**/*.pug'])
  .pipe(plumber({ errorHandler: function(err) {
            notify.onError({
                title: "Gulp error in " + err.plugin,
                message:  err.toString()
            })(err);
			
			console.log(err)
			this.emit('end')
        }}))
  .pipe(pug({
    // Your options in here.view
	pretty: true
  }))
  .pipe(beautify.html({ 
    indent_size: 2, 
    end_with_newline: true, 
	indent_empty_lines: true
  }))
  .pipe(gulp.dest('dist/LandingPage/'))
  .pipe(browserSync.stream())
});


function refresh(){
	browserSync.init({
		server:{
		  baseDir: './dist/LandingPage'
		}
	});
	
//	gulp.watch(['app/views/landing/**/*.pug', 'dist/LandingPage/**/*.html', 'dist/LandingPage/*.html' ], gulp.series('buildIndex'));	
	
	//landing page
	gulp.watch(['app/views/*.pug', 'app/views/landing/**/*.pug', 'app/views/content/*.pug', 'app/views/content/*/*.pug', 'app/views/mixins/*.pug'], gulp.series('viewsLP'));	
	
	// banner 
	gulp.watch(['app/views/banners/*.pug', 'app/views/banners/**/*.pug', 'app/views/mixins/banner.pug'], gulp.series('banners'));
	
	gulp.watch('app/**/*.pug').on('change', gulp.series('buildIndex'));
	gulp.watch('app/**/*.pug').on('change', browserSync.reload);
	
}

exports.auto = refresh;


// banners
gulp.task('banners', function buildHTML() {
  return gulp.src(['app/views/banners/**/**.pug', 'app/views/banners/*.pug'])
  .pipe(pug({
    // Your options in here.view
  }))
  
  .pipe(gulp.dest('dist/banners'))
});



// on save
gulp.task('watch', function(){
  //  gulp.watch('app/style/*.scss', ['sass']);
 //   gulp.watch('app/js/**/*.js', ['js']);
    gulp.series('sass');
});


// landing page
gulp.task('lp', function () {
	gulp.watch(['app/views/*.pug', 'app/views/landing/**/*.pug', 'app/views/content/*.pug', 'app/views/content/*/*.pug', 'app/views/mixins/*.pug'], gulp.series('viewsLP'));
});




// banners
gulp.task('banner', function () {
	gulp.watch(['app/views/banners/*.pug', 'app/views/banners/**/*.pug', 'app/views/mixins/banner.pug'], gulp.series('banners'));
});



gulp.task('default', function () {
    gulp.watch('app/style/*.scss', gulp.series('sass'));
	gulp.watch(['app/views/*.pug', 'app/views/content/*.pug'], gulp.series('views'));
	gulp.watch(['app/js/*/*.js', 'app/js/*.js'], gulp.series('js'));
});
