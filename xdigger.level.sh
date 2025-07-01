#!/bin/bash

i=0;

(
echo -n "
// SPDX-License-Identifier: GPL-3.0
// jdigger/levels30.js - original Leveldatei von http://lanale.de/
// Copyright (C) 2017–2025  Marko Klingner

room = new Array(
";
while [ $i -lt 4680 ]
do
	xxd -s$i -l156 -i -c10 -a xdigger.level; 
	i=$[ $i+156 ]; 
done | \
	sed 's|unsigned\ char\ xdigger\_level\[\]\ \=|new\ Array|g' | \
	sed -z 's|\nunsigned\ int\ xdigger\_level\_len\ \=\ 156\;||g' | \
	sed 's|\ {|\(|g' | \
	sed -z 's|\n\}\;|\)\,|g' | \
	sed '$aende' | \
	sed -z 's|,\nende|\n);|g';
) > levelsx1.js

