# Newscast.js

## About

A library to radically simplify Chromecast web app development.

See a simple [working example](http://apps.npr.org/newscast/examples/simple/). (You'll need a Chromecast, of course.)

Read the [API documentation](http://apps.npr.org/newscast/api/).

## Development tasks

Grunt configuration is included for running common development tasks.

Javascript can be linted with [jshint](http://jshint.com/):

```
grunt jshint
```

Uniminified source can be regenerated with:

```
grunt concat
```

Minified source can be regenerated with:

```
grunt uglify
```

API documentation can be generated with:

```
grunt jsdoc
```

The release process is documented [on the wiki](https://github.com/nprapps/newscast.js/wiki/Release-Process).

## License

Released under the MIT open source license. See `LICENSE` for details.

