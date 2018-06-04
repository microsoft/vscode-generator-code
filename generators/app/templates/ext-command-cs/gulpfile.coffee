gulp = require 'gulp'
coffee = require 'gulp-coffee'
coffeelint = require 'gulp-coffeelint'
sourcemaps = require 'gulp-sourcemaps'

compileCoffee = ->
  gulp.src('./src/**/*.coffee')
  .pipe sourcemaps.init()
  .pipe coffee {
    bare: true
    transpile:
      presets: ['env']
  }
  .on 'error', (error)->
    console.log error.toString()
    @emit('end')
  .pipe sourcemaps.write()
  .pipe gulp.dest('./out')

gulp.task 'coffee', compileCoffee

gulp.task 'watch', ->
  compileCoffee()
  gulp.watch './src/**/*.coffee', [ 'lint', 'coffee' ]

gulp.task 'lint', ->
  gulp.src('./src/*.coffee')
  .pipe coffeelint()
  .pipe coffeelint.reporter()
