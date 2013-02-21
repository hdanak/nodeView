#!/usr/bin/env perl
use JavaScript::Minifier qw/minify/;

minify(
    input   => *STDIN,
    outfile => *STDOUT,
    copyright => <<'END',
nodeView.js
Copyright 2013 Hike Danakian
Released under the GNU Lesser GPL v.3
License: http://www.gnu.org/licenses/lgpl-3.0.html
Source:  https://github.com/hdanak/nodeView
END
);
