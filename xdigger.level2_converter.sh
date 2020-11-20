#!/bin/bash

i=0;

(
echo -n "

//     jdigger/Digger.JS
//     Copyright (C) 2017  Marko Klingner
//
//     Dieses Programm ist freie Software. Sie können es unter den Bedingungen der GNU General Public License,
//     wie von der Free Software Foundation veröffentlicht, weitergeben und/oder modifizieren, entweder gemäß
//     Version 3 der Lizenz oder (nach Ihrer Option) jeder späteren Version.
//
//     Die Veröffentlichung dieses Programms erfolgt in der Hoffnung, daß es Ihnen von Nutzen sein wird, aber
//     OHNE IRGENDEINE GARANTIE, sogar ohne die implizite Garantie der MARKTREIFE oder der VERWENDBARKEIT FÜR
//     EINEN BESTIMMTEN ZWECK. Details finden Sie in der GNU General Public License.
//
//     Sie sollten ein Exemplar der GNU General Public License zusammen mit diesem Programm erhalten haben.
//     Falls nicht, siehe <http://www.gnu.org/licenses/>.


// original Leveldatei generiert aus *xdigger.level2*
room = new Array(
";
while [ $i -lt 4680 ]
do
	xxd -s$i -l156 -i -c10 -a xdigger.level2;
	i=$[ $i+156 ];
done | \
	sed 's|unsigned\ char\ xdigger\_level2\[\]\ \=|new\ Array|g' | \
	sed -z 's|\nunsigned\ int\ xdigger\_level2\_len\ \=\ 156\;||g' | \
	sed 's|\ {|\(|g' | \
	sed -z 's|\n\}\;|\)\,|g' | \
	sed '$aende' | \
	sed -z 's|,\nende|\n);|g';
) > levelsx2.js
