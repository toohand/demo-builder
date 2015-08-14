// Generated by CoffeeScript 1.9.3

/**
 * 将CSS的debug文件push到生产目录，并将引用到的背景图片自动添加hash后缀
 * @date 2014-12-2 15:10:14
 * @author pjg <iampjg@gmail.com>
 * @link http://pjg.pw
 * @version $Id$
 */
var Tools, _, _buildCss, _buildMap, _cssDistPath, _cssMapPath, _cssPath, _hashLen, _imgMapPath, _mapPath, _stream, color, cssCtl, fs, gulp, gutil, mincss, path, plumber, setting;

fs = require('fs');

path = require('path');

_ = require('lodash');

setting = require('./setting');

gulp = require('gulp');

gutil = require('gulp-util');

mincss = require('gulp-minify-css');

plumber = require('gulp-plumber');

Tools = require('./Tools');

color = gutil.colors;

_cssPath = setting.cssPath;

_cssDistPath = setting.distPath + 'css';

_mapPath = setting.mapPath;

_hashLen = setting.hashLength;

_cssMapPath = path.join(_mapPath, setting.cssMap);

_imgMapPath = path.join(_mapPath, setting.imgMap);

_stream = function(files, cb, cb2) {
  var imgMap;
  imgMap = Tools.getImgMap();
  return gulp.src(files).pipe(plumber({
    errorHandler: Tools.errrHandler
  })).pipe(mincss({
    keepBreaks: false,
    compatibility: {
      properties: {
        iePrefixHack: true,
        ieSuffixHack: true
      }
    }
  })).on('data', function(source) {
    var _cssBgReg, _nameObj, _path, _source;
    _path = source.path.replace(/\\/g, '/').split(_cssPath)[1];
    _nameObj = path.parse(_path);
    _nameObj.hash = Tools.md5(source.contents);
    _cssBgReg = /url\s*\(([^\)]+)\)/g;
    _source = String(source.contents).replace(_cssBgReg, function(str, map) {
      var key, val;
      if (map.indexOf('fonts/') !== -1 || map.indexOf('font/') !== -1 || map.indexOf('#') !== -1) {
        return str;
      } else {
        key = map.replace('../img/', '').replace(/(^\'|\")|(\'|\"$)/g, '');
        val = _.has(imgMap, key) ? '../img/' + imgMap[key].distname : (map.indexOf('data:') > -1 || map.indexOf('about:') > -1 ? map : '../img/' + key + '?=t' + String(new Date().getTime()).substr(0, 8));
        return str.replace(map, val);
      }
    });
    return cb(_nameObj, _source);
  }).on('end', cb2);
};

_buildCss = function(_filePath, source) {
  Tools.mkdirsSync(path.dirname(_filePath));
  return fs.writeFileSync(_filePath, source, 'utf8');
};

_buildMap = function(map, cb) {
  var _newMap, _oldMap, jsonData;
  _oldMap = Tools.getJSONSync(_cssMapPath);
  _newMap = _.assign(_oldMap, map);
  jsonData = JSON.stringify(_newMap, null, 2);
  Tools.mkdirsSync(_mapPath);
  fs.writeFileSync(_cssMapPath, jsonData, 'utf8');
  return cb();
};


/*
 * css生产文件构建函数
 * @param {string} file 同gulp.src接口所接收的参数，默认是css源文件的所有css文件
 * @param {function} done 回调函数
 */

cssCtl = function(file, done) {
  var _count, _done, _file, cssMap;
  cssMap = {};
  _file = _cssPath + '**/*.css';
  if (typeof file === 'function') {
    _done = file;
  } else {
    _file = file || _file;
    _done = done || function() {};
  }
  setting.env !== 'dev' && gutil.log(color.yellow("Push Css to dist."));
  _count = 0;
  return _stream(file, function(obj, source) {
    var _distName, _distName2, _filePath, _filePath2, _source;
    _source = source;
    _distName = obj.dir + '/' + obj.name + '.' + obj.hash.substr(0, _hashLen) + obj.ext;
    _distName2 = obj.dir + '/' + obj.name + obj.ext;
    cssMap[obj.base] = {
      hash: obj.hash,
      distname: _distName.replace(/^\//, '')
    };
    _filePath = path.join(_cssDistPath, _distName);
    _filePath2 = path.join(_cssDistPath, _distName2);
    _buildCss(_filePath, _source);
    _buildCss(_filePath2, _source);
    return _count++;
  }, function() {
    return _buildMap(cssMap, function() {
      setting.env !== 'dev' && gutil.log(color.green(_count + " css files pushed!"));
      return _done();
    });
  });
};

module.exports = cssCtl;