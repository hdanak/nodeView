#!/usr/bin/env perl
use JavaScript::Minifier qw/minify/;

my $source_url = $ARGV[0]
minify(
    input   => *STDIN,
    outfile => *STDOUT,
    copyright => <<"END",
nodeView.js
Copyright 2013 Hike Danakian
Released under the GNU Lesser GPL v.3
License: http://www.gnu.org/licenses/lgpl-3.0.html
Source:  $source_url
END
);
